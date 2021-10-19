import { Agent as HttpAgent } from "http";
import { Agent as HttpsAgent } from "https";
import { cpus } from "os";
/**
 * The http(s) agents object for requesting
 */
export interface Agents {
  http?: HttpAgent;
  https?: HttpsAgent;
}

export interface CreateAgentsOptions {
  /**
   * The suggested max concurrency of the download. This is not a strict criteria.
   *
   * This is used to generate the `agents` maxSocket.
   * If `agents` is assigned, this will be ignore.
   */
  maxSocket?: number;
  /**
   * The suggested max concurrency of the download. This is not a strict criteria.
   *
   * This is used to generate the `agents` maxFreeSocket.
   * If `agents` is assigned, this will be ignore.
   */
  maxFreeSocket?: number;
}

export function isAgents(agents?: Agents | CreateAgentsOptions): agents is Agents {
    if (!agents) { return false; }
    return "http" in agents || "https" in agents;
}

export function resolveAgents(agents?: Agents | CreateAgentsOptions): Agents {
    if (isAgents(agents)) { return agents; }
    return createAgents(agents);
}

/**
 * Default create agents object
 */
export function createAgents(options: CreateAgentsOptions = {}) {
    return {
        http: new HttpAgent({
            maxSockets: options.maxSocket ?? cpus().length * 4,
            maxFreeSockets: options.maxFreeSocket ?? 64,
            keepAlive: true,
        }),
        https: new HttpsAgent({
            maxSockets: options.maxSocket ?? cpus().length * 4,
            maxFreeSockets: options.maxFreeSocket ?? 64,
            keepAlive: true,
        })
    };
}

export async function withAgents<T extends { agents?: Agents | CreateAgentsOptions }, R>(options: T, scope: (options: T) => R) {
    if (!isAgents(options.agents)) {
        const agents = resolveAgents(options.agents);
        try {
            const r = await scope({ ...options, agents });
            return r;
        } finally {
            agents.http?.destroy();
            agents.https?.destroy();
        }
    } else {
        return scope(options);
    }
}
