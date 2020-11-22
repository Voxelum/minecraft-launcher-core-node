import { resolveFileSystem, FileSystem } from "@xmcl/system";
import { parse as parseToml } from "@iarna/toml";
import { AnnotationVisitor, ClassReader, ClassVisitor, MethodVisitor, Opcodes } from "@xmcl/asm";

class ModAnnotationVisitor extends AnnotationVisitor {
    constructor(readonly map: { [key: string]: any }) { super(Opcodes.ASM5); }
    public visit(s: string, o: any) {
        if (s === "value") {
            this.map.modid = o
        } else {
            this.map[s] = o;
        }
    }
}
class DummyModConstructorVisitor extends MethodVisitor {
    private stack: any[] = [];
    constructor(private parent: ModClassVisitor, api: number) {
        super(api);
    }
    visitLdcInsn(value: any) {
        this.stack.push(value);
    }
    visitFieldInsn(opcode: number, owner: string, name: string, desc: string) {
        if (opcode === Opcodes.PUTFIELD) {
            const last = this.stack.pop();
            if (last) {
                if (name === "modId") {
                    this.parent.guess.modid = last;
                } else if (name === "version") {
                    this.parent.guess.version = last;
                } else if (name === "name") {
                    this.parent.guess.name = last;
                } else if (name === "url") {
                    this.parent.guess.url = last;
                } else if (name === "parent") {
                    this.parent.guess.parent = last;
                } else if (name === "mcversion") {
                    this.parent.guess.mcversion = last;
                }
            }
        }
    }
}

class ModClassVisitor extends ClassVisitor {
    public fields: { [name: string]: any } = {};
    public className: string = "";
    public isDummyModContainer: boolean = false;
    public isPluginClass: boolean = false;

    public commonFields: any = {};

    public constructor(readonly map: { [key: string]: any }, public guess: any, private baseInfo: ModBaseInfo, readonly corePlugin?: string) {
        super(Opcodes.ASM5);
    }

    private validateType(desc: string) {
        if (desc.indexOf("net/minecraftforge") !== undefined) {
            this.baseInfo.usedForgePackage = true;
        }
        if (desc.indexOf("net/minecraft") !== undefined) {
            this.baseInfo.usedMinecraftPackage = true;
        }
        if (desc.indexOf("cpw/mods/fml") !== undefined) {
            this.baseInfo.usedLegacyFMLPackage = true;
        }
        if (desc.indexOf("net/minecraftforge/client") !== undefined) {
            this.baseInfo.usedMinecraftClientPackage = true;
        }
    }

    visit(version: number, access: number, name: string, signature: string, superName: string, interfaces: string[]): void {
        this.className = name;
        this.isPluginClass = name === this.corePlugin;
        if (superName === "net/minecraftforge/fml/common/DummyModContainer") {
            this.isDummyModContainer = true;
        }
        this.validateType(superName);
        for (const intef of interfaces) {
            this.validateType(intef);
        }
    }

    public visitMethod(access: number, name: string, desc: string, signature: string, exceptions: string[]) {
        if (this.isDummyModContainer && name === "<init>") {
            return new DummyModConstructorVisitor(this, Opcodes.ASM5);
        }
        this.validateType(desc);
        return null;
    }

    public visitField(access: number, name: string, desc: string, signature: string, value: any) {
        this.fields[name] = value;
        return null;
    }

    public visitAnnotation(desc: string, visible: boolean): AnnotationVisitor | null {
        if (desc === "Lnet/minecraftforge/fml/common/Mod;" || desc === "Lcpw/mods/fml/common/Mod;") { return new ModAnnotationVisitor(this.map); }
        return null;
    }
}

interface ModidTree {
    [modid: string]: any;
}


async function tweakMetadata(fs: FileSystem, modidTree: ModidTree) {
    if (! await fs.existsFile("META-INF/MANIFEST.MF")) { return; }
    const data = await fs.readFile("META-INF/MANIFEST.MF");
    const manifest: Record<string, string> = data.toString().split("\n").map((l) => l.split(":").map((s) => s.trim()))
        .reduce((a, b) => ({ ...a, [b[0]]: b[1] }), {}) as any;
    const metadata = {
        modid: "",
        name: "",
        authors: new Array<string>(),
        version: "",
        description: "",
        url: "",
    };
    if (typeof manifest.TweakName === "string") {
        metadata.modid = manifest.TweakName;
        metadata.name = manifest.TweakName;
    }
    if (typeof manifest.TweakAuthor === "string") {
        metadata.authors = [manifest.TweakAuthor];
    }
    if (typeof manifest.TweakVersion === "string") {
        metadata.version = manifest.TweakVersion;
    }
    if (manifest.TweakMetaFile) {
        const file = manifest.TweakMetaFile;
        if (await fs.existsFile(`META-INF/${file}`)) {
            const metadataContent = await fs.readFile(`META-INF/${file}`, "utf-8").then((s) => s.replace(/^\uFEFF/, "")).then(JSON.parse);
            if (metadataContent.id) {
                metadata.modid = metadataContent.id;
            }
            if (metadataContent.name) {
                metadata.name = metadataContent.name;
            }
            if (metadataContent.version) {
                metadata.version = metadataContent.version;
            }
            if (metadataContent.authors) {
                metadata.authors = metadataContent.authors;
            }
            if (metadataContent.description) {
                metadata.description = metadataContent.description;
            }
            if (metadataContent.url) {
                metadata.url = metadataContent.url;
            }
        }
    }
    if (metadata.modid) {
        modidTree[metadata.modid] = metadata;
    }
    return manifest;
}

