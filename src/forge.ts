import download, { DownloadTask } from './utils/download'
import CHECKSUM from './utils/checksum'
import UPDATE from './utils/update'
import * as path from 'path'
import * as Zip from 'jszip'
import * as fs from 'fs-extra'
import { Version } from './version';
import { MinecraftLocation, MinecraftFolder } from './utils/folder';
import { ClassVisitor, Opcodes, AnnotationVisitor, ClassReader, FieldVisitor, Attribute } from 'java-asm'

import Mod from './mod'
import { AbstractTask, Task } from './utils/task';
export namespace Forge {
    class AVisitor extends AnnotationVisitor {
        constructor(readonly map: { [key: string]: any }) { super(Opcodes.ASM5); }
        public visit(s: string, o: any) {
            this.map[s] = o
        }
    }
    class KVisitor extends ClassVisitor {
        public constructor(readonly map: { [key: string]: any }) {
            super(Opcodes.ASM5);
        }
        private className: string = '';
        public fields: any = {}
        visit(version: number, access: number, name: string, signature: string, superName: string, interfaces: string[]): void {
            this.className = name;
        }
        public visitField(access: number, name: string, desc: string, signature: string, value: any) {
            if (this.className === 'Config')
                this.fields[name] = value
            return null;
        }

        public visitAnnotation(desc: string, visible: boolean): AnnotationVisitor | null {
            if (desc == "Lnet/minecraftforge/fml/common/Mod;" || desc === 'Lcpw/mods/fml/common/Mod;') return new AVisitor(this.map);
            return null;
        }
    }
    export interface Config {
        [category: string]: {
            comment?: string,
            properties: Config.Property<any>[],
        };
    }
    export namespace Config {
        export type Type = 'I' | 'D' | 'S' | 'B'
        export interface Property<T = number | boolean | string | number[] | boolean[] | string[]> {
            readonly type: Type,
            readonly name: string,
            readonly comment?: string,
            value: T,
        }

        export function stringify(config: Config) {
            let string = '# Configuration file\n\n\n';
            const propIndent = '    ', arrIndent = '        '
            Object.keys(config).forEach(cat => {
                string += `${cat} {\n\n`
                config[cat].properties.forEach(prop => {
                    if (prop.comment) {
                        const lines = prop.comment.split('\n')
                        for (const l of lines)
                            string += `${propIndent}# ${l}\n`
                    }
                    if (prop.value instanceof Array) {
                        string += `${propIndent}${prop.type}:${prop.name} <\n`
                        prop.value.forEach(v => string += `${arrIndent}${v}\n`)
                        string += `${propIndent}>\n`
                    } else {
                        string += `${propIndent}${prop.type}:${prop.name}=${prop.value}\n`
                    }
                    string += '\n'
                })
                string += `}\n\n`
            })
            return string
        }

        export function parse(string: string): Config {
            const lines = string.split('\n').map(s => s.trim())
                .filter(s => s.length !== 0)
            let category: string | undefined = undefined;
            let pendingCategory: string | undefined;

            const parseVal = (type: Type, value: any) => {
                const map: { [string: string]: (s: string) => any } = {
                    I: Number.parseInt,
                    D: Number.parseFloat,
                    S: (s: string) => s,
                    B: (s: string) => s === 'true',
                }
                const handler = map[type];
                return handler(value)
            }
            const config: Config = {};
            let inlist = false;
            let comment: string | undefined = undefined;
            let last: any = undefined;

            const readProp = (type: Type, line: string) => {
                line = line.substring(line.indexOf(':') + 1, line.length);
                const pair = line.split('=')
                if (pair.length == 0 || pair.length == 1) {
                    let value = undefined;
                    let name = undefined;
                    if (line.endsWith(' <')) {
                        value = []
                        name = line.substring(0, line.length - 2)
                        inlist = true;
                    } else { }
                    if (!category) throw new Error(line);
                    config[category].properties.push(last = { name, type, value, comment } as Property)
                } else {
                    inlist = false;
                    if (!category) throw new Error(line);
                    config[category].properties.push({ name: pair[0], value: parseVal(type, pair[1]), type, comment } as Property)
                }
                comment = undefined;
            }
            for (const line of lines) {
                if (inlist) {
                    if (!last) throw new Error(line)
                    if (line === '>') inlist = false;
                    else if (line.endsWith(' >')) {
                        last.value.push(parseVal(last.type, line.substring(0, line.length - 2)))
                        inlist = false;
                    } else last.value.push(parseVal(last.type, line))
                    continue
                }
                switch (line.charAt(0)) {
                    case '#':
                        if (!comment)
                            comment = line.substring(1, line.length).trim();
                        else {
                            comment = comment.concat('\n', line.substring(1, line.length).trim())
                        }
                        break;
                    case 'I':
                    case 'D':
                    case 'S':
                    case 'B':
                        readProp(line.charAt(0) as Type, line);
                        break;
                    case '<':
                        break;
                    case '{':
                        if (pendingCategory) {
                            category = pendingCategory;
                            config[category] = { comment, properties: [] }
                            comment = undefined;
                        }
                        else throw new Error(line)
                        break;
                    case '}':
                        category = undefined;
                        break;
                    default:
                        if (!category) {
                            if (line.endsWith('{')) {
                                category = line.substring(0, line.length - 1).trim()
                                config[category] = { comment, properties: [] }
                                comment = undefined;
                            } else {
                                pendingCategory = line;
                            }
                        } else throw new Error(line)
                }
            }
            return config;
        }
    }

