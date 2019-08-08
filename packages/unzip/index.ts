import * as fs from "fs";
import * as path from "path";
import { finished, Readable, Writable } from "stream";
import * as util from "util";
import { Entry as yEntry, fromBuffer, fromFd, open as yopen, Options as yOptions, ZipFile as yZipFile, ZipFileOptions as yZipFileOptions } from "yauzl";

const mkdir0 = util.promisify(fs.mkdir);
const finishStream = util.promisify(finished);
const stat = util.promisify(fs.stat);

function ensureFile(file: string) {
    const dir = path.dirname(file);
    async function ensure(name: string) {
        try {
            await mkdir0(dir, { recursive: true });
        } catch (e) {
            const exists = await stat(name).then((s) => s.isDirectory(), (_) => false);
            if (exists) { return; }
            if (e.code === "EEXIST") { return; }
            if (e.code === "ENOENT") {
                try {
                    await ensure(path.dirname(name));
                    await mkdir0(name, { recursive: true });
                } catch (_) {
                    throw e;
                }
                return;
            }
            throw e;
        }
    }
    return ensure(dir);
}

type yOpenTarget = string | Buffer | number;

function walkEntries(zipfile: yZipFile, onEntry: (entry: yEntry) => Promise<any> | boolean | void) {
    return new Promise<void>((resolve, reject) => {
        function resolveResult(result: Promise<any> | boolean | void) {
            if (typeof result === "boolean") {
                if (result) {
                    resolve();
                } else if (zipfile.lazyEntries) {
                    zipfile.readEntry();
                }
            } else if (result instanceof Promise) {
                result.then((r) => {
                    resolveResult(r);
                }).catch((e) => {
                    reject(e);
                });
            } else {
                if (zipfile.lazyEntries) {
                    zipfile.readEntry();
                }
            }
        }
        zipfile.on("end", () => {
            resolve();
        });
        zipfile.on("entry", (entry: yEntry) => {
            resolveResult(onEntry(entry));
        });
        if (zipfile.lazyEntries) {
            zipfile.readEntry();
        }
    });
}

async function extractCachedInternal(zipfile: yZipFile, dest: string, entries: yEntry[], mapper: (e: yEntry) => string | undefined = (e) => e.fileName) {
    await Promise.all(entries.map((e) => {
        const relative = mapper(e);
        if (relative) {
            const file = path.resolve(dest, relative);
            return openEntryReadStream(zipfile, e)
                .then((stream) => ensureFile(file).then(() => stream.pipe(fs.createWriteStream(file))))
                .then(finishStream);
        }
        return Promise.resolve();
    }));
}

async function extractEntriesInternal(zipfile: yZipFile, dest: string, entries: string[], mapper: (e: yEntry) => string | undefined = (e) => e.fileName) {
    const set = new Set();
    for (const e of entries) { set.add(e); }
    const promises: Array<Promise<void>> = [];

    return new Promise<void>((resolve, reject) => {
        zipfile.on("entry", (entry: yEntry) => {
            if (set.has(entry.fileName)) {
                set.delete(entry.fileName);
                const relative = mapper(entry);
                if (relative) {
                    const file = path.resolve(dest, relative);
                    promises.push(openEntryReadStream(zipfile, entry)
                        .then((stream) => ensureFile(file).then(() => stream.pipe(fs.createWriteStream(file))))
                        .then(finishStream));
                }
            }
            if (set.size !== 0) {
                if (zipfile.lazyEntries) {
                    zipfile.readEntry();
                }
            } else {
                resolve(Promise.all(promises).then());
            }
        });
        zipfile.on("end", () => {
            resolve(Promise.all(promises).then());
        });
        if (zipfile.lazyEntries) {
            zipfile.readEntry();
        }
    }).finally(() => {
        if (!zipfile.autoClose) {
            zipfile.close();
        }
    });
}

function parseEntriesInternal(zipfile: yZipFile, entries: string[]) {
    let set: Set<any>;
    set = new Set();
    for (const e of entries) { set.add(e); }
    const result: any = {};

    return new Promise<{ [key: string]: yEntry }>((resolve, reject) => {
        zipfile.on("end", () => {
            resolve(result);
        });
        zipfile.on("entry", (entry: yEntry) => {
            if (set.has(entry.fileName)) {
                set.delete(entry.fileName);
                result[entry.fileName] = entry;
            }
            if (set.size !== 0) {
                if (zipfile.lazyEntries) {
                    zipfile.readEntry();
                }
            } else {
                resolve(result);
            }
        });
        if (zipfile.lazyEntries) {
            zipfile.readEntry();
        }
    });
}

