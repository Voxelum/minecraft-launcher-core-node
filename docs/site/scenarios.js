module.exports['common'] = `import { launch } from '@xmcl/core';
import { login, Authentication, offline } from '@xmcl/user';

let authentication: Authentication = offline("offline-user-name");
let gamePath: string = "your game path";
let javaPath: string = "your java path";
let version: string = "1.14.4";

async function userLogin(username: string, password: string) {
    authentication = await login({ username, password });
}

async function gameLaunch() {
    const process = await launch({
        accessToken: authentication.accessToken,
        gamePath,
        javaPath,
        version,
        gameProfile: authentication.selectedProfile,
    });
    process.stdout.on('data', (b) => {
        \/\/ print mc output
        console.log(b.toString());
    });
    process.stderr.on('data', (b) => {
        \/\/ print mc err output
        console.log(b.toString());
    });
}

`;
module.exports['installer'] = `import { install, VersionList, getVersionList, Version, installTask } from '@xmcl/installer';

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
            console.log(\`Downloaded url: \${event.from} to file \${event.to}. Progress: \${event.progress / event.total}. Transferr: \${event.chunkSize} bytes.\`);
        }
    });
    return result;
}
`;
module.exports['lab'] = `\/\/ core packages

import { install } from '@xmcl/installer';
import { launch, Version } from '@xmcl/core';
import { login } from '@xmcl/user';

\/\/ additional packages

import { Forge } from '@xmcl/mod-parser';
import { ResourcePack, ResourceManager } from '@xmcl/resourcepack';
import { parse } from '@xmcl/gamesetting';
import { TextComponent } from '@xmcl/text-component';
import { WorldReader } from '@xmcl/world';
`;
module.exports['skin'] = `\/\// suppose you are on electron MAIN process \/\//

import { login, Authentication, offline, getTextures, lookup, GameProfileWithProperties, GameProfile } from '@xmcl/user';

let authentication: Authentication = offline("offline-user-name");

export async function userLogin(username: string, password: string) {
    authentication = await login({ username, password });
}

async function setupPlayerSkin() {
    const profile: GameProfileWithProperties = await lookup(authentication.selectedProfile.id);
    const textureInf = getTextures(profile);
    const playerSkin = textureInf.textures.SKIN;
    if (playerSkin) {
        sendPlayerSkinUrlToRenderer(playerSkin.url, GameProfile.Texture.isSlim(playerSkin));
    }
}

function sendPlayerSkinUrlToRenderer(url: string, isSlim: boolean) {
    \/\/ you implement your way to send json object to the renderer process
}

\/\// suppose you are on electron RENDERER process \/\//

import { PlayerModel } from '@xmcl/model';

let model: PlayerModel = new PlayerModel();
let object3D = model.playerObject3d; \/\/ THREEjs object 3d
\/\/ add this object 3d to your three js scene to display

function onPlayerSkinUrlRecieve(url: string, isSlim: boolean) {
    model.setSkin(url, isSlim);
}
`;