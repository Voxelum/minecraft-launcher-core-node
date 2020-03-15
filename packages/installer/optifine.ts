import { futils, MinecraftFolder, MinecraftLocation, Version } from "@xmcl/core";
import { Task, task } from "@xmcl/task";
import { open } from "@xmcl/unzip";
import { ClassReader, ClassVisitor, Opcodes } from "java-asm";
import { InstallOptions, spawnProcess } from "./util";

const { writeFile, ensureFile } = futils;

/**
 * Generate the optifine version json from provided info.
 * @param editionRelease The edition + release with _
 * @param minecraftVersion The minecraft version
 * @param launchWrapperVersion The launch wrapper version
 * @param options The install options
 * @beta Might be changed and don't break the major version
 */
export function generateOptifineVersion(editionRelease: string, minecraftVersion: string, launchWrapperVersion: string, options: InstallOptions = {}): Version {
    let id = options.versionId ?? `${minecraftVersion}-Optifine_${editionRelease}`;
    let inheritsFrom = options.inheritsFrom ?? minecraftVersion;
    let mainClass = "net.minecraft.launchwrapper.Launch";
    return {
        id,
        inheritsFrom,
        arguments: {
            game: ["--tweakClass", "optifine.OptiFineTweaker"],
            jvm: [],
        },
        releaseTime: new Date().toJSON(),
        time: new Date().toJSON(),
        type: "release",
        libraries: [
            { name: `optifine:launchwrapper-of:${launchWrapperVersion}` },
            { name: `optifine:Optifine:${minecraftVersion}_${editionRelease}` }
        ],
        mainClass,
        minimumLauncherVersion: 21,
    };
}

export interface InstallOptifineOptions extends InstallOptions {
    /**
     * The java exectable path. It will use `java` by default.
     */
    java?: string;
}

/**
 * Install optifine by optifine installer
 *
 * @param installer The installer jar file path
 * @param minecraft The minecraft location
 * @param options The option to install
 * @beta Might be changed and don't break the major version
 */
export function installByInstaller(installer: string, minecraft: MinecraftLocation, options?: InstallOptifineOptions) {
    return installByInstallerTask(installer, minecraft, options).execute().wait();
}

/**
 * Install optifine by optifine installer task
 *
 * @param installer The installer jar file path
 * @param minecraft The minecraft location
 * @param options The option to install
 * @beta Might be changed and don't break the major version
 */
export function installByInstallerTask(installer: string, minecraft: MinecraftLocation, options: InstallOptifineOptions = {}) {
    return Task.create("installOptifine", async (context) => {
        let mc = MinecraftFolder.from(minecraft);

        context.update(0, 100);

        let zip = await open(installer);
        context.update(10, 100);

        let entry = zip.entries["net/optifine/Config.class"];
        if (!entry) {
            throw new Error();
        }

        let launchWrapperVersionEntry = zip.entries["launchwrapper-of.txt"];
        if (!launchWrapperVersionEntry) {
            throw new Error();
        }

        let launchWrapperVersion = await zip.readEntry(launchWrapperVersionEntry).then((b) => b.toString());
        context.update(15, 100);

        const launchWrapperEntry = zip.entries[`launchwrapper-of-${launchWrapperVersion}.jar`]
        if (!launchWrapperEntry) {
            throw new Error();
        }

        let buf = await zip.readEntry(entry);
        let reader = new ClassReader(buf);
        class OptifineVisitor extends ClassVisitor {
            fields: Record<string, any> = {};
            visitField(access: number, name: string, desc: string, signature: string, value: any) {
                this.fields[name] = value;
                return null;
            }
        }
        let visitor = new OptifineVisitor(Opcodes.ASM5);
        reader.accept(visitor);
        let mcversion: string = visitor.fields.MC_VERSION; // 1.14.4
        let edition: string = visitor.fields.OF_EDITION; // HD_U
        let release: string = visitor.fields.OF_RELEASE; // F5
        let editionRelease = edition + "_" + release;

        let versionJSON = generateOptifineVersion(editionRelease, mcversion, launchWrapperVersion, options);
        let versionJSONPath = mc.getVersionJson(versionJSON.id);

        context.update(20, 100);
        // write version json
        await context.execute(task("json", async () => {
            await ensureFile(versionJSONPath);
            await writeFile(versionJSONPath, JSON.stringify(versionJSON, null, 4));
        }), 20);

        // write launch wrapper
        await context.execute(task("library", async () => {
            let wrapperDest = mc.getLibraryByPath(`launchwrapper-of/${launchWrapperVersion}/launchwrapper-of-${launchWrapperVersion}.jar`)
            await ensureFile(wrapperDest);
            await writeFile(wrapperDest, await zip.readEntry(launchWrapperEntry));
        }), 20);

        // write the optifine
        await context.execute(task("jar", async () => {
            let dest = mc.getLibraryByPath(`optifine/Optifine/${mcversion}_${editionRelease}/Optifine-${mcversion}_${editionRelease}.jar`);
            let mcJar = mc.getVersionJar(mcversion);

            await ensureFile(dest);
            await spawnProcess(options.java ?? "java", ["-cp", installer, "optifine.Patcher", mcJar, installer, dest]);
        }), 40);
    });
}