async function tomlMetadata(fs: FileSystem, modidTree: ModidTree, manifest: any) {
    const existed = await fs.existsFile("META-INF/mods.toml");
    if (existed) {
        const str = await fs.readFile("META-INF/mods.toml", "utf-8");
        const map = parseToml(str);
        if (map.mods instanceof Array) {
            for (const mod of map.mods) {
                const tomlMod = mod as any;
                const modObject: Partial<ModMetadata> = {
                    modid: tomlMod.modId,
                    authorList: typeof map.authors === "string" ? [map.authors] : [],
                    version: tomlMod.version === "${file.jarVersion}"
                        ? manifest?.["Implementation-Version"] : tomlMod.version,
                    name: typeof tomlMod.displayName === "string" ? tomlMod.displayName : "",
                    displayName: tomlMod.displayName,
                    description: tomlMod.description,
                    loaderVersion: map.loaderVersion as string,
                    url: typeof map.displayURL === "string" ? map.displayURL : undefined,
                }
                if (typeof modObject.modid === "string") {
                    if (modObject.modid in modidTree) {
                        Object.assign(modidTree[modObject.modid], modObject);
                    } else {
                        modidTree[modObject.modid] = modObject;
                    }
                }
            }
        }
    }
}

async function asmMetaData(fs: FileSystem, modidTree: ModidTree, baseInfo: ModBaseInfo, manifest?: Record<string, string>) {
    let corePluginClass: string | undefined;
    if (manifest) {
        if (typeof manifest.FMLCorePlugin === "string") {
            const clazz = manifest.FMLCorePlugin.replace(/\./g, "/");
            if (await fs.existsFile(clazz) || await fs.existsFile(`/${clazz}`)) {
                corePluginClass = clazz;
            }
        }
    }
    const guessing: any = {};
    await fs.walkFiles("/", async (f) => {
        if (!f.endsWith(".class")) { return; }
        const data = await fs.readFile(f);
        const metaContainer: any = {};
        const visitor = new ModClassVisitor(metaContainer, guessing, baseInfo, corePluginClass);
        new ClassReader(data).accept(visitor);
        if (Object.keys(metaContainer).length === 0) {
            if (visitor.className === "Config" && visitor.fields && visitor.fields.OF_NAME) {
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
        for (const [k, v] of Object.entries(visitor.fields)) {
            switch (k.toUpperCase()) {
                case "MODID":
                case "MOD_ID":
                    guessing.modid = guessing.modid || v;
                    break;
                case "MODNAME":
                case "MOD_NAME":
                    guessing.name = guessing.name || v;
                    break;
                case "VERSION":
                case "MOD_VERSION":
                    guessing.version = guessing.version || v;
                    break;
                case "MCVERSION":
                    guessing.mcversion = guessing.mcversion || v;
                    break;
            }
        }
        const modid = metaContainer.modid;
        let modMeta = modidTree[modid];
        if (modid && !modMeta) {
            modMeta = {};
            modidTree[modid] = modMeta;
        }

        for (const propKey in metaContainer) {
            modMeta[propKey] = metaContainer[propKey];
        }
    });
    if (guessing.modid && !modidTree[guessing.modid]) {
        modidTree[guessing.modid] = guessing;
    }
}
async function jsonMetaData(fs: FileSystem, modidTree: ModidTree) {
    function readJsonMetadata(json: any) {
        if (json instanceof Array) {
            for (const m of json) { modidTree[m.modid] = m; }
        } else if (json.modList instanceof Array) {
            for (const m of json.modList) { modidTree[m.modid] = m; }
        } else if (json.modid) {
            modidTree[json.modid] = json;
        }
    }
    if (await fs.existsFile("mcmod.info")) {
        try {
            const json = JSON.parse((await fs.readFile("mcmod.info", "utf-8")).replace(/^\uFEFF/, ""));
            readJsonMetadata(json);
        } catch (e) { }
    } else if (await fs.existsFile("cccmod.info")) {
        try {
            const text = (await fs.readFile("cccmod.info", "utf-8")).replace(/^\uFEFF/, "").replace(/\n\n/g, "\\n").replace(/\n/g, "");
            const json = JSON.parse(text);
            readJsonMetadata(json);
        } catch (e) { }
    } else if (await fs.existsFile("neimod.info")) {
        try {
            const text = (await fs.readFile("neimod.info", "utf-8")).replace(/^\uFEFF/, "").replace(/\n\n/g, "\\n").replace(/\n/g, "");
            const json = JSON.parse(text);
            readJsonMetadata(json);
        } catch (e) { }
    }
    // const entry = zip.entries["mcmod.info"];
    // if (entry) {
    //     try {
    //         const json = JSON.parse(await zip.readEntry(entry).then((b) => b.toString("utf-8")));
    //         readJsonMetadata(json);
    //     } catch (e) { }
    // } else {
    //     try {
    //         const jsons = await Promise.all(zip.filterEntries((e) => e.fileName.endsWith(".info"))
    //             .map((e) => zip.readEntry(e).then((b) => b.toString()).then(JSON.parse)));
    //         jsons.forEach(readJsonMetadata);
    //     } catch (e) { }
    // }
}

/**
 * Represent the forge config file
 */
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

    /**
     * Convert a forge config to string
     */
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
            content += "}\n\n";
        });
        return content;
    }

    /**
     * Parse a forge config string into `Config` object
     * @param body The forge config string
     */
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
                if (line === ">") {
                    inlist = false;
                } else if (line.endsWith(" >")) {
                    last.value.push(parseVal(last.type, line.substring(0, line.length - 2)));
                    inlist = false;
                } else {
                    last.value.push(parseVal(last.type, line));
                }
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

