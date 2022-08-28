import { BaseTask, CancelledError, TaskState } from "@xmcl/task";
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

export class UnzipTask extends BaseTask<void> {
    private streams: [Readable, Writable][] = [];
    private _onCancelled = () => { };

    constructor(readonly zipFile: ZipFile, readonly entries: Entry[], destination: string, readonly resolver: EntryResolver = getDefaultEntryResolver(), readonly interpreter: (input: Readable, file: string) => void = () => { }) {
        super();
        this._to = destination;
    }

    protected async handleEntry(entry: Entry, relativePath: string) {
        const file = join(this.to!, relativePath);
        if (this._state === TaskState.Cancelled) {
            throw new CancelledError();
        }

        const readStream = await openEntryReadStream(this.zipFile, entry);
        if (this.isCancelled) {
            throw new CancelledError();
        }
        if (this._state === TaskState.Paused) {
            readStream.pause();
        }

        await ensureFile(file);
        this.interpreter(readStream, file);
        const writeStream = createWriteStream(file);
        readStream.on("data", (buf: Buffer) => {
            this._progress += buf.length;
            this.update(buf.length);
        });
        this.streams.push([readStream, writeStream]);
        await pipeline(readStream, writeStream);
    }

    protected async runTask(): Promise<void> {
        const promises: Promise<void>[] = [];

        for (const e of this.entries) {
            const path = await this.resolver(e);
            if (this.isCancelled) {
                throw new CancelledError();
            }
            this._total += e.uncompressedSize;
            promises.push(this.handleEntry(e, path));
        }

        this.update(0);

        try {
            await Promise.all(promises);
        } catch (e) {
            if (e instanceof CancelledError) {
                this._onCancelled();
            }
            throw e;
        }
    }

    protected cancelTask(): Promise<void> {
        for (const [read, write] of this.streams) {
            read.unpipe();
            read.destroy(new CancelledError());
            this.zipFile.close();
            write.destroy(new CancelledError());
        }
        return new Promise((resolve) => {
            this._onCancelled = resolve;
        })
    }
    protected async pauseTask(): Promise<void> {
        const promise = Promise.all(this.streams.map(([read]) => new Promise((resolve) =>
            read.once("pause", resolve))))
        for (const [read] of this.streams) {
            read.pause();
        }
        await promise;
    }

    protected async resumeTask(): Promise<void> {
        const promise = Promise.all(this.streams.map(([read]) => new Promise((resolve) =>
            read.once("readable", resolve))));
        for (const [read] of this.streams) {
            read.resume();
        }
        await promise;
    }
}
