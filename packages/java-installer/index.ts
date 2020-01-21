import { exec } from "child_process";
import Task from "@xmcl/task";
import { promises } from "fs";
import got from "got";
import { join, basename, resolve } from "path";
import { EOL, tmpdir, platform, arch } from "os";

const fetchJson = got.extend({ responseType: "json" });

export interface JavaInfo {
    path: string;
    version: string;
    majorVersion: number;
}

export interface InstallOption {
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
     * Unpack lzma function. It must present, else it will not be able to unpack mojang provided LZMA.
     */
    unpackLZMA: (src: string, dest: string) => Promise<void>;

    downloader: (option: {
        url: string;
        destination: string;
        checksum: {
            algorithm: string;
            hash: string;
        };
        progress?: (written: number, total: number, url: string) => boolean | void;
        pausable?: (pauseFunc: () => void, resumeFunc: () => void) => void;
    }) => Promise<void>;
}
/**
 * Install JRE from Mojang offical resource. It should install jdk 8.
 * @param options The install options
 */
export function installJreFromMojangTask(options: InstallOption) {
    const {
        destination,
        unpackLZMA,
        downloader,
        cacheDir = tmpdir(),
    } = options;
    return Task.create("installJreFromMojang", async function installJreFromMojang(context: Task.Context) {
        const info: { [system: string]: { [arch: string]: { jre: { sha1: string; url: string; version: string } } } }
            = await context.execute(Task.create("fetchInfo", () => fetchJson("https://launchermeta.mojang.com/mc/launcher.json").json()));
        const system = platform.name;
        function resolveArch() {
            switch (arch()) {
                case "x86":
                case "x32": return "32";
                case "x64": return "64";
                default: return "32";
            }
        }
        const currentArch = resolveArch();

        if (system === "unknown" || system === "linux") {
            return;
        }
        const { sha1, url } = info[system][currentArch].jre;
        const filename = basename(url);
        const downloadDestination = resolve(cacheDir, filename);

        await context.execute(Task.create("download", (context) => downloader({
            url,
            destination: downloadDestination,
            checksum: {
                algorithm: "sha1",
                hash: sha1,
            },
            progress: context.update,
            pausable: context.pausealbe,
        })));

        const javaRoot = destination;
        await context.execute(Task.create("decompress", async () => {
            await unpackLZMA(downloadDestination, javaRoot);
        }));
        await context.execute(Task.create("cleanup", async () => { await promises.unlink(downloadDestination); }));
    });
}

/**
 * Install JRE from Mojang offical resource. It should install jdk 8.
 * @param options The install options
 */
export function installJreFromMojang(options: InstallOption) {
    return Task.execute(installJreFromMojangTask(options)).wait();
}

/**
 * Try to resolve a java info at this path.
 * @param path The java exectuable path.
 */
export async function resolveJava(path: string): Promise<JavaInfo | undefined> {
    const exists = await promises.stat(path).then(() => true, () => false);
    if (!exists) { return undefined; }
    const parseJavaVersion = (str?: string) => {
        if (!str) { return undefined; }
        const match = /(\d+\.\d+\.\d+)(_(\d+))?/.exec(str);
        if (match === null) { return undefined; }
        return match[1];
    };
    return new Promise((resolve) => {
        exec(`"${path}" -version`, (err, sout, serr) => {
            const version = parseJavaVersion(serr);
            if (serr && version !== undefined) {
                let majorVersion = Number.parseInt(version.split(".")[0], 10);
                if (majorVersion === 1) {
                    majorVersion = Number.parseInt(version.split(".")[1], 10);
                }
                const java = {
                    path,
                    version,
                    majorVersion,
                };
                resolve(java);
            } else {
                resolve(undefined);
            }
        });
    });
}

/**
 * Scan local java version on the disk.
 *
 * It will check if the passed `locations` are the home of java.
 * Notice that the locations should not be the executable, but the path of java installation, like JAVA_HOME.
 *
 * On mac/linux, it will perform `which java`. On win32, it will perform `where java`
 *
 * @param locations The location (like java_home) want to check if it's a
 * @param platform The providing operating system
 */
export async function scanLocalJava(locations: string[]) {
    const unchecked = new Set<string>();
    const javaFile = platform() === "win32" ? "javaw.exe" : "java";

    for (const p of locations) {
        unchecked.add(join(p, "bin", javaFile));
    }
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

    if (platform.name === "windows") {
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
    } else if (platform.name === "osx") {
        unchecked.add("/Library/Internet Plug-Ins/JavaAppletPlugin.plugin/Contents/Home/bin/java");
        unchecked.add(await which());
    } else {
        unchecked.add(await which());
    }

    const checkingList = Array.from(unchecked).filter((jPath) => typeof jPath === "string").filter((p) => p !== "");

    const javas = await Promise.all(checkingList.map((jPath) => resolveJava(jPath)));

    return javas.filter(((j) => j !== undefined) as (j?: JavaInfo) => j is JavaInfo);
}
