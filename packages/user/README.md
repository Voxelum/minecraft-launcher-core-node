# Auth Module

[![npm version](https://img.shields.io/npm/v/@xmcl/user.svg)](https://www.npmjs.com/package/@xmcl/user)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Build Status](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)

This is a sub-module belong to [minecraft-launcher-core](https://www.npmjs.com/package/@xmcl/minecraft-launcher-core) module. You can still use this individually.

## Usage

### User Login (Official/Offline)

You can do official or offline login:

```ts
    import { login, offline, Authentication } from "@xmcl/user";
    const username: string;
    const password: string;
    const authFromMojang: Authentication = await login({ username, password }); // official login
    const authOffline: Authentication = offline(username); // offline login

    const accessToken: string = authFromMojang.accessToken;
```

Validate/Refresh/Invalidate access token. This is majorly used for reduce user login and login again.

```ts
    import { validate, refresh } from "@xmcl/user";
    const accessToken: string;
    const clientToken: string;
    const valid: boolean = await validate({ accessToken, clientToken });
    if (!valid) {
        const newAuth: Auth = await refresh({ accessToken, clientToken });
    }
    await invalidate({ accessToken, clientToken });
```

Use third party Yggdrasil API to auth:

```ts
    import { login, YggdrasilAuthAPI } from "@xmcl/user";
    const username: string;
    const password: string;
    const yourAPI: YggdrasilAuthAPI;
    const authFromMojang = await login({ username, password }, yourAPI); // official login
```

### User Skin Operation

Or lookup profile by name:

```ts
    import { lookupByName, GameProfile } from "@xmcl/user";

    const username: string;
    const gameProfile: GameProfile = await lookupByName(username);
```

Fetch the user game profile by uuid. (This could also be used for get skin)


```ts
    import { lookup, GameProfile } from "@xmcl/user";
    const userUUID: string;
    const gameProfile: GameProfile = await lookup(userUUID);
```

Get player skin:

```ts
    import { lookup, GameProfile, getTextures } from "@xmcl/user";
    const userUUID: string;
    const gameProfile: GameProfile = await lookup(userUUID);
    const infos: GameProfile.TexturesInfo | undefined = getTextures(gameProfile);
    const skin: GameProfile.Texture = infos!.textures.SKIN!;
    const skinUrl: string = skin.url; // use url to display skin
    const isSlim: boolean = GameProfile.Texture.isSlim(skin); // determine if model is slim or not
```

Set player skin from URL:

```ts
    import { lookup, GameProfile, setTexture } from "@xmcl/user";
    const userUUID: string;
    const userAccessToken: string;
    const userNewSkinUrl: string;
    await setTexture({
        accessToken: userAccessToken,
        uuid: userUUID,
        type: "skin",
        texture: {
            url: userNewSkinUrl,
            metadata: { model: "slim" }, 
            // suppose this model is a slim model
            // if this model is a normal model, this should be steve
        }
    });
```

Set player skin from binary (read file file):

```ts
    import { lookup, GameProfile, setTexture } from "@xmcl/user";
    const userUUID: string;
    const userAccessToken: string;
    const userNewSkinData: Uint8Array; 
    // in nodejs this can be a `Buffer` from file
    // in browser this can come from a `Blob`
    await setTexture({
        accessToken: userAccessToken,
        uuid: userUUID,
        type: "skin",
        texture: {
            data: userNewSkinData,
            metadata: { model: "steve" }, 
        }
    });
```

Delete player skin (reset to default):

```ts
    import { lookup, GameProfile, setTexture } from "@xmcl/user";
    const userUUID: string;
    const userAccessToken: string;
    await setTexture({
        accessToken: userAccessToken,
        uuid: userUUID,
        type: "skin",
    });
```

### Mojang Security API

Validate if user have a validated IP address, and get & answer challenges to validate player's identity.

```ts
    import { checkLocation, getChallenges, responseChallenges } from "@xmcl/user";
    const accessToken: string;
    const validIp: boolean = await checkLocation(accessToken);

    if (!validIp) {
        const challenges: MojangChallenge[] = await getChallenges(accessToken);
        // after your answer the challenges
        const responses: MojangChallengeResponse[];
        await responseChallenges(accessToken, responses);
    }
```

