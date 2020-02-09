import { deflate as ideflate, deflateSync, gunzip as igunzip, gunzipSync, gzip as igzip, gzipSync, inflate as iinflate, inflateSync } from "zlib";
import { promisify } from "util";

export const gzip: (buf: Uint8Array) => Promise<Uint8Array> = promisify(igzip);
export const ungzip: (buf: Uint8Array) => Promise<Uint8Array> = promisify(igunzip);
export const inflate: (buf: Uint8Array) => Promise<Uint8Array> = promisify(iinflate);
export const deflate: (buf: Uint8Array) => Promise<Uint8Array> = promisify(ideflate);

export { gzipSync, gunzipSync, inflateSync, deflateSync };
