import { ResourcePackMetaData } from "@xmcl/common";
import Unzip from "@xmcl/unzip";
import { vfs } from "../util";
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
    async function readZip(fileName: string, zipFile: Unzip.LazyZipFile, cacheIcon?: boolean) {
        const loadEntries = cacheIcon ? ["pack.mcmeta", "pack.png"] : ["pack.mcmeta"];
        const entries = await zipFile.filterEntries(loadEntries as ["pack.mcmeta", "pack.png"] | ["pack.mcmeta"]);
        const metadataEntry = entries.find((e) => e.fileName === "pack.mcmeta");
        if (!metadataEntry) { throw new Error("Illegal Resourcepack: Cannot find pack.mcmeta!"); }

        const metadata = await zipFile.readEntry(metadataEntry).then((data) => JSON.parse(data.toString("utf-8").trim()).pack);

        let icon = "";
        const iconEntry = entries.find((e) => e.fileName === "pack.png");
        if (iconEntry) {
            icon = await zipFile.readEntry(iconEntry)
                .then((data) => "data:image/png;base64, " + data.toString("base64"))
                .catch((_) => "");
        }

        return new ResourcePack(fileName, "zip", metadata, icon);
    }

    async function readDirectory(filePath: string, cacheIcon?: boolean) {
        const metaPath = `${filePath}/pack.mcmeta`;
        const iconPath = `${filePath}/pack.png`;

        if (await vfs.missing(metaPath)) { throw Error("Illegal Resourcepack: Cannot find pack.mcmeta!"); }
        const metadata = await vfs.readFile(metaPath);

        const meta = JSON.parse(metadata.toString("utf-8").trim()).pack;
        const icon = cacheIcon ? await vfs.readFile(iconPath)
            .then((data) => "data:image/png;base64, " + data.toString("base64"))
            .catch((_) => "") : "";

        return new ResourcePack(filePath, "directory", meta, icon);
    }

    export async function readIcon(resourcePack: ResourcePack) {
        const filePath = resourcePack.path;
        const stat = await vfs.stat(filePath);
        if (stat.isDirectory()) {
            const iconPath = `${filePath}/pack.png`;
            const icon = await vfs.readFile(iconPath)
                .then((data) => "data:image/png;base64, " + data.toString("base64"))
                .catch((_) => "");
            resourcePack.icon = icon;
            return icon;
        }
        const zip = await Unzip.open(filePath, { lazyEntries: true });
        const [entry] = await zip.filterEntries(["pack.png"]);
        if (entry) {
            const buf = await zip.readEntry(entry);
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
        const stat = await vfs.stat(filePath);
        if (stat.isDirectory()) { return readDirectory(filePath, cacheIcon); }
        const zip = buffer ? await Unzip.open(buffer, { lazyEntries: true }) : await Unzip.open(filePath, { lazyEntries: true });
        return readZip(filePath, zip, cacheIcon);
    }
}

export default ResourcePack;
