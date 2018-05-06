import * as Zip from 'jszip'
import * as fs from 'fs-extra'

export class ResourcePack {
    constructor(readonly packName: string, readonly description: string, readonly format: number, readonly icon?: string) { }
}

export namespace ResourcePack {
    async function readZip(fileName: string, zipFile: Zip) {
        let { description, pack_format } = await zipFile.file('pack.mcmeta').async('nodebuffer')
            .then(data => JSON.parse(data.toString('utf-8').trim()).pack);
        let icon = ''
        try {
            icon = await zipFile.file('pack.png').async('nodebuffer')
                .then(data => 'data:image/png;base64, ' + data.toString('base64'));
        } catch (e) { }
        return new ResourcePack(fileName, description, pack_format, icon)
    }
    async function readDirectory(filePath: string) {
        const metaPath = `${filePath}/pack.mcmeta`;
        const iconPath = `${filePath}/pack.png`;

        if (!fs.existsSync(metaPath)) throw Error('Illegal Resourcepack')
        const metadata = await fs.readFile(metaPath)
        const { description, pack_format } = JSON.parse(metadata.toString('utf-8').trim()).pack;
        let icon = ''
        try {
            icon = await fs.readFile(iconPath)
                .then(data => 'data:image/png;base64, ' + data.toString('base64'));
        } catch (e) { }
        return new ResourcePack(filePath, description, pack_format, icon)
    }
    /**
     * Read the resource pack metadata from zip file or directory. 
     * 
     * If you have already read the data of the zip file, you can pass it as the second parameter. The second parameter will be ignored on reading directory.
     *  
     * @param filePath The absolute path of the resource pack file
     * @param buffer The zip file data Buffer you read. 
     */
    export async function read(filePath: string, buffer?: Buffer): Promise<ResourcePack> {
        const stat = await fs.stat(filePath);
        if (stat.isDirectory()) return readDirectory(filePath);
        const zip = await new Zip().loadAsync(buffer ? buffer : await fs.readFile(filePath));
        return readZip(filePath, zip);
    }
    /**
     * @deprecated
     */
    export async function readFolder(filePath: string) {
        if (!fs.existsSync(filePath)) throw new Error(`Cannot parse empty! ${filePath}`)
        if ((await fs.stat(filePath)).isDirectory()) {
            return readDirectory(filePath);
        }
    }
}

export default ResourcePack