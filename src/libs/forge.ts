import * as crypto from "crypto";
import * as fs from "fs-extra";
import { AnnotationVisitor, ClassReader, ClassVisitor, Opcodes } from "java-asm";
import * as Zip from "jszip";
import * as path from "path";
import Task from "treelike-task";
import { downloadTask } from "./utils/download";
import { missing } from "./utils/exists";
import { MinecraftFolder, MinecraftLocation } from "./utils/folder";
import { Version } from "./version";


export namespace Forge {
    class AVisitor extends AnnotationVisitor {
        constructor(readonly map: { [key: string]: any }) { super(Opcodes.ASM5); }
        public visit(s: string, o: any) {
            this.map[s] = o;
        }
    }
    class KVisitor extends ClassVisitor {
        public fields: any = {};
        private className: string = "";
        public constructor(readonly map: { [key: string]: any }) {
            super(Opcodes.ASM5);
        }
        visit(version: number, access: number, name: string, signature: string, superName: string, interfaces: string[]): void {
            this.className = name;
        }
        public visitField(access: number, name: string, desc: string, signature: string, value: any) {
            if (this.className === "Config") {
                this.fields[name] = value;
            }
            return null;
        }

        public visitAnnotation(desc: string, visible: boolean): AnnotationVisitor | null {
            if (desc === "Lnet/minecraftforge/fml/common/Mod;" || desc === "Lcpw/mods/fml/common/Mod;") { return new AVisitor(this.map); }
            return null;
        }
    }
    export interface Config {
        [category: string]: {
            comment?: string,
            properties: Array<Config.Property<any>>,
        };
    }

    export namespace Config {
        export type Type = "I" | "D" | "S" | "B";
        export interface Property<T = number | boolean | string | number[] | boolean[] | string[]> {
            readonly type: Type;
            readonly name: string;
            readonly comment?: string;
            value: T;
        }

        export function stringify(config: Config) {
            let content = "# Configuration file\n\n\n";
            const propIndent = "    ", arrIndent = "        ";
            Object.keys(config).forEach((cat) => {
                content += `${cat} {\n\n`;
                config[cat].properties.forEach((prop) => {
                    if (prop.comment) {
                        const lines = prop.comment.split("\n");
                        for (const l of lines) {
                            content += `${propIndent}# ${l}\n`;
                        }
                    }
                    if (prop.value instanceof Array) {
                        content += `${propIndent}${prop.type}:${prop.name} <\n`;
                        prop.value.forEach((v) => content += `${arrIndent}${v}\n`);
                        content += `${propIndent}>\n`;
                    } else {
                        content += `${propIndent}${prop.type}:${prop.name}=${prop.value}\n`;
                    }
                    content += "\n";
                });
                content += `}\n\n`;
            });
            return content;
        }

        export function parse(body: string): Config {
            const lines = body.split("\n").map((s) => s.trim())
                .filter((s) => s.length !== 0);
            let category: string | undefined;
            let pendingCategory: string | undefined;

            const parseVal = (type: Type, value: any) => {
                const map: { [key: string]: (s: string) => any } = {
                    I: Number.parseInt,
                    D: Number.parseFloat,
                    S: (s: string) => s,
                    B: (s: string) => s === "true",
                };
                const handler = map[type];
                return handler(value);
            };
            const config: Config = {};
            let inlist = false;
            let comment: string | undefined;
            let last: any;

            const readProp = (type: Type, line: string) => {
                line = line.substring(line.indexOf(":") + 1, line.length);
                const pair = line.split("=");
                if (pair.length === 0 || pair.length === 1) {
                    let value;
                    let name;
                    if (line.endsWith(" <")) {
                        value = [];
                        name = line.substring(0, line.length - 2);
                        inlist = true;
                    } else { }
                    if (!category) {
                        throw {
                            type: "CorruptedForgeConfig",
                            reason: "MissingCategory",
                            line,
                        };
                    }
                    config[category].properties.push(last = { name, type, value, comment } as Property);
                } else {
                    inlist = false;
                    if (!category) {
                        throw {
                            type: "CorruptedForgeConfig",
                            reason: "MissingCategory",
                            line,
                        };
                    }
                    config[category].properties.push({ name: pair[0], value: parseVal(type, pair[1]), type, comment } as Property);
                }
                comment = undefined;
            };
            for (const line of lines) {
                if (inlist) {
                    if (!last) {
                        throw {
                            type: "CorruptedForgeConfig",
                            reason: "CorruptedList",
                            line,
                        };
                    }
                    if (line === ">") { inlist = false; } else if (line.endsWith(" >")) {
                        last.value.push(parseVal(last.type, line.substring(0, line.length - 2)));
                        inlist = false;
                    } else { last.value.push(parseVal(last.type, line)); }
                    continue;
                }
                switch (line.charAt(0)) {
                    case "#":
                        if (!comment) {
                            comment = line.substring(1, line.length).trim();
                        } else {
                            comment = comment.concat("\n", line.substring(1, line.length).trim());
                        }
                        break;
                    case "I":
                    case "D":
                    case "S":
                    case "B":
                        readProp(line.charAt(0) as Type, line);
                        break;
                    case "<":
                        break;
                    case "{":
                        if (pendingCategory) {
                            category = pendingCategory;
                            config[category] = { comment, properties: [] };
                            comment = undefined;
                        } else {
                            throw {
                                type: "CorruptedForgeConfig",
                                reason: "MissingCategory",
                                line,
                            };
                        }
                        break;
                    case "}":
                        category = undefined;
                        break;
                    default:
                        if (!category) {
                            if (line.endsWith("{")) {
                                category = line.substring(0, line.length - 1).trim();
                                config[category] = { comment, properties: [] };
                                comment = undefined;
                            } else {
                                pendingCategory = line;
                            }
                        } else {
                            throw {
                                type: "CorruptedForgeConfig",
                                reason: "Duplicated",
                                line,
                            };
                        }
                }
            }
            return config;
        }
    }

