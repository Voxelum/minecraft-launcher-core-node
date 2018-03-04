/// <reference types="node" />

declare module 'lzma-native' {
    import * as stream from "stream"

    export const CHECK_CRC32: number;
    export const CHECK_CRC64: number;
    export const CHECK_NONE: number;
    export const CHECK_SHA256: number;

    export const PRESET_DEFAULT: number;
    export const PRESET_LEVEL_MASK: number;
    export const PRESET_EXTREME: number;

    interface Lzma {
        decompress(buffer: string | Buffer, onFinish?: (result: Buffer, err: Error) => void, onProgress?: (progress: number) => void): Promise<Buffer>;
        compress(buffer: string | Buffer, mode?: number, onFinish?: (result: Buffer, err: Error) => void, onProgress?: (progress: number) => void): Promise<Buffer>;
    }
    interface Option {
        check: number,
        memlimit: number,
        preset: number,
        flags: number,
        synchronous: boolean,
        bufsize: number,
        threads: number,
        blockSize: number,
        timeout: number,
    }

    export function crc32(buffer: string | Buffer, encoding?: string, previous?: number): number;
    export function checkSize(check: number): number;
    export function easyDecoderMemusage(preset: number): number;
    export function isXZ(buffer: string | Buffer): boolean;

    export type Coder = 'easyEncoder' | 'autoDecoder' | 'aloneEncoder' | 'aloneDecoder' | 'rawEncoder' | 'rawDecoder' | 'streamEncoder' | 'streamDecoder';

    export function LZMA(): Lzma;

    export function decompress(buffer: string | Buffer, option?: Option | number, onFinish?: (result: Buffer, err: Error) => void): Promise<Buffer>;

    export function compress(buffer: string | Buffer, option?: Option | number, onFinish?: (result: Buffer, err: Error) => void): Promise<Buffer>;

    export function createCompressor(): stream.Duplex;
    export function createDecompressor(): stream.Duplex;

    export function createStream(coder: Coder, options?: Option | number): stream.Duplex;
}