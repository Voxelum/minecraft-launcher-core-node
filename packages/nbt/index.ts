import { deflate, deflateSync, gunzip, gunzipSync, gzip, gzipSync, inflate, inflateSync } from "zlib";
import NBT, { setZlib } from "./nbt";
import { promisify } from "util";

setZlib({
    gzip: promisify(gzip),
    ungzip: promisify(gunzip),
    inflate: promisify(inflate),
    deflate: promisify(deflate),
    gzipSync,
    gunzipSync,
    inflateSync,
    deflateSync,
});

export { NBT };

export default NBT;