    export interface ModIndentity {
        readonly modid: string;
        readonly version: string;
    }
    export interface MetaData extends ModIndentity {
        readonly modid: string;
        readonly name: string;
        readonly description?: string;
        readonly version: string;
        readonly mcversion?: string;
        readonly acceptMinecraftVersion?: string;
        readonly updateJSON?: string;
        readonly url?: string;
        readonly logoFile?: string;
        readonly authorList?: string[];
        readonly credits?: string;
        readonly parent?: string;
        readonly screenShots?: string[];
        readonly fingerprint?: string;
        readonly dependencies?: string;
        readonly accpetRemoteVersions?: string;
        readonly acceptSaveVersions?: string;
        readonly isClientOnly?: boolean;
        readonly isServerOnly?: boolean;
    }

    export interface VersionMeta {
        checksum: { [key: string]: string | undefined };
        universal: string;
        installer?: string;
        mcversion: string;
        version: string;
    }

    async function asmMetaData(zip: Zip, modidTree: any) {
        for (const key in zip.files) {
            if (key.endsWith(".class")) {
                const data = await zip.files[key].async("nodebuffer");
                const metaContainer: any = {};
                const visitor = new KVisitor(metaContainer);
                new ClassReader(data).accept(visitor);
                if (Object.keys(metaContainer).length === 0) {
                    if (visitor.fields && visitor.fields.OF_NAME) {
                        metaContainer.modid = visitor.fields.OF_NAME;
                        metaContainer.name = visitor.fields.OF_NAME;
                        metaContainer.mcversion = visitor.fields.MC_VERSION;
                        metaContainer.version = `${visitor.fields.OF_EDITION}_${visitor.fields.OF_RELEASE}`;
                        metaContainer.description = "OptiFine is a Minecraft optimization mod. It allows Minecraft to run faster and look better with full support for HD textures and many configuration options.";
                        metaContainer.authorList = ["sp614x"];
                        metaContainer.url = "https://optifine.net";
                        metaContainer.isClientOnly = true;
                    }
                }
                const modid = metaContainer.modid;
                let modMeta = modidTree[modid];
                if (!modMeta) {
                    modMeta = {};
                    modidTree[modid] = modMeta;
                }

                for (const propKey in metaContainer) {
                    modMeta[propKey] = metaContainer[propKey];
                }
            }
        }
    }

    async function jsonMetaData(zip: Zip, modidTree: any) {
        try {
            for (const m of await zip.file("mcmod.info").async("nodebuffer").then((buf) => JSON.parse(buf.toString().trim()))) {
                modidTree[m.modid] = m;
            }
        } catch (e) { }
    }

    async function regulize(mod: Buffer | string | Zip) {
        let zip;
        if (mod instanceof Zip) {
            zip = mod;
        } else if (mod instanceof Buffer) {
            zip = await new Zip().loadAsync(mod);
        } else if (typeof mod === "string") {
            zip = await new Zip().loadAsync(await fs.readFile(mod));
        } else {
            throw new Error("Illegal input! Expect Buffer or string (filePath)");
        }
        return zip;
    }
    /**
     * Read metadata of the input mod.
     *
     * @param mod The mod path or data
     * @param asmOnly True for only reading the metadata from java bytecode, ignoring the mcmod.info
     */
    export async function readModMetaData(mod: Buffer | string | Zip, asmOnly: boolean = false) {
        const zip = await regulize(mod);
        const modidTree: any = {};
        if (!asmOnly) { await jsonMetaData(zip, modidTree); }
        await asmMetaData(zip, modidTree);
        const modids = Object.keys(modidTree);
        if (modids.length === 0) { throw { type: "NonmodTypeFile" }; }
        return modids.map((k) => modidTree[k] as Forge.MetaData)
            .filter((m) => m.modid !== undefined);
    }

