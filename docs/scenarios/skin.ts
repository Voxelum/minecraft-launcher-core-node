/// suppose you are on electron MAIN process ///

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
    // you implement your way to send json object to the renderer process
}

/// suppose you are on electron RENDERER process ///

import { PlayerModel } from '@xmcl/model';

let model: PlayerModel = new PlayerModel();
let object3D = model.playerObject3d; // THREEjs object 3d
// add this object 3d to your three js scene to display

function onPlayerSkinUrlRecieve(url: string, isSlim: boolean) {
    model.setSkin(url, isSlim);
}
