import { ResourcePackMetaData } from "@xmcl/common";
import * as fs from "fs";
import { bufferEntry, open, parseEntries, ZipFile } from "yauzlw";
export interface ResourcePack {
    readonly path: string;
    readonly type: "directory" | "zip";
    readonly metadata: ResourcePackMetaData;
    /**
     * Icon data url in base 64
     */
    icon: string;
}
export class ResourcePack {
    constructor(readonly path: string, readonly type: "directory" | "zip", readonly metadata: ResourcePackMetaData, public icon: string) { }
}

export namespace ResourcePack {
    async function readZip(fileName: string, zipFile: ZipFile, cacheIcon?: boolean) {
        const loadEntries = cacheIcon ? ["pack.mcmeta", "pack.png"] : ["pack.mcmeta"];
        const entries = await parseEntries(zipFile, loadEntries as ["pack.mcmeta", "pack.png"] | ["pack.mcmeta"]);
        if (!entries["pack.mcmeta"]) {
            throw new Error("Cannot find pack.mcmeta");
        }
        const metadata = await bufferEntry(zipFile, entries["pack.mcmeta"])
            .then((data) => JSON.parse(data.toString("utf-8").trim()).pack);

        let icon = "";
        if (entries["pack.png"]) {
            icon = await bufferEntry(zipFile, entries["pack.png"])
                .then((data) => "data:image/png;base64, " + data.toString("base64"))
                .catch((_) => "");
        }

        return new ResourcePack(fileName, "zip", metadata, icon);
    }

    async function readDirectory(filePath: string, cacheIcon?: boolean) {
        const metaPath = `${filePath}/pack.mcmeta`;
        const iconPath = `${filePath}/pack.png`;

        if (!fs.existsSync(metaPath)) { throw Error("Illegal Resourcepack"); }
        const metadata = await fs.promises.readFile(metaPath);

        const meta = JSON.parse(metadata.toString("utf-8").trim()).pack;
        const icon = cacheIcon ? await fs.promises.readFile(iconPath)
            .then((data) => "data:image/png;base64, " + data.toString("base64"))
            .catch((_) => "") : "";

        return new ResourcePack(filePath, "directory", meta, icon);
    }

    export async function readIcon(resourcePack: ResourcePack) {
        const filePath = resourcePack.path;
        const stat = await fs.promises.stat(filePath);
        if (stat.isDirectory()) {
            const iconPath = `${filePath}/pack.png`;
            const icon = await fs.promises.readFile(iconPath)
                .then((data) => "data:image/png;base64, " + data.toString("base64"))
                .catch((_) => "");
            resourcePack.icon = icon;
            return icon;
        }
        const zip = await open(filePath);
        const { "pack.png": entry } = await parseEntries(zip, ["pack.png"]);
        if (entry) {
            const buf = await bufferEntry(zip, entry);
            const url = "data:image/png;base64, " + buf.toString("base64");
            resourcePack.icon = url;
            return url;
        }
        return "";
    }
    /**
     * Read the resource pack metadata from zip file or directory.
     *
     * If you have already read the data of the zip file, you can pass it as the second parameter. The second parameter will be ignored on reading directory.
     *
     * @param filePath The absolute path of the resource pack file
     * @param buffer The zip file data Buffer you read.
     */
    export async function read(filePath: string, buffer?: Buffer, cacheIcon?: boolean): Promise<ResourcePack> {
        const stat = await fs.promises.stat(filePath);
        if (stat.isDirectory()) { return readDirectory(filePath, cacheIcon); }
        const zip = buffer ? await open(buffer) : await open(filePath);
        return readZip(filePath, zip, cacheIcon);
    }
}

export default ResourcePack;