    export async function meta(mod: Buffer | string | Zip, asmOnly: boolean = false) {
        return readModMetaData(mod, asmOnly);
    }

    function validateCheckSum(data: Buffer, algorithm: string, expectValue: string) {
        try {
            return expectValue === crypto.createHash(algorithm).update(data).digest("hex");
        } catch (e) {
            return false;
        }
    }

    function installTask0(version: VersionMeta, minecraft: MinecraftLocation, checksum: boolean = false, maven: string = "http://files.minecraftforge.net") {
        return async (context: Task.Context) => {
            const mc = typeof minecraft === "string" ? new MinecraftFolder(minecraft) : minecraft;
            const versionPath = `${version.mcversion}-${version.version}`;
            const universalURLFallback = `${maven}/net/minecraftforge/forge/${versionPath}/forge-${versionPath}-universal.jar`;
            const installerURLFallback = `${maven}/net/minecraftforge/forge/${versionPath}/forge-${versionPath}-installer.jar`;
            const universalURL = `${maven}${version.universal}`;
            const installerURL = `${maven}${version.installer}`;

            async function downloadForge(universal: string, installer: string) {
                let buffer: any;
                try {
                    buffer = await context.execute("downloadJar", downloadTask(universal));
                } catch (e) {
                    buffer = await context.execute("redownloadJar", downloadTask(installer));
                    buffer = await context.execute("extractJar", async () =>
                        (await Zip().loadAsync(buffer))
                            .file(`forge-${versionPath}-universal.jar`)
                            .async("nodebuffer"));
                }
                return buffer;
            }

            const universalBuffer = await downloadForge(universalURL, installerURL)
                .catch((_) => downloadForge(universalURLFallback, installerURLFallback));

            const buff: Buffer = await context.execute("extraVersionJson",
                async () => (await Zip().loadAsync(universalBuffer)).file("version.json").async("nodebuffer"));
            const versionJSON = JSON.parse(buff.toString());


            const localForgePath = versionJSON.id;
            const libForgePath = mc.getLibraryByPath(`net/minecraftforge/forge/${versionPath}/forge-${versionPath}.jar`);
            const rootPath = mc.getVersionRoot(localForgePath);
            const jsonPath = path.join(rootPath, `${localForgePath}.json`);

            await context.execute("ensureRoot", () => fs.ensureDir(rootPath));
            if (await missing(libForgePath) || await missing(jsonPath)) {
                await context.execute("writeJar", async () => fs.outputFile(libForgePath, universalBuffer));
                await context.execute("writeJson", async () => fs.writeJSON(jsonPath, versionJSON));

                if (checksum) {
                    const data = await fs.readFile(libForgePath);
                    for (const key in version.checksum) {
                        if (!validateCheckSum(data, key, version.checksum[key] as string)) {
                            throw new Error("Checksum not matched! Probably caused by incompleted file or illegal file source.");
                        }
                    }
                }
            }

            return versionJSON.id as string;
        };
    }

    /**
     * @param version
     * @param minecraft
     * @param option
     */
    export function install(version: VersionMeta, minecraft: MinecraftLocation, option?: {
        checksum?: boolean,
        maven?: string,
        id?: string,
    }) {
        return installTask(version, minecraft, option);
    }

    export function installTask(version: VersionMeta, minecraft: MinecraftLocation, option?: {
        checksum?: boolean,
        maven?: string,
        id?: string,
    }): Task<string> {
        const op = option || {};
        return Task.create("installForge", installTask0(version, minecraft, op.checksum || false, op.maven || "http://files.minecraftforge.net/maven"));
    }

    export function installAndCheckTask(version: VersionMeta, minecraft: MinecraftLocation, checksum: boolean = false, maven?: string): Task<Version> {
        return Task.create("installForgeAndCheck", async (context) => {
            const id = await context.execute("install", installTask0(version, minecraft, checksum, maven));
            const ver = await context.execute("versionParse", () => Version.parse(minecraft, id));
            return context.execute("checkDependencies", Version.checkDependenciesTask(ver, minecraft).work);
        });
    }

    export async function installAndCheck(version: VersionMeta, minecraft: MinecraftLocation, checksum: boolean = false, maven?: string): Promise<Version> {
        return installAndCheckTask(version, minecraft, checksum, maven).execute();
    }
}

export default Forge;
