import { CancelledError, TaskLooped, TaskState } from "@xmcl/task";
import { openEntryReadStream } from "@xmcl/unzip";
import { createWriteStream } from "fs";
import { join } from "path";
import { Readable, Writable } from "stream";
import { Entry, ZipFile } from "yauzl";
import { ensureFile, pipeline } from "./utils";

export interface EntryResolver {
    (entry: Entry): Promise<string> | string
}

export function getDefaultEntryResolver(): EntryResolver {
    return (e) => e.fileName;
}

export class UnzipTask extends TaskLooped<void> {
    private streams: [Readable, Writable][] = [];

    constructor(readonly zipFile: ZipFile, readonly entries: Entry[], destination: string, readonly resolver: EntryResolver = getDefaultEntryResolver()) {
        super();
        this._to = destination;
    }

    protected async handleEntry(entry: Entry, relativePath: string) {
        const file = join(this.to!, relativePath);
        if (this._state === TaskState.Cancelled) {
            throw new CancelledError(undefined);
        }
        if (this.isPaused) {
            await this._pausing;
        }
        const readStream = await openEntryReadStream(this.zipFile, entry);
        if (this.isCancelled) {
            throw new CancelledError(undefined);
        }
        if (this.isPaused) {
            await this._pausing;
        }
        await ensureFile(file);
        const writeStream = createWriteStream(file);
        readStream.on("data", (buf: Buffer) => {
            this._progress += buf.length;
            this.update(buf.length);
        });
        await pipeline(readStream, writeStream);
    }

    protected async process(): Promise<[boolean, void | undefined]> {
        const promises: Promise<void>[] = [];

        for (const e of this.entries) {
            const path = await this.resolver(e);
            this._total += e.uncompressedSize;
            promises.push(this.handleEntry(e, path));
        }

        this.update(0);

        await Promise.all(promises);

        return [true, undefined];
    }
    protected validate(): Promise<void> {
        return Promise.resolve();
    }
    protected shouldTolerant(e: any): boolean {
        return false;
    }
    protected async abort(isCancelled: boolean): Promise<void> {
        if (isCancelled) {
            for (const [read, write] of this.streams) {
                read.unpipe();
                read.destroy(new CancelledError(undefined));
                this.zipFile.close();
                write.destroy(new CancelledError(undefined));
            }
        } else {
            const promise = Promise.all(this.streams.map(([read]) => new Promise((resolve) =>
                read.once("pause", resolve))))
            for (const [read] of this.streams) {
                read.pause();
            }
            await promise;
        }
    }
    protected reset(): void { }
}
