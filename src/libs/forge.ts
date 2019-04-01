import { downloadTask, download } from './utils/download';
import CHECKSUM from './utils/checksum';
import UPDATE, { getIfUpdate, UpdatedObject } from './utils/update';
import Task from 'treelike-task';
import * as path from 'path';
import * as Zip from 'jszip';
import * as fs from 'fs-extra';
import { Version, Download } from './version';
import { MinecraftLocation, MinecraftFolder } from './utils/folder';
import { ClassVisitor, Opcodes, AnnotationVisitor, ClassReader, FieldVisitor, Attribute } from 'java-asm'
import * as crypto from 'crypto';

import Mod from './mod';
export namespace Forge {
    class AVisitor extends AnnotationVisitor {
        constructor(readonly map: { [key: string]: any }) { super(Opcodes.ASM5); }
        public visit(s: string, o: any) {
            this.map[s] = o;
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
                this.fields[name] = value;
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
                    if (!category) throw {
                        type: 'CorruptedForgeConfig',
                        reason: 'MissingCategory',
                        line,
                    };
                    config[category].properties.push(last = { name, type, value, comment } as Property)
                } else {
                    inlist = false;
                    if (!category) throw {
                        type: 'CorruptedForgeConfig',
                        reason: 'MissingCategory',
                        line,
                    };
                    config[category].properties.push({ name: pair[0], value: parseVal(type, pair[1]), type, comment } as Property)
                }
                comment = undefined;
            }
            for (const line of lines) {
                if (inlist) {
                    if (!last) throw {
                        type: 'CorruptedForgeConfig',
                        reason: 'CorruptedList',
                        line,
                    }
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
                        } else throw {
                            type: 'CorruptedForgeConfig',
                            reason: 'MissingCategory',
                            line,
                        };
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
                        } else throw {
                            type: 'CorruptedForgeConfig',
                            reason: 'Duplicated',
                            line,
                        }
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
        readonly credits?: string,
        readonly parent?: string,
        readonly screenShots?: string[],
        readonly fingerprint?: string,
        readonly dependencies?: string,
        readonly accpetRemoteVersions?: string,
        readonly acceptSaveVersions?: string,
        readonly isClientOnly?: boolean,
        readonly isServerOnly?: boolean
    }

    const parser = require('fast-html-parser');

    export interface ForgeWebPageVersion {

        timestamp: string,

        version: string,
        date: string,
        changelog: Download,
        installer: Download,
        mdk: Download,
        universal: Download,
        type: 'buggy' | 'recommend' | 'common'
    }

    export namespace ForgeWebPageVersion {
        export interface Download {
            md5: string,
            sha1: string,
            path: string
        }
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
            },
            remote?: string
        }): Promise<{ list: VersionMetaList, date: string }> {
            if (!option) option = {}
            return UPDATE({
                fallback: option.fallback,
                remote: option.remote || 'http://files.minecraftforge.net/maven/net/minecraftforge/forge/json'
            }).then(result => result as { list: VersionMetaList, date: string })
        }

        function parseWebPage(content: string) {
            return parser.parse(content).querySelector('.download-list').querySelector('tbody').querySelectorAll('tr')
                .map((e: any) => {
                    const links = e.querySelector('.download-links').childNodes
                        .filter((e: any) => e.tagName == 'li')
                        .map((e: any) => {
                            const tt = e.querySelector('.info-tooltip');
                            const url = tt.querySelector('a') || e.querySelector('a');
                            return {
                                md5: tt.childNodes[2].text.trim(),
                                sha1: tt.childNodes[6].text.trim(),
                                path: url.attributes['href']
                            };
                        });
                    return {
                        version: e.querySelector('.download-version').text.trim(),
                        date: e.querySelector('.download-time').text.trim(),
                        changelog: links[0],
                        installer: links[1],
                        'installer-win': links[2],
                        mdk: links[3],
                        universal: links[4],
                    }
                });
        }
        
        export async function getWebPage(mcversion: string = '', oldObject?: UpdatedObject): Promise<ForgeWebPageVersion | undefined> {
            const url = mcversion == '' ? `http://files.minecraftforge.net/maven/net/minecraftforge/forge/index.html` : `http://files.minecraftforge.net/maven/net/minecraftforge/forge/index_${mcversion}.html`
            return getIfUpdate(url, parseWebPage, oldObject) as Promise<ForgeWebPageVersion | undefined>;
        }

        export function mcversions(list: VersionMetaList) {
            return Object.keys(list.mcversion);
        }
        export function metasByVersion(list: VersionMetaList, version: string) {
            return list.mcversion[version].map(n => list.number[n]);
        }
        export function recommendedsVersions(list: VersionMetaList) {
            return Object.keys(list.promos);
        }
        export function metaByRecommended(list: VersionMetaList, recommendedsVersion: string) {
            return list.number[list.promos[recommendedsVersion]];
        }
    }

    export interface VersionMetaList0 {
        mcversion: { [key: string]: VersionMeta },
        latest: { [key: string]: VersionMeta },
    }

    export interface VersionMeta {
        checksum: { [key: string]: string | undefined }
        universal: string,
        installer?: string,
        mcversion: string,
        version: string
    }

    async function asmMetaData(zip: Zip, modidTree: any) {
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
                if (mod)
                    for (const key in asmmod)
                        mod[key] = asmmod[key];
                else modidTree[modid] = asmmod;
            }
        }
    }

    async function jsonMetaData(zip: Zip, modidTree: any) {
        try {
            for (const m of await zip.file('mcmod.info').async('nodebuffer').then(buf => JSON.parse(buf.toString().trim())))
                modidTree[m.modid] = m;
        } catch (e) { }
    }

    async function regulize(mod: Buffer | string | Zip) {
        let zip;
        if (mod instanceof Zip)
            zip = mod;
        else if (mod instanceof Buffer)
            zip = await new Zip().loadAsync(mod);
        else if (typeof mod === 'string')
            zip = await new Zip().loadAsync(await fs.readFile(mod))
        else
            throw new Error('Illegal input! Expect Buffer or string (filePath)')
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
        if (!asmOnly) await jsonMetaData(zip, modidTree);
        await asmMetaData(zip, modidTree);
        const modids = Object.keys(modidTree);
        if (modids.length === 0) throw { type: 'NonmodTypeFile' }
        return modids.map(k => modidTree[k] as Forge.MetaData)
            .filter(m => m.modid !== undefined)
    }
    export async function meta(mod: Buffer | string | Zip, asmOnly: boolean = false) {
        return readModMetaData(mod, asmOnly);
    }

    function validateCheckSum(data: Buffer, algorithm: string, expectValue: string) {
        try {
            return expectValue == crypto.createHash(algorithm).update(data).digest('hex')
        }
        catch (e) {
            return false;
        }
    }

    function installTask0(version: VersionMeta, minecraft: MinecraftLocation, checksum: boolean = false,
        maven: string = 'http://files.minecraftforge.net/maven') {
        return async (context: Task.Context) => {
            const mc = typeof minecraft === 'string' ? new MinecraftFolder(minecraft) : minecraft;
            const versionPath = `${version.mcversion}-${version.version}`
            // const universalURL = `${maven}/net/minecraftforge/forge/${versionPath}/forge-${versionPath}-universal.jar`
            // const installerURL = `${maven}/net/minecraftforge/forge/${versionPath}/forge-${versionPath}-installer.jar`
            const universalURL = `${maven}${version.universal}`;
            const installerURL = `${maven}${version.installer}`;

            let universalBuffer: any;
            try {
                universalBuffer = await context.execute('downloadJar', downloadTask(universalURL));
            } catch (e) {
                universalBuffer = await context.execute('redownloadJar', downloadTask(installerURL));
                universalBuffer = await context.execute('extractJar', async () =>
                    (await Zip().loadAsync(universalBuffer))
                        .file(`forge-${versionPath}-universal.jar`)
                        .async('nodebuffer'))
            }

            const buff: Buffer = await context.execute('extraVersionJson',
                async () => (await Zip().loadAsync(universalBuffer)).file('version.json').async('nodebuffer'));
            const versionJSON = JSON.parse(buff.toString());

            const localForgePath = versionJSON.id;
            const libForgePath = mc.getLibraryByPath(`net/minecraftforge/forge/${versionPath}/forge-${versionPath}.jar`);
            const rootPath = mc.getVersionRoot(localForgePath);
            const jsonPath = path.join(rootPath, `${localForgePath}.json`);

            await context.execute('ensureRoot', () => fs.ensureDir(rootPath))
            if (!fs.existsSync(libForgePath) || !fs.existsSync(jsonPath)) {
                await context.execute('writeJar', async () => fs.outputFile(libForgePath, universalBuffer));
                await context.execute('writeJson', async () => fs.writeJSON(jsonPath, versionJSON));

                if (checksum) {
                    const data = await fs.readFile(libForgePath);
                    for (const key in version.checksum) {
                        if (!validateCheckSum(data, key, version.checksum[key] as string)) {
                            throw new Error('Checksum not matched! Probably caused by incompleted file or illegal file source.')
                        }
                    }
                }
            }
            return versionJSON.id;
        }
    }

    export function install(version: VersionMeta, minecraft: MinecraftLocation, option?:
        {
            checksum?: boolean,
            maven?: string,
            id?: string,
        }) {
        return installTask(version, minecraft, option);
    }
    export function installTask(version: VersionMeta, minecraft: MinecraftLocation, option?:
        {
            checksum?: boolean,
            maven?: string,
            id?: string,
        }): Task<void> {
        const op = option || {}
        return Task.create('installForge', installTask0(version, minecraft, op.checksum || false, op.maven || 'http://files.minecraftforge.net/maven'));
    }

    export function installAndCheckTask(version: VersionMeta, minecraft: MinecraftLocation, checksum: boolean = false,
        maven: string = 'http://files.minecraftforge.net/maven'): Task<Version> {
        return Task.create('installForgeAndCheck', async (context) => {
            const id = await context.execute('install', installTask0(version, minecraft, checksum, maven));
            const ver = await context.execute('versionParse', () => Version.parse(minecraft, id));
            return context.execute('checkDependencies', Version.checkDependenciesTask(ver, minecraft).work)
        })
    }

    export async function installAndCheck(version: VersionMeta, minecraft: MinecraftLocation, checksum: boolean = false,
        maven: string = 'http://files.minecraftforge.net/maven'): Promise<Version> {
        return installAndCheckTask(version, minecraft, checksum, maven).execute();
    }
}

Mod.register('forge', option => Forge.readModMetaData(option).then(mods => mods.map(m => new Mod<Forge.MetaData>(`${m.modid}:${m.version ? m.mcversion : '0.0.0'}`, m))))

// declare module './mod' {
//     namespace Mod {
//         function parse(data: string | Buffer, type: 'forge'): Promise<Mod.File<Forge.MetaData>>
//     }
// }

export default Forge