export type ModMetaData = ModMetadata;

export interface ModBaseInfo {
    /**
     * Does class files contain cpw package
     */
    usedLegacyFMLPackage: boolean;
    /**
     * Does class files contain forge package
     */
    usedForgePackage: boolean;
    /**
     * Does class files contain minecraft package
     */
    usedMinecraftPackage: boolean;
    /**
     * Does class files contain minecraft.client package
     */
    usedMinecraftClientPackage: boolean;
}

export interface ModMetadata extends ModBaseInfo {
    readonly modid: string;
    readonly version: string;
    readonly name: string;
    readonly description?: string;
    readonly mcversion?: string;
    readonly acceptedMinecraftVersions?: string;
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
    /**
    * Only present in mods.toml
    */
    readonly modLoader?: string;
    /**
     * Only present in mods.toml
     * A version range to match for said mod loader - for regular FML @Mod it will be the minecraft version (without the 1.)
     */
    readonly loaderVersion?: string;
    /**
    * Only present in mods.toml
    */
    readonly displayName?: string;
}

/**
 * Read metadata of the input mod.
 *
 * This will scan the mcmod.info file, all class file for `@Mod` & coremod `DummyModContainer` class.
 * This will also scan the manifest file on `META-INF/MANIFEST.MF` for tweak mod.
 *
 * If the input is totally not a mod. It will throw {@link NonForgeModFileError}.
 *
 * @throws {@link NonForgeModFileError}
 * @param mod The mod path or data
 * @returns The mod metadata
 */
export async function readModMetaData(mod: Uint8Array | string | FileSystem) {
    const fs = await resolveFileSystem(mod);
    const modidTree: ModidTree = {};
    const base: ModBaseInfo = {
        usedLegacyFMLPackage: false,
        usedForgePackage: false,
        usedMinecraftClientPackage: false,
        usedMinecraftPackage: false
    }
    await jsonMetaData(fs, modidTree);
    const manifest = await tweakMetadata(fs, modidTree);
    await tomlMetadata(fs, modidTree, manifest);
    await asmMetaData(fs, modidTree, base, manifest);
    const modids = Object.keys(modidTree);
    if (modids.length === 0) { throw new ForgeModParseFailedError(mod, base); }
    const mods = modids.map((k) => modidTree[k] as ModMetadata)
        .filter((m) => m.modid !== undefined);
    for (const mod of mods) {
        Object.assign(mod, base);
    }
    return mods;
}

export class ForgeModParseFailedError extends Error {
    constructor(readonly mod: Uint8Array | string | FileSystem, readonly baseInfo: ModBaseInfo) {
        super("Cannot find the mod metadata in the mod!");
    }
}
