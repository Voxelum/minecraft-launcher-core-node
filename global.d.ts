
declare module "rusha" {
    function createWorker(): Worker;

    interface Hasher {
        update(text: string | Uint8Array): this;
        digest(): ArrayBuffer;
        digest(encoding: undefined): ArrayBuffer;
        digest(encoding: "hex"): string;
        digest(encoding?: "hex"): ArrayBuffer | string;
    }
    function createHash(): Hasher;
}