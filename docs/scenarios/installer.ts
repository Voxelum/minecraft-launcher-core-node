import { install, MinecraftVersionList, getVersionList, MinecraftVersion, installTask } from '@xmcl/installer';

let versionMetaList: MinecraftVersionList;
let minecraftLocation: string; "my/path/to/minecraft"

async function updateVersionList() {
    versionMetaList = await getVersionList({ original: versionMetaList });
}

async function installVersion(versionMeta: MinecraftVersion) {
    await install(versionMeta, minecraftLocation);
}

async function installButMonitorProgress(versionMeta: MinecraftVersion) {
    const task = installTask(versionMeta, minecraftLocation);
    const result = await task.startAndWait({
        onUpdate(event, chunkSize) {
            console.log(`Downloaded url: ${event.from} to file ${event.to}. Progress: ${event.progress / event.total}. Transferr: ${chunkSize} bytes.`);
        }
    });
    return result;
}
