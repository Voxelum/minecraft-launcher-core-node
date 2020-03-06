import * as fs from "fs";
import * as path from "path";
import { Readable, Writable, finished } from "stream";
import * as util from "util";
import { fromBuffer, fromFd, Entry as yEntry, Options as yOptions, ZipFile as yZipFile, ZipFileOptions as yZipFileOptions, open as yopen } from "yauzl";

const mkdir0 = util.promisify(fs.mkdir);
const finishStream = util.promisify(finished);
const stat = util.promisify(fs.stat);
type yOpenTarget = string | Buffer | number;

async function ensureFile(file: string) {
    async function fexists() {
        return new Promise<boolean>((resolve) => fs.access(file, (e) => { if (e) { resolve(false); } else { resolve(true); } }))
    }
    async function ensure(name: string) {
        try {
            await mkdir0(name, { recursive: true });
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
    let existed = await fexists();
    if (!existed) {
        const dir = path.dirname(file);
        // console.log(`Ensure file ${file}`);
        // console.log(`Ensure dir ${dir}`);
        await ensure(dir);
    }
    return existed;
}

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

function extractCached(zipfile: yZipFile, dest: string, entries: yEntry[], options: ExtractOptions = {}) {
    const handler = options.entryHandler || ((d, e) => e.fileName);

    if (!!options.entries) {
        const targets = new Set(options.entries);
        entries = entries.filter((e) => targets.has(e.fileName));
    }

    async function handleEntry(entry: yEntry, relativePath: string | undefined) {
        if (relativePath) {
            let file = path.join(dest, relativePath);
            let existed = await ensureFile(file);
            if (options.replaceExisted || !existed) {
                await openEntryReadStream(zipfile, entry)
                    .then((stream) => stream.pipe(fs.createWriteStream(file)))
                    .then(finishStream)
                    .then(() => { options.onAfterExtracted?.(file, entry) });
            }
        }
    }

    return Promise.all(entries.map((e) => {
        if (e.fileName.endsWith("/")) {
            return Promise.resolve();
        }
        const relative = handler(dest, e);
        if (relative instanceof Promise) {
            return relative.then((r) => handleEntry(e, r));
        } else {
            return handleEntry(e, relative);
        }
    }));
}

function extractLazy(zipfile: yZipFile, destination: string, options: ExtractOptions = {}) {
    const handler = options.entryHandler || ((d: string, e: Entry) => e.fileName);
    const useRemaining = !!options.entries;
    const remaining = new Set(options.entries);

    function readIfLazy() {
        if (zipfile.lazyEntries) {
            zipfile.readEntry();
        }
    }
    async function handleEntry(entry: yEntry, relativePath: string | undefined) {
        if (relativePath) {
            let file = path.join(destination, relativePath);
            let existed = await ensureFile(file);
            if (options.replaceExisted || !existed) {
                await openEntryReadStream(zipfile, entry)
                    .then((stream) => stream.pipe(fs.createWriteStream(file)))
                    .then(finishStream)
                    .then(() => { options.onAfterExtracted?.(file, entry) });
            }
        }
    }

    return new Promise<void>((resolve, reject) => {
        let promises: Promise<void>[] = [];

        zipfile.once("end", () => {
            Promise.all(promises).then(() => resolve(), reject);
        });
        zipfile.on("entry", (entry: yEntry) => {
            if (entry.fileName.endsWith("/")) {
                readIfLazy();
                return;
            }
            const relativePath = handler(destination, entry);
            if (useRemaining && remaining.size === 0) {
                zipfile.removeAllListeners("entry");
                Promise.all(promises).then(() => resolve(), reject);
            } else if (useRemaining && !remaining.has(entry.fileName)) {
                readIfLazy();
            } else {
                if (useRemaining) { remaining.delete(entry.fileName); }
                if (relativePath instanceof Promise) {
                    relativePath.then((p) => {
                        promises.push(handleEntry(entry, p));
                        readIfLazy();
                    }, (e) => {
                        promises.push(Promise.reject(e));
                        readIfLazy();
                    });
                } else {
                    promises.push(handleEntry(entry, relativePath));
                    readIfLazy();
                }
            }
        });
        readIfLazy();
    }).finally(() => {
        if (!zipfile.autoClose) {
            zipfile.close();
        }
    });
}

function parseEntries(zipfile: yZipFile, entries: string[]) {
    return new Promise<Record<string, yEntry>>((resolve) => {
        let set = new Set<any>(entries);
        let result: Record<string, yEntry> = {};
        zipfile.on("end", () => { resolve(result); });
        zipfile.on("entry", (entry: yEntry) => {
            if (set.has(entry.fileName)) {
                set.delete(entry.fileName);
                result[entry.fileName] = entry;
            }
            if (set.size !== 0) {
                if (zipfile.lazyEntries) { zipfile.readEntry(); }
            } else {
                resolve(result);
            }
        });
        if (zipfile.lazyEntries) { zipfile.readEntry(); }
    });
}

function openEntryReadStream(zip: yZipFile, entry: yEntry, options?: yZipFileOptions) {
    return new Promise<Readable>((resolve, reject) => {
        function handleStream(err: Error | undefined, stream: Readable | undefined) {
            if (err || !stream) { reject(err); }
            else { resolve(stream); }
        }
        if (options) { zip.openReadStream(entry, options, handleStream); }
        else { zip.openReadStream(entry, handleStream); }
    });
}

function openZipFile(target: yOpenTarget, options: yOptions = {}): Promise<yZipFile> {
    return new Promise<yZipFile>((resolve, reject) => {
        function handleZip(err: Error | undefined, zipfile: yZipFile | undefined) {
            if (err) { reject(err); } else { resolve(zipfile); }
        }
        if (typeof target === "string") {
            yopen(target, options, handleZip);
        } else if (target instanceof Buffer) {
            fromBuffer(target, options, handleZip);
        } else {
            fromFd(target, options, handleZip);
        }
    });
}

abstract class AbstractZip implements ZipFile {
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
    async extractEntries(dest: string, options?: ExtractOptions): Promise<void> {
        await extractLazy(this.delegate, dest, options);
    }
}

class LazyZip extends AbstractZip implements LazyZipFile {
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
        const result = await parseEntries(this.delegate, entries);
        return Object.values(result).sort((a, b) => entries.indexOf(a.fileName) - entries.indexOf(b.fileName));
    }
    walkEntries(onEntry: (entry: yEntry) => boolean | void | Promise<any>): Promise<void> {
        return walkEntries(this.delegate, onEntry);
    }
}

class CachedZip extends AbstractZip implements CachedZipFile {
    constructor(
        delegate: yZipFile,
        readonly entries: { [name: string]: yEntry; }) {
        super(delegate);
    }
    filterEntries(filter: (e: yEntry) => boolean): yEntry[] {
        return Object.values(this.entries).filter(filter);
    }
    async extractEntries(dest: string, options?: ExtractOptions): Promise<void> {
        await extractCached(this.delegate, dest, Object.values(this.entries), options);
    }
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
        openZipFile(Buffer.concat(this.buffer), { lazyEntries: true }).then((zip) => {
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
        openZipFile(Buffer.concat(this.buffer), { lazyEntries: true }).then((zip) => {
            return parseEntries(zip, this.entries).then((entries) => {
                this._resolve(new CachedZip(zip, entries));
                callback();
            });
        }).catch((e) => {
            callback(e);
            this._reject(e);
        });
    }
}

class ExtractStreamImpl extends ZipFileStream<void> {
    constructor(readonly destination: string, readonly options?: ExtractOptions) {
        super();
    }

    public _final(callback: (error?: Error | null) => void) {
        openZipFile(Buffer.concat(this.buffer), { lazyEntries: true, autoClose: false }).then((zip) => {
            extractLazy(zip, this.destination, this.options).then(() => {
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

    extractEntries(dest: string, options?: ExtractOptions): Promise<void>;

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
        return new LazyZip(await openZipFile(target, { ...options, lazyEntries: true, autoClose: false })) as LazyZipFile;
    } else {
        let zip = await openZipFile(target, { ...options, lazyEntries: true, autoClose: false });
        let entries: { [key: string]: yEntry } = {};
        await walkEntries(zip, (e) => { entries[e.fileName] = e; });
        return new CachedZip(zip, entries) as any;
    }
}

export function createParseStream(options?: CacheOptions): ParseEntriesStream;
export function createParseStream(options?: LazyOptions): ParseStream;
export function createParseStream(options?: Options) {
    return new ParseStreamImpl(options) as any; // sorry, ts cannot infer this i think
}

export function createExtractStream(destination: string, options?: ExtractOptions): ExtractStream {
    return new ExtractStreamImpl(destination, options);
}

export function createWalkEntriesStream(onEntry: (entry: Entry) => Promise<any> | boolean | undefined): WalkEntriesStream {
    return new WalkEntriesStreamImpl(onEntry);
}

/**
 * Extract the zip file with a filter into a folder. The default filter is filter nothing, which will unzip all the content in zip.
 *
 * @param zipfile The zip file
 * @param dest The destination folder
 * @param filter The entry filter
 */
export async function extract(openFile: OpenTarget, dest: string, options?: ExtractOptions) {
    const zipfile = await openZipFile(openFile, { lazyEntries: true, autoClose: false });
    return extractLazy(zipfile, dest, options);
}

/**
 * @param destinationRoot The root dir of extraction
 * @param entry The entry
 * @returns The relative path related to the root to extract
 */
export type EntryHandler = (destinationRoot: string, entry: Entry) => string | undefined | Promise<string | undefined>;

export interface ExtractOptions {
    /**
     * Only extract on these entries
     */
    entries?: string[];

    /**
     * The handler to decide the entry extraction path
     */
    entryHandler?: EntryHandler;

    /**
     * `true` to replace the if the entry destination existed, `false` to not replace.
     * @default false
     */
    replaceExisted?: boolean;

    /**
     * The hook called after a entry extracted.
     */
    onAfterExtracted?: (destination: string, entry: Entry) => void;
}
