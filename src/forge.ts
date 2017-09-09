import download from './utils/download'
import CHECKSUM from './utils/checksum'
import UPDATE from './utils/update'
import * as path from 'path'
import * as Zip from 'jszip'
import * as fs from 'fs-extra'
import { Version } from './version';
import { MinecraftLocation, MinecraftFolder } from './utils/folder';
import { ClassVisitor, Opcodes, AnnotationVisitor, ClassReader } from 'java-asm'

import Mod from './mod'
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

        public visitAnnotation(desc: string, visible: boolean): AnnotationVisitor | null {
            if (desc == "Lnet/minecraftforge/fml/common/Mod;" || desc === 'Lcpw/mods/fml/common/Mod;') return new AVisitor(this.map);
            return null;
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
        readonly mcVersion?: string,
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
    export async function meta(mod: Buffer | string) {
        let zip;
        if (mod instanceof Buffer)
            zip = await new Zip().loadAsync(mod);
        else if (typeof mod === 'string') {
            zip = await new Zip().loadAsync(await fs.readFile(mod))
        } else {
            throw ('Illegal input type! Expect Buffer or string (filePath)')
        }
        const meta = await zip.file('mcmod.info').async('nodebuffer').then(buf => JSON.parse(buf.toString()))
        const modidTree: any = {}
        for (const m of meta)
            modidTree[m.modid] = m;

        for (const key in zip.files) {
            if (key.endsWith('.class')) {
                const asmmod: any = (await zip.files[key].async('nodebuffer')
                    .then(data => {
                        const map = {};
                        new ClassReader(data).accept(new KVisitor(map))
                        return map
                    }))
                let modid = asmmod.modid;
                const mod = modidTree[modid];
                if (mod)
                    for (const key in asmmod)
                        mod[key] = asmmod;
                else modidTree[modid] = asmmod;
            }
        }
        return Object.keys(modidTree).map(k => modidTree[k] as Forge.MetaData)
    }

    export async function install(version: VersionMeta, minecraft: MinecraftLocation, checksum: boolean = false,
        maven: string = 'http://files.minecraftforge.net/maven'): Promise<Version> {
        const mc = typeof minecraft === 'string' ? new MinecraftFolder(minecraft) : minecraft;
        let versionPath = `${version.mcversion}-${version.version}`
        let universalURL = `${maven}/net/minecraftforge/forge/${versionPath}/forge-${versionPath}-universal.jar`
        let installerURL = `${maven}/net/minecraftforge/forge/${versionPath}/forge-${versionPath}-installer.jar`
        let localForgePath = `${version.mcversion}-forge-${version.version}`
        let root = mc.getVersionRoot(localForgePath)
        let filePath = path.join(root, `${localForgePath}.jar`)
        let jsonPath = path.join(root, `${localForgePath}.json`)
        await fs.ensureDir(root)
        let universalBuffer;
        if (!fs.existsSync(filePath)) {
            try {
                fs.outputFile(filePath, universalBuffer = await universalURL)
            }
            catch (e) {
                await fs.outputFile(filePath,
                    universalBuffer = await Zip(await download(installerURL))
                        .file(`forge-${versionPath}-universal.jar`)
                        .async('nodebuffer'))
            }
            if (checksum) {
                let sum
                if (version.files[2] &&
                    version.files[2][1] == 'universal' &&
                    version.files[2][2] &&
                    await CHECKSUM(filePath) != version.files[2][2])
                    throw new Error('Checksum not matched! Probably caused by incompleted file or illegal file source.')
                else
                    for (let arr of version.files)
                        if (arr[1] == 'universal')
                            if (await CHECKSUM(filePath) != arr[2])
                                throw new Error('Checksum not matched! Probably caused by incompleted file or illegal file source.')
            }
        }
        if (!fs.existsSync(jsonPath)) {
            await fs.outputFile(jsonPath,
                await Zip(universalBuffer).file('version.json')
                    .async('nodebuffer'))
        }
        return Version.parse(minecraft, localForgePath)
    }
}
Mod.register('forge', (option) => {
    return Forge.meta(option).then(mods => mods.map(m => new Mod<Forge.MetaData>('forge', `${m.modid}:${m.version}`, m)))
})
export default Forge
