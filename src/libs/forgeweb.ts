import * as parser from "fast-html-parser";
import Forge from "./forge";
import { getIfUpdate, UpdatedObject } from "./utils/network";

export namespace ForgeWebPage {

    export interface Download {
        md5: string;
        sha1: string;
        path: string;
    }

    function parseWebPage(content: string): ForgeWebPage {
        const dom = parser.parse(content);
        const selected = dom.querySelector(".elem-active");
        const mcversion = selected.text;
        return {
            timestamp: "",
            mcversion,
            versions: dom.querySelector(".download-list").querySelector("tbody").querySelectorAll("tr")
                .map((e: any) => {
                    const links = e.querySelector(".download-links").childNodes
                        .filter((elem: any) => elem.tagName === "li")
                        .map((elem: any) => {
                            const tt = elem.querySelector(".info-tooltip");
                            const url = tt.querySelector("a") || elem.querySelector("a");
                            return {
                                md5: tt.childNodes[2].text.trim(),
                                sha1: tt.childNodes[6].text.trim(),
                                path: url.attributes.href,
                            };
                        });
                    const downloadVersionElem = e.querySelector(".download-version");
                    let version;
                    let type: ForgeWebPage.Version["type"] = "common";
                    const icon = downloadVersionElem.querySelector("i");
                    if (icon) {
                        if (icon.classNames.indexOf("promo-recommended") !== -1) {
                            type = "recommended";
                        } else if (icon.classNames.indexOf("promo-latest") !== -1) {
                            type = "latest";
                        } else if (icon.classNames.indexOf("fa-bug") !== -1) {
                            type = "buggy";
                        }
                        version = downloadVersionElem.firstChild.text.trim();
                    } else {
                        version = downloadVersionElem.text.trim();
                    }
                    return {
                        version,
                        "date": e.querySelector(".download-time").text.trim(),
                        "changelog": links[0],
                        "installer": links[1],
                        "installer-win": links[2],
                        "mdk": links[3],
                        "universal": links[4],
                        "mcversion": mcversion,
                        type,
                    };
                }),
        };
    }

    /**
     * Query the webpage content from files.minecraftforge.net.
     *
     * You can put the last query result to the fallback option. It will check if your old result is up-to-date.
     * It will request a new page only when the fallback option is outdated.
     *
     * @param option The option can control querying minecraft version, and page caching.
     */
    export async function getWebPage(option: {
        mcversion?: string,
        fallback?: ForgeWebPage,
    } = {}): Promise<ForgeWebPage> {
        const mcversion = option.mcversion || "";
        const url = mcversion === "" ? `http://files.minecraftforge.net/maven/net/minecraftforge/forge/index.html` : `http://files.minecraftforge.net/maven/net/minecraftforge/forge/index_${mcversion}.html`;
        const page = await getIfUpdate(url, parseWebPage, option.fallback);
        return page;
    }

    export interface Version {
        mcversion: string;
        version: string;
        date: string;
        changelog: ForgeWebPage.Download;
        installer: ForgeWebPage.Download;
        mdk: ForgeWebPage.Download;
        universal: ForgeWebPage.Download;
        type: "buggy" | "recommended" | "common" | "latest";
    }

    export namespace Version {
        export function to(webPageVersion: ForgeWebPage.Version): Forge.VersionMeta {
            const checksum = {
                md5: webPageVersion.universal.md5,
                sha1: webPageVersion.universal.sha1,
            };
            return {
                checksum,
                universal: webPageVersion.universal.path,
                installer: webPageVersion.installer.path,
                mcversion: webPageVersion.mcversion,
                version: webPageVersion.version,
            };
        }
    }
}

declare module "./forge" {
    export namespace VersionMeta {
        export function from(webPageVersion: ForgeWebPage.Version): Forge.VersionMeta;
    }
}

(Forge as any).VersionMeta = (Forge as any).VersionMeta || {};
(Forge as any).VersionMeta.from = ForgeWebPage.Version.to;

export interface ForgeWebPage extends UpdatedObject {
    versions: ForgeWebPage.Version[];
    mcversion: string;
}