function extractInternal(zipfile: yZipFile, dest: string, filter: (entry: yEntry) => string | undefined = (e) => e.fileName) {
    return new Promise<void>((resolve, reject) => {
        zipfile.once("end", () => {
            resolve();
        });
        zipfile.on("entry", (entry: yEntry) => {
            const mapped = filter(entry);
            if (mapped) {
                if (!entry.fileName.endsWith("/")) {
                    const file = path.resolve(dest, mapped);
                    openEntryReadStream(zipfile, entry)
                        .then((stream) => ensureFile(file).then(() => stream.pipe(fs.createWriteStream(file))))
                        .then(finishStream)
                        .then(() => {
                            if (zipfile.lazyEntries) {
                                zipfile.readEntry();
                            }
                        });
                } else if (zipfile.lazyEntries) {
                    zipfile.readEntry();
                }
            } else if (zipfile.lazyEntries) {
                zipfile.readEntry();
            }
        });
        if (zipfile.lazyEntries) {
            zipfile.readEntry();
        }
    }).finally(() => {
        if (!zipfile.autoClose) {
            zipfile.close();
        }
    });
}
function openEntryReadStream(zip: yZipFile, entry: yEntry, options?: yZipFileOptions) {
    return new Promise<Readable>((resolve, reject) => {
        if (options) {
            zip.openReadStream(entry, options, (err, stream) => {
                if (err || !stream) {
                    reject(err);
                } else {
                    resolve(stream);
                }
            });
        } else {
            zip.openReadStream(entry, (err, stream) => {
                if (err || !stream) {
                    reject(err);
                } else {
                    resolve(stream);
                }
            });
        }
    });
}
function openInternal(target: yOpenTarget, options: yOptions = {}): Promise<yZipFile> {
    if (typeof target === "string") {
        return new Promise<yZipFile>((resolve, reject) => {
            yopen(target, options, (err, zipfile) => {
                if (err) { reject(err); } else { resolve(zipfile); }
            });
        });
    } else if (target instanceof Buffer) {
        return new Promise<yZipFile>((resolve, reject) => {
            fromBuffer(target, options, (err, zipfile) => {
                if (err) { reject(err); } else { resolve(zipfile); }
            });
        });
    } else {
        return new Promise<yZipFile>((resolve, reject) => {
            fromFd(target, options, (err, zipfile) => {
                if (err) { reject(err); } else { resolve(zipfile); }
            });
        });
    }
}

async function createCahcedZipFile(file: yOpenTarget, option: yOptions = {}): Promise<Unzip.CachedZipFile> {
    const zip = await openInternal(file, { ...option, lazyEntries: true, autoClose: false });
    const entries: { [key: string]: yEntry } = {};
    await walkEntries(zip, (e) => { entries[e.fileName] = e; });
    return new CachedZip(zip, entries);
}

abstract class AbstractZip implements Unzip.ZipFile {
    get decodeStrings() { return this.delegate.decodeStrings; }
    get comment() { return this.delegate.comment; }
    get entryCount() { return this.delegate.entryCount; }
    get fileSize() { return this.delegate.fileSize; }
    get isOpen() { return this.delegate.isOpen; }
    get validateEntrySizes() { return this.delegate.validateEntrySizes; }
    constructor(
        protected delegate: yZipFile) { }

    async readEntry(entry: yEntry, options?: yZipFileOptions): Promise<Buffer> {
        const stream = await openEntryReadStream(this.delegate, entry, options);
        const buffers: Buffer[] = [];
        await finishStream(stream.pipe(new Writable({
            write(buffer, encoding, callback) {
                buffers.push(buffer);
                callback();
            },
            final(callback) {
                callback();
            },
        })));
        return Buffer.concat(buffers);
    }
    async openEntry(entry: yEntry, options?: yZipFileOptions): Promise<Readable> {
        return openEntryReadStream(this.delegate, entry, options);
    }
    close(): void {
        this.delegate.close();
    }
    async extractEntries(dest: string, mapper?: (e: yEntry) => undefined | string): Promise<void> {
        await extractInternal(this.delegate, dest, mapper);
    }
}

class LazyZip extends AbstractZip implements Unzip.LazyZipFile {
    get entriesRead() { return this.delegate.entriesRead; }
    get readEntryCursor() { return this.delegate.readEntryCursor; }
    constructor(delegate: yZipFile) {
        super(delegate);
    }
    nextEntry(): Promise<yEntry> {
        return new Promise<yEntry>((resolve, reject) => {
            this.delegate.once("entry", resolve);
            this.delegate.readEntry();
        });
    }
    async filterEntries(entries: string[]): Promise<yEntry[]> {
        const result = await parseEntriesInternal(this.delegate, entries);
        return Object.values(result).sort((a, b) => entries.indexOf(a.fileName) - entries.indexOf(b.fileName));
    }
    walkEntries(onEntry: (entry: yEntry) => boolean | void | Promise<any>): Promise<void> {
        return walkEntries(this.delegate, onEntry);
    }
}

