interface Lzma {
    decompress(buffer: any): any
}

declare var XZ: Lzma;

declare module 'lzma-native' {
    export = XZ
}