    export interface ModIndentity {
        readonly modid: string,
        readonly version: string
    }
    export interface MetaData extends ModIndentity {
        readonly modid: string,
        readonly name: string,
        readonly description?: string,
        readonly version: string,
        readonly mcversion?: string,
        readonly acceptMinecraftVersion?: string,
        readonly updateJSON?: string,
        readonly url?: string,
        readonly logoFile?: string,
        readonly authorList?: string[],
        readonly credit?: string,
        readonly parent?: string,
        readonly screenShots?: string[],
        readonly fingerprint?: string,
        readonly dependencies?: string,
        readonly accpetRemoteVersions?: string,
        readonly acceptSaveVersions?: string,
        readonly isClientOnly?: boolean,
        readonly isServerOnly?: boolean
    }

    export interface VersionMetaList {
        adfocus: string,
        artifact: string,
        branches: { [key: string]: number[] }, //sort by github branch
        mcversion: { [key: string]: number[] }, //sort by mcversion
        homepage: string,
        webpath: string,
        name: string,
        promos: { [key: string]: number }, //list all latest
        number: { [key: string]: VersionMeta } //search by number
    }

    export namespace VersionMetaList {
        export async function update(option?: {
            fallback?: {
                list: VersionMetaList, date: string
            }, remote?: string
        }): Promise<{ list: VersionMetaList, date: string }> {
            if (!option) option = {}
            return UPDATE({
                fallback: option.fallback,
                remote: option.remote || 'http://files.minecraftforge.net/maven/net/minecraftforge/forge/json'
            }).then(result => result as { list: VersionMetaList, date: string })
        }
    }

    export interface VersionMeta {
        branch: string | null,
        build: number,
        files: [string, string, string][],
        mcversion: string,
        modified: number,
        version: string
    }
    export async function meta(mod: Buffer | string | Zip) {
        let zip;
        if (mod instanceof Zip)
            zip = mod;
        else if (mod instanceof Buffer)
            zip = await new Zip().loadAsync(mod);
        else if (typeof mod === 'string') {
            zip = await new Zip().loadAsync(await fs.readFile(mod))
        } else {
            throw ('Illegal input type! Expect Buffer or string (filePath)')
        }
        const modidTree: any = {}

        try {
            for (const m of await zip.file('mcmod.info').async('nodebuffer').then(buf => JSON.parse(buf.toString().trim())))
                modidTree[m.modid] = m;
        } catch (e) { }
        for (const key in zip.files) {
            if (key.endsWith('.class')) {
                const asmmod: any = (await zip.files[key].async('nodebuffer')
                    .then(data => {
                        const map: any = {};
                        let visitor;
                        new ClassReader(data).accept(visitor = new KVisitor(map))
                        if (Object.keys(map).length === 0) {
                            if (visitor.fields && visitor.fields.OF_NAME) {
                                map.modid = visitor.fields.OF_NAME;
                                map.name = visitor.fields.OF_NAME;
                                map.mcversion = visitor.fields.MC_VERSION;
                                map.version = `${visitor.fields.OF_EDITION}_${visitor.fields.OF_RELEASE}`
                                map.description = 'OptiFine is a Minecraft optimization mod. It allows Minecraft to run faster and look better with full support for HD textures and many configuration options.'
                                map.authorList = ['sp614x']
                                map.url = 'https://optifine.net'
                                map.isClientOnly = true
                            }
                        }
                        return map
                    }))
                let modid = asmmod.modid;
                const mod = modidTree[modid];
                if (mod) for (const key in asmmod)
                    mod[key] = asmmod[key];
                else modidTree[modid] = asmmod;
            }
        }
        const modids = Object.keys(modidTree);
        if (modids.length === 0) throw new Error('Not a Mod!')

        return modids.map(k => modidTree[k] as Forge.MetaData)
            .filter(m => m.modid !== undefined)
    }

