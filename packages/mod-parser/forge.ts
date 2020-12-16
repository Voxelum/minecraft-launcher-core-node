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

    public constructor(readonly map: { [key: string]: any }, public guess: any, private baseInfo: Partial<ForgeModBaseInfo>, readonly corePlugin?: string) {
        super(Opcodes.ASM5);
    }

    private validateType(desc: string) {
        if (desc.indexOf("net/minecraftforge") !== -1) {
            this.baseInfo.usedForgePackage = true;
        }
        if (desc.indexOf("net/minecraft") !== -1) {
            this.baseInfo.usedMinecraftPackage = true;
        }
        if (desc.indexOf("cpw/mods/fml") !== -1) {
            this.baseInfo.usedLegacyFMLPackage = true;
        }
        if (desc.indexOf("net/minecraft/client") !== -1) {
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

export interface ForgeModRecord {
    [modid: string]: ForgeModMetadata;
}


/**
 * Read the mod info from `META-INF/MANIFEST.MF`
 * @returns The manifest directionary
 */
export async function readForgeModManifest(mod: ForgeModInput, output: ForgeModRecord = {}) {
    const fs = await resolveFileSystem(mod);
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
        output[metadata.modid] = metadata;
    }
    return manifest;
}

/**
 * Read mod metadata from new toml metadata file.
 */
export async function readForgeModToml(mod: ForgeModInput, output: ForgeModRecord, manifest?: Record<string, string>) {
    const fs = await resolveFileSystem(mod);
    const existed = await fs.existsFile("META-INF/mods.toml");
    if (existed) {
        const str = await fs.readFile("META-INF/mods.toml", "utf-8");
        const map = parseToml(str);
        if (map.mods instanceof Array) {
            for (const mod of map.mods) {
                const tomlMod = mod as any;
                const modObject: ForgeModMetadata = {
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
                    if (modObject.modid in output) {
                        Object.assign(output[modObject.modid], modObject);
                    } else {
                        output[modObject.modid] = modObject;
                    }
                }
            }
        }
    }
    return output;
}

/**
 * Use asm to scan all the class files of the mod. This might take long time to read.
 */
export async function readForgeModAsm(mod: ForgeModInput, output: ForgeModRecord = {}, options: { baseInfoOutput?: ForgeModBaseInfo, manifest?: Record<string, string> } = {}) {
    const fs = await resolveFileSystem(mod);
    const { baseInfoOutput: baseInfo = {
        usedForgePackage: false,
        usedLegacyFMLPackage: false,
    }, manifest } = options;
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
        let modMeta = output[modid];
        if (modid && !modMeta) {
            modMeta = {} as any;
            output[modid] = modMeta;
        }

        for (const propKey in metaContainer) {
            (modMeta as any)[propKey] = metaContainer[propKey];
        }
    });
    if ((baseInfo.usedForgePackage || baseInfo.usedLegacyFMLPackage) && guessing.modid && !output[guessing.modid]) {
        output[guessing.modid] = guessing;
    }
    return output;
}
/**
 * Read `mcmod.info`, `cccmod.info`, and `neimod.info` json file
 * @param mod The mod path or buffer or opened file system.
 */
export async function readForgeModJson(mod: ForgeModInput, output: ForgeModRecord = {}) {
    const fs = await resolveFileSystem(mod);
    function readJsonMetadata(json: any) {
        if (json instanceof Array) {
            for (const m of json) { output[m.modid] = m; }
        } else if (json.modList instanceof Array) {
            for (const m of json.modList) { output[m.modid] = m; }
        } else if (json.modid) {
            output[json.modid] = json;
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
    return output;
}

export interface ForgeModBaseInfo {
    /**
     * Does class files contain cpw package
     */
    usedLegacyFMLPackage?: boolean;
    /**
     * Does class files contain forge package
     */
    usedForgePackage?: boolean;
    /**
     * Does class files contain minecraft package
     */
    usedMinecraftPackage?: boolean;
    /**
     * Does class files contain minecraft.client package
     */
    usedMinecraftClientPackage?: boolean;
}

export interface ForgeModMetadata extends ForgeModBaseInfo {
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

type ForgeModInput = Uint8Array | string | FileSystem;

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
export async function readForgeMod(mod: ForgeModInput) {
    const fs = await resolveFileSystem(mod);
    const record: ForgeModRecord = {};
    const base: ForgeModBaseInfo = {
        usedLegacyFMLPackage: false,
        usedForgePackage: false,
        usedMinecraftClientPackage: false,
        usedMinecraftPackage: false
    }
    await readForgeModJson(fs, record);
    const manifest = await readForgeModManifest(fs, record);
    await readForgeModToml(fs, record, manifest);
    await readForgeModAsm(fs, record, { baseInfoOutput: base, manifest });
    const modids = Object.keys(record);
    if (modids.length === 0) { throw new ForgeModParseFailedError(mod, base); }
    const mods = modids.map((k) => record[k])
        .filter((m) => m.modid !== undefined);
    for (const mod of mods) {
        Object.assign(mod, base);
    }
    return mods;
}

export class ForgeModParseFailedError extends Error {
    constructor(readonly mod: ForgeModInput, readonly baseInfo: ForgeModBaseInfo) {
        super("Cannot find the mod metadata in the mod!");
    }
}