class CachedZip extends AbstractZip implements Unzip.CachedZipFile {
    constructor(
        delegate: yZipFile,
        readonly entries: { [name: string]: yEntry; }) {
        super(delegate);
    }
    filterEntries(filter: (e: yEntry) => boolean): yEntry[] {
        return Object.values(this.entries).filter(filter) as yEntry[];
    }

    async extractEntries(dest: string, mapper?: (e: yEntry) => undefined | string): Promise<void> {
        await extractCachedInternal(this.delegate, dest, Object.values(this.entries), mapper);
    }
}
export declare namespace Unzip {
    abstract class ZipFile { }
    class CachedZipFile extends ZipFile { }
    class LazyZipFile extends ZipFile { }
}
export namespace Unzip {
    export type OpenTarget = string | Buffer | number;
    export interface ZipFileOptions {
        decompress?: boolean | null;
        decrypt?: boolean | null;
        start?: number | null;
        end?: number | null;
    }
    export interface Entry {
        readonly comment: string;
        readonly compressedSize: number;
        readonly compressionMethod: number;
        readonly crc32: number;
        readonly externalFileAttributes: number;
        readonly extraFieldLength: number;
        readonly extraFields: Array<{ id: number; data: Buffer }>;
        readonly fileCommentLength: number;
        readonly fileName: string;
        readonly fileNameLength: number;
        readonly generalPurposeBitFlag: number;
        readonly internalFileAttributes: number;
        readonly lastModFileDate: number;
        readonly lastModFileTime: number;
        readonly relativeOffsetOfLocalHeader: number;
        readonly uncompressedSize: number;
        readonly versionMadeBy: number;
        readonly versionNeededToExtract: number;

        getLastModDate(): Date;
        isEncrypted(): boolean;
        isCompressed(): boolean;
    }
    export interface Options {
        lazyEntries?: boolean;
        decodeStrings?: boolean;
        validateEntrySizes?: boolean;
        strictFileNames?: boolean;
    }
    interface LazyOptions extends Options {
        lazyEntries: true;
    }
    interface CacheOptions extends Options {
        lazyEntries?: false;
    }
    export interface ZipFile {
        readonly comment: string;
        readonly decodeStrings: boolean;
        readonly entryCount: number;
        readonly fileSize: number;
        readonly isOpen: boolean;
        readonly validateEntrySizes: boolean;

        readEntry(entry: Entry, options?: ZipFileOptions): Promise<Buffer>;
        openEntry(entry: Entry, options?: ZipFileOptions): Promise<Readable>;

        extractEntries(dest: string, mapper?: (e: Entry) => undefined | string): Promise<void>;

        close(): void;
    }
    export interface CachedZipFile extends ZipFile {
        readonly entries: { [name: string]: Entry | undefined };

        filterEntries(filter: (e: Entry) => boolean): Entry[];
    }

    export interface LazyZipFile extends ZipFile {
        readonly entriesRead: number;
        readonly readEntryCursor: boolean;

        nextEntry(): Promise<Entry>;

        /**
         * When you know which entries you want, you can use this function to get the entries you want at once.
         *
         * For more complex requirement, please use walkEntries.
         *
         * @param entries The entries' names you want
         */
        filterEntries(entries: string[]): Promise<Entry[]>;

        walkEntries(onEntry: (entry: Entry) => Promise<any> | boolean | void): Promise<void>;
    }

    export interface ParseStream extends Writable {
        wait(): Promise<LazyZipFile>;
    }

    export interface ParseEntriesStream extends Writable {
        wait(): Promise<CachedZipFile>;
    }

    export interface ExtractStream extends Writable {
        wait(): Promise<void>;
    }

    export interface WalkEntriesStream extends Writable {
        wait(): Promise<void>;
    }

    export function open(target: OpenTarget, options: CacheOptions): Promise<CachedZipFile>;
    export function open(target: OpenTarget, options: LazyOptions): Promise<LazyZipFile>;
    export function open(target: OpenTarget, options: CacheOptions | LazyOptions): Promise<LazyZipFile | CachedZipFile>;
    export function open(target: OpenTarget): Promise<CachedZipFile>;
    export async function open(target: OpenTarget, options: Options = {}) {
        if (options.lazyEntries === true) {
            return new LazyZip(await openInternal(target, { ...options, lazyEntries: true, autoClose: false })) as LazyZipFile;
        } else {
            return createCahcedZipFile(target, options);
        }
    }

    export function createParseStream(options?: CacheOptions): ParseEntriesStream;
    export function createParseStream(options?: LazyOptions): ParseStream;
    export function createParseStream(options?: Options) {
        return new ParseStreamImpl(options) as any; // sorry, ts cannot infer this i think
    }

