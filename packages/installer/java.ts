import { Platform, getPlatform } from "@xmcl/core";
import { Task, task } from "@xmcl/task";
import { exec } from "child_process";
import { EOL, tmpdir, platform } from "os";
import { basename, join, resolve } from "path";
import { DownloaderOption } from "./minecraft";
import { downloadFileTask, unlink, missing, resolveDownloader, fetchJson } from "./util";

export interface JavaInfo {
    /**
     * Full java executable path
     */
    path: string;
    /**
     * Java version string
     */
    version: string;
    /**
     * Major version of java
     */
    majorVersion: number;
}

export interface Options extends DownloaderOption {
    /**
     * The destination of this installation
     */
    destination: string;
    /**
     * The cached directory which compressed java lzma will be download to.
     * @default os.tempdir()
     */
    cacheDir?: string;
    /**
     * The platform to install. It will be auto-resolved by default.
     * @default currentPlatform
     */
    platform?: Platform;
    /**
     * Unpack lzma function. It must present, else it will not be able to unpack mojang provided LZMA.
     */
    unpackLZMA: (src: string, dest: string) => Promise<void>;
}

/**
 * Install JRE from Mojang offical resource. It should install jdk 8.
 * @param options The install options
 */
export function installJreFromMojangTask(options: Options) {
    const {
        destination,
        unpackLZMA,
        cacheDir = tmpdir(),
        platform = getPlatform(),
    } = options;
    return task("installJreFromMojang", (context) => resolveDownloader(options, async function installJreFromMojang(options) {
        const info: { [system: string]: { [arch: string]: { jre: { sha1: string; url: string; version: string } } } }
            = await context.execute(task("fetchInfo", () => fetchJson("https://launchermeta.mojang.com/mc/launcher.json")));
        const system = platform.name;
        function resolveArch() {
            switch (platform.arch) {
                case "x86":
                case "x32": return "32";
                case "x64": return "64";
                default: return "32";
            }
        }
        const currentArch = resolveArch();

        if (!info[system] || !info[system][currentArch] || !info[system][currentArch].jre) {
            throw new Error("No Java package available for your platform")
        }
        const { sha1, url } = info[system][currentArch].jre;
        const filename = basename(url);
        const downloadDestination = resolve(cacheDir, filename);

        await context.execute(task("download", downloadFileTask({
            url,
            destination: downloadDestination,
            checksum: {
                algorithm: "sha1",
                hash: sha1,
            },
        }, options)));

        const javaRoot = destination;
        await context.execute(task("decompress", async () => {
            await unpackLZMA(downloadDestination, javaRoot);
        }));
        await context.execute(task("cleanup", async () => { await unlink(downloadDestination); }));
    }));
}

/**
 * Install JRE from Mojang offical resource. It should install jdk 8.
 * @param options The install options
 */
export function installJreFromMojang(options: Options) {
    return Task.execute(installJreFromMojangTask(options)).wait();
}

/**
 * Try to resolve a java info at this path. This will call `java -version`
 * @param path The java exectuable path.
 */
export async function resolveJava(path: string): Promise<JavaInfo | undefined> {
    if (await missing(path)) { return undefined; }

    return new Promise((resolve) => {
        exec(`"${path}" -version`, (err, sout, serr) => {
            if (serr) {
                let ver = parseJavaVersion(serr);
                if (ver) {
                    resolve({ path, ...ver });
                } else {
                    resolve(undefined);
                }
            } else {
                resolve(undefined);
            }
        });
    });
}

/**
 * Parse version string and major version number from stderr of java process.
 *
 * @param versionText The stderr for `java -version`
 */
export function parseJavaVersion(versionText: string): { version: string; majorVersion: number } | undefined {
    const getVersion = (str?: string) => {
        if (!str) { return undefined; }
        const match = /(\d+\.\d+\.\d+)(_(\d+))?/.exec(str);
        if (match === null) { return undefined; }
        return match[1];
    };
    let javaVersion = getVersion(versionText);

    if (!javaVersion) { return undefined; }

    let majorVersion = Number.parseInt(javaVersion.split(".")[0], 10);
    if (majorVersion === 1) {
        majorVersion = Number.parseInt(javaVersion.split(".")[1], 10);
    }
    let java = {
        version: javaVersion,
        majorVersion,
    };
    return java;
}

/**
 * Get all potential java locations for Minecraft.
 *
 * On mac/linux, it will perform `which java`. On win32, it will perform `where java`
 *
 * @returns The absolute java locations path
 */
export async function getPotentialJavaLocations(): Promise<string[]> {
    let unchecked = new Set<string>();
    let currentPlatform = platform();
    let javaFile = currentPlatform === "win32" ? "javaw.exe" : "java";

    if (process.env.JAVA_HOME) {
        unchecked.add(join(process.env.JAVA_HOME, "bin", javaFile));
    }

    const which = () => new Promise<string>((resolve) => {
        exec("which java", (error, stdout) => {
            resolve(stdout.replace("\n", ""));
        });
    });
    const where = () => new Promise<string[]>((resolve) => {
        exec("where java", (error, stdout) => {
            resolve(stdout.split("\r\n"));
        });
    });

    if (currentPlatform === "win32") {
        const out = await new Promise<string[]>((resolve) => {
            exec("REG QUERY HKEY_LOCAL_MACHINE\\Software\\JavaSoft\\ /s /v JavaHome", (error, stdout) => {
                if (!stdout) { resolve([]); }
                resolve(stdout.split(EOL).map((item) => item.replace(/[\r\n]/g, ""))
                    .filter((item) => item != null && item !== undefined)
                    .filter((item) => item[0] === " ")
                    .map((item) => `${item.split("    ")[3]}\\bin\\javaw.exe`));
            });
        });
        for (const o of [...out, ...await where()]) {
            unchecked.add(o);
        }
        unchecked.add("C:\\Program Files (x86)\\Minecraft Launcher\\runtime\\jre-x64/X86");
    } else if (currentPlatform === "darwin") {
        unchecked.add("/Library/Internet Plug-Ins/JavaAppletPlugin.plugin/Contents/Home/bin/java");
        unchecked.add(await which());
    } else {
        unchecked.add(await which());
    }

    let checkingList = Array.from(unchecked).filter((jPath) => typeof jPath === "string").filter((p) => p !== "");

    return checkingList;
}

/**
 * Scan local java version on the disk.
 *
 * It will check if the passed `locations` are the home of java.
 * Notice that the locations should not be the executable, but the path of java installation, like JAVA_HOME.
 *
 * This will call `getPotentialJavaLocations` and then `resolveJava`
 *
 * @param locations The location (like java_home) want to check.
 * @returns All validate java info
 */
export async function scanLocalJava(locations: string[]): Promise<JavaInfo[]> {
    let unchecked = new Set(locations);
    let potential = await getPotentialJavaLocations();
    potential.forEach((p) => unchecked.add(p));

    let checkingList = [...unchecked].filter((jPath) => typeof jPath === "string").filter((p) => p !== "");;

    const javas = await Promise.all(checkingList.map((jPath) => resolveJava(jPath)));
    return javas.filter(((j) => j !== undefined) as (j?: JavaInfo) => j is JavaInfo);
}
