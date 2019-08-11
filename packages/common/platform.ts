export interface Platform {
    name: "osx" | "linux" | "windows" | "unknown";
    version: string;
    arch: "x86" | "x64" | string;
}
