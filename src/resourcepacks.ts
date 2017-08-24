import * as Zip from 'jszip'
import * as fs from 'fs-extra'

export class ResourcePack {
    constructor(readonly packName: string, readonly description: string, readonly format: number, readonly icon?: string) { }
}

export namespace ResourcePack {
    async function readZip(fileName: string, zipFile: Zip, readIcon?: boolean) {
        let { description, pack_format } = await zipFile.file('pack.mcmeta').async('nodebuffer').then(data => JSON.parse(data.toString()).pack);
        let icon = readIcon ?
            await zipFile.file('pack.png').async('nodebuffer')
                .then(data => 'data:image/png;base64, ' + data.toString('base64')) :
            '';
        return new ResourcePack(fileName, description, pack_format, icon)
    }
    export async function readFromFile(fileName: string, readIcon: boolean = false): Promise<ResourcePack> {
        return readFromBuffer(fileName, await fs.readFile(fileName), readIcon)
    }
    export function readFromBuffer(fileName: string, buffer: Buffer, readIcon: boolean = false): Promise<ResourcePack> {
        return readZip(fileName, new Zip(buffer), readIcon);
    }
}

export default ResourcePack