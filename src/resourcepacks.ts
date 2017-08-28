import * as Zip from 'jszip'
import * as fs from 'fs-extra'

export class ResourcePack {
    constructor(readonly packName: string, readonly description: string, readonly format: number, readonly icon?: string) { }
}

export namespace ResourcePack {
    async function readZip(fileName: string, zipFile: Zip) {
        let { description, pack_format } = await zipFile.file('pack.mcmeta').async('nodebuffer').then(data => JSON.parse(data.toString()).pack);
        let icon = ''
        try {
            icon = await zipFile.file('pack.png').async('nodebuffer')
                .then(data => 'data:image/png;base64, ' + data.toString('base64'));
        } catch (e) { }
        return new ResourcePack(fileName, description, pack_format, icon)
    }
    export async function read(filePath: string, buffer?: Buffer): Promise<ResourcePack> {
        return readZip(filePath, await new Zip().loadAsync(buffer ? buffer : await fs.readFile(filePath)));
    }
}

export default ResourcePack