import { promisify } from "util";
import { setZlib } from "./utils";
import { deflate, deflateSync, gunzip, gunzipSync, gzip, gzipSync, inflate, inflateSync } from "zlib";

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

export * from "./nbt";