    export function createParseEntriesStream(entries: string[]): ParseEntriesStream {
        return new ParseEntriesStreamImpl(entries);
    }

    export function createExtractStream(destination: string, entries?: string[] | ((entry: Entry) => string | undefined)): ExtractStream {
        return new ExtractStreamImpl(destination, entries);
    }

    export function createWalkEntriesStream(onEntry: (entry: Entry) => Promise<any> | boolean | undefined): WalkEntriesStream {
        return new WalkEntriesStreamImpl(onEntry);
    }

    class ZipFileStream<T> extends Writable {
        protected buffer: Buffer[] = [];
        protected _resolve!: (result: T | PromiseLike<T>) => void;
        protected _reject!: (error: any) => void;
        protected _promise = new Promise<T>((resolve, reject) => {
            this._resolve = resolve;
            this._reject = reject;
        });

        constructor() {
            super();
        }

        public _write(chunk: any, encoding: string, callback: (error?: Error | null) => void) {
            this.buffer.push(chunk);
            callback();
        }

        public wait(): Promise<T> {
            return this._promise;
        }
    }

    class WalkEntriesStreamImpl extends ZipFileStream<void> implements WalkEntriesStream {
        constructor(readonly onEntry: (entry: Entry) => Promise<any> | boolean | undefined) {
            super();
        }

        public _final(callback: (error?: Error | null) => void) {
            openInternal(Buffer.concat(this.buffer), { lazyEntries: true }).then((zip) => {
                walkEntries(zip, this.onEntry).then(() => {
                    callback();
                    this._resolve();
                }).catch(this._reject);
            }).catch((e) => {
                callback(e);
                this._reject(e);
            });
        }
    }

    class ParseStreamImpl extends ZipFileStream<LazyZipFile | CachedZipFile> {
        constructor(private option?: Options) {
            super();
        }

        public _final(callback: (error?: Error | null) => void) {
            const options = this.option || {};
            open(Buffer.concat(this.buffer), options.lazyEntries ? options as LazyOptions : options as CacheOptions).then((zip) => {
                callback();
                this._resolve(zip);
            }).catch((e) => {
                callback(e);
                this._reject(e);
            });
        }
    }

    class ParseEntriesStreamImpl extends ZipFileStream<CachedZipFile>  {
        constructor(readonly entries: string[]) {
            super();
        }

        public _final(callback: (error?: Error | null) => void) {
            openInternal(Buffer.concat(this.buffer), { lazyEntries: true }).then((zip) => {
                return parseEntriesInternal(zip, this.entries).then((entries) => {
                    this._resolve(new CachedZip(zip, entries));
                    callback();
                });
            }).catch((e) => {
                callback(e);
                this._reject(e);
            });
        }
    }

    class ExtractStreamImpl extends ZipFileStream<void> implements ExtractStream {
        constructor(readonly destination: string, readonly entries?: string[] | ((entry: Entry) => string | undefined)) {
            super();
        }

        public _final(callback: (error?: Error | null) => void) {
            openInternal(Buffer.concat(this.buffer), { lazyEntries: true, autoClose: false }).then((zip) => {
                let promise: Promise<any>;
                if (this.entries instanceof Array) {
                    promise = extractEntriesInternal(zip, this.destination, this.entries);
                } else if (typeof this.entries === "function") {
                    promise = extractInternal(zip, this.destination, this.entries);
                } else {
                    promise = extractInternal(zip, this.destination);
                }
                promise.then(() => {
                    callback();
                    this._resolve();
                }, (e) => {
                    callback(e);
                    this._reject(e);
                });
            }).catch((e) => {
                callback(e);
                this._reject(e);
            });
        }
    }

    /**
     * Extract the zip file with a filter into a folder. The default filter is filter nothing, which will unzip all the content in zip.
     *
     * @param zipfile The zip file
     * @param dest The destination folder
     * @param filter The entry filter
     */
    export async function extract(openFile: OpenTarget, dest: string, filter?: (entry: Entry) => string | undefined) {
        const zipfile = await openInternal(openFile, { lazyEntries: true, autoClose: false });
        return extractInternal(zipfile, dest, filter);
    }

    /**
     * Extract the zipfile's entries into destiation folder. This will close the zip file finally.
     *
     * @param zipfile The zip file
     * @param dest The destination folder
     * @param entries The querying entries
     */
    export async function extractEntries(openFile: OpenTarget, dest: string, entries: string[]) {
        const zipfile = await openInternal(openFile, { lazyEntries: true, autoClose: false });
        return extractEntriesInternal(zipfile, dest, entries);
    }
}

Unzip.ZipFile = AbstractZip as any;
Unzip.LazyZipFile = LazyZip as any;
Unzip.CachedZipFile = CachedZip as any;

export default Unzip;
