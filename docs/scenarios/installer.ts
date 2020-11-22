import { install, VersionList, getVersionList, Version, installTask } from '@xmcl/installer';

let versionMetaList: VersionList;
let minecraftLocation: string; "my/path/to/minecraft"

async function updateVersionList() {
    versionMetaList = await getVersionList({ original: versionMetaList });
}

async function installVersion(versionMeta: Version) {
    await install(versionMeta, minecraftLocation);
}

async function installButMonitorProgress(versionMeta: Version) {
    const task = installTask(versionMeta, minecraftLocation);
    const result = await task.startAndWait((event) => {
        if (event.type === "update") {
            console.log(`Downloaded url: ${event.from} to file ${event.to}. Progress: ${event.progress / event.total}. Transferr: ${event.chunkSize} bytes.`);
        }
    });
    return result;
}
