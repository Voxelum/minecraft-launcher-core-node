import { MinecraftFolder, MinecraftLocation, Version } from "@xmcl/core";
import { fetchJson, fetchText, getIfUpdate } from "./http/fetch";
import { ensureFile, writeFile } from "./utils";

export const DEFAULT_META_URL = "https://meta.quiltmc.org";


export interface InstallQuiltVersionOptions {
  minecraftVersion: string
  version: string
  minecraft: MinecraftLocation

  remote?: string
}

export async function installQuiltVersion(options: InstallQuiltVersionOptions) {
    const remote = options.remote ?? DEFAULT_META_URL
    const url = `${remote}/v3/versions/loader/${options.minecraftVersion}/${options.version}/profile/json`
    const content: Version = await fetchJson(url)

    const minecraft = MinecraftFolder.from(options.minecraft)
    const versionName = content.id

    const jsonPath = minecraft.getVersionJson(versionName)

    const hashed = content.libraries.find((l) => l.name.startsWith("org.quiltmc:hashed"))
    if (hashed) {
        hashed.name = hashed.name.replace("org.quiltmc:hashed", "net.fabricmc:intermediary")
        if ("url" in hashed) {
            hashed.url = "https://maven.fabricmc.net/"
        }
    }

    await ensureFile(jsonPath)
    await writeFile(jsonPath, JSON.stringify(content))

    return versionName
}

export interface GetQuiltOptions {
  remote?: string

  cache?: {
    timestamp: string
    value: QuiltArtifactVersion[]
  }
}

export interface QuiltArtifactVersion {
  separator: string
  build: number
  /**
   * e.g. "org.quiltmc:quilt-loader:0.16.1",
   */
  maven: string
  version: string
}

export async function getQuiltVersionsList(options?: GetQuiltOptions): Promise<QuiltArtifactVersion[]> {
    const remote = options?.remote ?? DEFAULT_META_URL
    const cache = options?.cache
    const { timestamp, content } = await getIfUpdate(`${remote}/v3/versions/loader`, cache?.timestamp)
    if (content) {
    // new content
        const versions: QuiltArtifactVersion[] = JSON.parse(content)
        if (cache) {
            cache.timestamp = timestamp
            cache.value = versions
        }
        return versions
    } else if (cache?.value) {
    // cached
        return cache.value
    }
    return []
}

