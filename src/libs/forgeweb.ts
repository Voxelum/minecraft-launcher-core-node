import { getIfUpdate, UpdatedObject } from './utils/update'
import Forge, { VersionMeta } from './forge';

export namespace ForgeWebPage {
    const parser = require('fast-html-parser');

    export interface Download {
        md5: string,
        sha1: string,
        path: string
    }

    function parseWebPage(content: string) {
        return {
            versions: parser.parse(content).querySelector('.download-list').querySelector('tbody').querySelectorAll('tr')
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
                })
        };
    }

    export async function getWebPage(mcversion: string = '', oldObject?: UpdatedObject): Promise<ForgeWebPage> {
        const url = mcversion == '' ? `http://files.minecraftforge.net/maven/net/minecraftforge/forge/index.html` : `http://files.minecraftforge.net/maven/net/minecraftforge/forge/index_${mcversion}.html`
        const page = await getIfUpdate(url, parseWebPage, oldObject) as ForgeWebPage;
        page.mcversion = mcversion;
        return page;
    }

    export interface Version {
        mcversion: string,
        version: string,
        date: string,
        changelog: ForgeWebPage.Download,
        installer: ForgeWebPage.Download,
        mdk: ForgeWebPage.Download,
        universal: ForgeWebPage.Download,
        type: 'buggy' | 'recommend' | 'common'
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
                version: webPageVersion.version
            }
        }
    }
}

declare module './forge' {
    export namespace VersionMeta {
        export function from(webPageVersion: ForgeWebPage.Version): Forge.VersionMeta;
    }
}
VersionMeta.from = ForgeWebPage.Version.to;

export interface ForgeWebPage extends UpdatedObject {
    versions: ForgeWebPage.Version,
    mcversion: string,
}



