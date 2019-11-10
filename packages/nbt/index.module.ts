import NBT, { setZlib } from "./nbt";
import pako from "pako";

setZlib({
    gzip(buffer) { return Promise.resolve(pako.gzip(buffer)); },
    gzipSync(buffer) { return pako.gzip(buffer); },
    ungzip(buffer) { return Promise.resolve(pako.ungzip(buffer)); },
    gunzipSync(buffer) { return pako.ungzip(buffer); },
    inflate(buffer) { return Promise.resolve(pako.inflate(buffer)); },
    deflate(buffer) { return Promise.resolve(pako.deflate(buffer)); },
    inflateSync(buffer) { return pako.inflate(buffer); },
    deflateSync(buffer) { return pako.deflate(buffer); },
});

export { NBT };

export default NBT;
