import { UpdatedObject, getIfUpdate } from "@xmcl/net";
import * as parser from "fast-html-parser";
import { ForgeInstaller } from "./index";

export namespace ForgeWebPage {

    export interface Download {
        md5: string;
        sha1: string;
        path: string;
    }

    /**
     * Parse the html string of forge webpage
     */
    export function parse(content: string): ForgeWebPage {
        const dom = parser.parse(content);
        const selected = dom.querySelector(".elem-active");
        const mcversion = selected.text;
        return {
            timestamp: "",
            mcversion,
            versions: dom.querySelector(".download-list").querySelector("tbody").querySelectorAll("tr")
                .map((e) => {
                    const links = e.querySelector(".download-links").childNodes
                        .filter((elem) => elem.tagName === "li")
                        .map((elem) => {
                            elem = elem.removeWhitespace();
                            const tt = elem.querySelector(".info-tooltip");
                            const url = tt.querySelector("a") || elem.querySelector("a");
                            return {
                                name: url.childNodes[1].rawText.trim(),
                                md5: tt.childNodes[1].text.trim(),
                                sha1: tt.lastChild.text.trim(),
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
                    const installer = links.find((l) => l.name === "Installer");
                    const universal = links.find((l) => l.name === "Universal");

                    if (installer === undefined || universal === undefined) {
                        throw new Error(`Cannot parse forge web since it missing installer and universal jar info.`);
                    }
                    const result = {
                        version,
                        "date": e.querySelector(".download-time").text.trim(),
                        "changelog": links[0],
                        installer,
                        "installer-win": links.find((l) => l.name === "Installer-win"),
                        "mdk": links.find((l) => l.name === "Mdk"),
                        universal,
                        "mcversion": mcversion,
                        type,
                    };

                    return result;
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
    export function getWebPage(): Promise<ForgeWebPage | undefined>;
    /**
     * Query the webpage content from files.minecraftforge.net.
     *
     * You can put the last query result to the fallback option. It will check if your old result is up-to-date.
     * It will request a new page only when the fallback option is outdated.
     *
     * @param option The option can control querying minecraft version, and page caching.
     */
    export function getWebPage(option?: {
        mcversion?: string;
    }): Promise<ForgeWebPage | undefined>;
    /**
     * Query the webpage content from files.minecraftforge.net.
     *
     * You can put the last query result to the fallback option. It will check if your old result is up-to-date.
     * It will request a new page only when the fallback option is outdated.
     *
     * @param option The option can control querying minecraft version, and page caching.
     */
    export function getWebPage(option?: {
        mcversion?: string;
        fallback?: ForgeWebPage;
    }): Promise<ForgeWebPage | undefined>;
    /**
     * Query the webpage content from files.minecraftforge.net.
     *
     * You can put the last query result to the fallback option. It will check if your old result is up-to-date.
     * It will request a new page only when the fallback option is outdated.
     *
     * @param option The option can control querying minecraft version, and page caching.
     */
    export function getWebPage(option?: {
        mcversion?: string;
        fallback: ForgeWebPage;
    }): Promise<ForgeWebPage>;

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
    } = {}): Promise<ForgeWebPage | undefined> {
        const mcversion = option.mcversion || "";
        const url = mcversion === "" ? `http://files.minecraftforge.net/maven/net/minecraftforge/forge/index.html` : `http://files.minecraftforge.net/maven/net/minecraftforge/forge/index_${mcversion}.html`;
        const page = await getIfUpdate(url, parse, option.fallback);
        return page;
    }

    /**
     * A richer version info than forge installer required
     */
    export interface Version extends ForgeInstaller.VersionMeta {
        /**
         * The minecraft version
         */
        mcversion: string;
        /**
         * The version of forge
         */
        version: string;
        date: string;
        /**
         * The changelog info
         */
        changelog: ForgeWebPage.Download;
        installer: ForgeWebPage.Download;
        mdk?: ForgeWebPage.Download;
        universal: ForgeWebPage.Download;
        /**
         * The type of the forge release. The `common` means the normal release.
         */
        type: "buggy" | "recommended" | "common" | "latest";
    }

    export namespace Version {
        export function to(webPageVersion: ForgeWebPage.Version): ForgeInstaller.VersionMeta {
            return {
                universal: webPageVersion.universal,
                installer: webPageVersion.installer,
                mcversion: webPageVersion.mcversion,
                version: webPageVersion.version,
            };
        }
    }
}

declare module "./index" {
    export namespace VersionMeta {
        export function from(webPageVersion: ForgeWebPage.Version): ForgeInstaller.VersionMeta;
    }
}

(ForgeInstaller as any).VersionMeta = (ForgeInstaller as any).VersionMeta || {};
(ForgeInstaller as any).VersionMeta.from = ForgeWebPage.Version.to;

export interface ForgeWebPage extends UpdatedObject {
    versions: ForgeWebPage.Version[];
    mcversion: string;
}



