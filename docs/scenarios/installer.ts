import { Installer } from '@xmcl/installer';
import { Task } from "@xmcl/task";

let versionMetaList: Installer.VersionList;
let minecraftLocation: string; "my/path/to/minecraft"

async function updateVersionList() {
    versionMetaList = await Installer.getVersionList({ fallback: versionMetaList });
}

async function installVersion(versionMeta: Installer.Version) {
    await Installer.install("client", versionMeta, minecraftLocation);
}

async function installButMonitorProgress(versionMeta: Installer.Version) {
    const task = Installer.installTask("client", versionMeta, minecraftLocation);
    const handle = Task.execute(task);
    handle.on("execute", (taskState, parent) => {
        console.log(`${taskState.name} executed!`);
    });
    handle.on("update", ({ progress, total, message }, state) => {
        // path is the full name in format of `thisTask.path = parentTask.path.thisTask.name`
        console.log(`${state.path} ${progress} ${total}, ${message}`);
        // you might want to update this info to your UI !
    });
    const result = await handle.wait();
    return result;
}


