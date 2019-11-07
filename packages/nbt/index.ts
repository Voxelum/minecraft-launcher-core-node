import { deflate, deflateSync, gunzip, gunzipSync, gzip, gzipSync, inflate, inflateSync } from "zlib";
import NBT, { setZlib } from "./nbt";

setZlib({
    gzip(buffer) {
        return new Promise<Uint8Array>((resolve, reject) => {
            gzip(buffer, (e, r) => { if (e) { reject(e); } else { resolve(r); } });
        });
    },
    ungzip(buffer) {
        return new Promise((resolve, reject) => {
            gunzip(buffer, (err, r) => { if (err) { reject(err); } else { resolve(r); } });
        });
    },
    inflate(buffer) {
        return new Promise<Uint8Array>((resolve, reject) => {
            inflate(buffer, (e, r) => { if (e) { reject(e); } else { resolve(r); } });
        });
    },
    deflate(buffer) {
        return new Promise<Uint8Array>((resolve, reject) => {
            deflate(buffer, (e, r) => { if (e) { reject(e); } else { resolve(r); } });
        });
    },
    gzipSync(buffer) { return gzipSync(buffer); },
    ungzipSync(buffer) { return gunzipSync(buffer); },
    inflateSync(buffer) { return inflateSync(buffer); },
    deflateSync(buffer) { return deflateSync(buffer) },
});

export { NBT };

export default NBT;
