import { createHash } from 'crypto';
import { Agent as HttpAgent, ClientRequest, IncomingMessage, request, RequestOptions } from "http";
import { createReadStream } from 'fs';
import { Agent as HttpsAgent, request as requests } from "https";
import { URL } from "url";
import { pipeline } from "../utils";

export function isValidProtocol(protocol: string | undefined | null): protocol is "http:" | "https:" {
  return protocol === "http:" || protocol === "https:";
}

export function urlToRequestOptions(url: URL): RequestOptions {
  return {
    host: url.host,
    hostname: url.hostname,
    protocol: url.protocol,
    port: url.port,
    path: url.pathname + url.search,
  }
}

export function format(url: RequestOptions) {
  return `${url.protocol}//${url.host}${url.path}`
}

function mergeRequestOptions(original: RequestOptions, newOptions: RequestOptions) {
  let options = { ...original } as any;
  for (let [key, value] of Object.entries(newOptions)) {
    if (value !== null) {
      options[key] = value;
    }
  }
  return options as RequestOptions;
}

export function fetch(options: RequestOptions, agents: { http?: HttpAgent, https?: HttpsAgent } = {}) {
  return new Promise<{ request: ClientRequest, message: IncomingMessage }>((resolve, reject) => {
    function follow(options: RequestOptions) {
      if (!isValidProtocol(options.protocol)) {
        reject(new Error(`Invalid URL: ${format(options)}`));
      } else {
        let [req, agent] = options.protocol === "http:" ? [request, agents.http] : [requests, agents.https];
        let clientReq = req({ ...options, agent }, (m) => {
          if ((m.statusCode === 302 || m.statusCode === 301 || m.statusCode === 303 || m.statusCode === 308) && typeof m.headers.location === 'string') {
            m.resume();
            follow(mergeRequestOptions(options, urlToRequestOptions(new URL(m.headers.location))));
          } else {
            m.url = m.url || format(options);
            clientReq.removeListener("error", reject);
            resolve({ request: clientReq, message: m });
          }
        });
        clientReq.addListener("error", reject);
        clientReq.end();
      }
    }
    follow(options);
  });
}

/**
 * Join two urls
 */
export function joinUrl(a: string, b: string) {
  if (a.endsWith("/") && b.startsWith("/")) {
    return a + b.substring(1);
  }
  if (!a.endsWith("/") && !b.startsWith("/")) {
    return a + "/" + b;
  }
  return a + b;
}

export async function checksumFromFd(fd: number, destination: string, algorithm: string) {
  let hash = createHash(algorithm).setEncoding("hex");
  await pipeline(createReadStream(destination, { fd, autoClose: false }), hash);
  return hash.read();
}