    class InstallTask extends AbstractTask<Version>{
        constructor(readonly version: VersionMeta, readonly minecraft: MinecraftLocation, readonly checksum: boolean = false,
            readonly maven: string = 'http://files.minecraftforge.net/maven') { super() }
        async execute(context: Task.Context): Promise<Version> {
            const { version, minecraft, checksum, maven } = this;
            const mc = typeof minecraft === 'string' ? new MinecraftFolder(minecraft) : minecraft;
            let versionPath = `${version.mcversion}-${version.version}`
            let universalURL = `${maven}/net/minecraftforge/forge/${versionPath}/forge-${versionPath}-universal.jar`
            let installerURL = `${maven}/net/minecraftforge/forge/${versionPath}/forge-${versionPath}-installer.jar`
            let localForgePath = `${version.mcversion}-forge-${version.version}`
            let root = mc.getVersionRoot(localForgePath)
            let filePath = path.join(root, `${localForgePath}.jar`)
            let jsonPath = path.join(root, `${localForgePath}.json`)
            await context.wrap('unsureRoot', fs.ensureDir(root))
            let universalBuffer;
            if (!fs.existsSync(filePath)) {
                try {
                    await context.wrap('writeJar', fs.outputFile(filePath,
                        universalBuffer = await context.execute(new DownloadTask('downloadJar', universalURL))))
                }
                catch (e) {
                    await context.wrap('rewriteJar', fs.outputFile(filePath,
                        universalBuffer = await (await Zip().loadAsync(await context.execute(new DownloadTask('redownloadJar', installerURL))))
                            .file(`forge-${versionPath}-universal.jar`)
                            .async('nodebuffer')))
                }
                if (checksum) {
                    let sum
                    if (version.files[2] &&
                        version.files[2][1] == 'universal' &&
                        version.files[2][2] &&
                        (await context.wrap('checksum', CHECKSUM(filePath))) != version.files[2][2])
                        throw new Error('Checksum not matched! Probably caused by incompleted file or illegal file source.')
                    else
                        for (let arr of version.files)
                            if (arr[1] == 'universal')
                                if ((await context.wrap('checksum', CHECKSUM(filePath))) != arr[2])
                                    throw new Error('Checksum not matched! Probably caused by incompleted file or illegal file source.')
                }
            }
            if (!fs.existsSync(jsonPath)) {
                await context.wrap('writeJson', fs.outputFile(jsonPath,
                    await (await Zip().loadAsync(universalBuffer)).file('version.json')
                        .async('nodebuffer')))
            }
            return Version.parse(minecraft, localForgePath)
        }

    }

    export function installTask(version: VersionMeta, minecraft: MinecraftLocation, checksum: boolean = false,
        maven: string = 'http://files.minecraftforge.net/maven'): Task<Version> {
        return new InstallTask(version, minecraft, checksum, maven)
    }

    export async function install(version: VersionMeta, minecraft: MinecraftLocation, checksum: boolean = false,
        maven: string = 'http://files.minecraftforge.net/maven'): Promise<Version> {
        return Task.execute(new InstallTask(version, minecraft, checksum, maven))
    }
}
Mod.register('forge', option => Forge.meta(option).then(mods => mods.map(m => new Mod<Forge.MetaData>('forge', `${m.modid}:${m.version ? m.mcversion : '0.0.0'}`, m))))
export default Forge
