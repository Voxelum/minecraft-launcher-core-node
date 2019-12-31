# Auth Module

[![npm version](https://img.shields.io/npm/v/@xmcl/user.svg)](https://www.npmjs.com/package/@xmcl/user)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Build Status](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)

This is a sub-module belong to [minecraft-launcher-core](https://www.npmjs.com/package/@xmcl/minecraft-launcher-core) module. You can still use this individually.

## Usage

### User Login & Auth (Official/Offline)

You can do official or offline login:

```ts
    import { Auth } from "@xmcl/user";
    const username: string;
    const password: string;
    const authFromMojang: Auth = await Auth.Yggdrasil.login({ username, password }); // official login
    const authOffline: Auth = Auth.offline(username); // offline login

    const accessToken: string = authFromMojang.accessToken;
```

Validate/Refresh/Invalidate access token. This is majorly used for reduce user login and login again.

```ts
    import { Auth } from "@xmcl/user";
    const accessToken: string;
    const clientToken: string;
    const valid: boolean = await Auth.Yggdrasil.validate({ accessToken, clientToken });
    if (!valid) {
        const newAuth: Auth = await Auth.Yggdrasil.refresh({ accessToken, clientToken });
    }
    await Auth.Yggdrasil.invalidate({ accessToken, clientToken });
```

Use third party Yggdrasil API to auth:

```ts
    import { Auth } from "@xmcl/user";
    const username: string;
    const password: string;
    const yourAPI: Auth.Yggdrasil.API;
    const authFromMojang: Auth = await Auth.Yggdrasil.login({ username, password }, yourAPI); // official login
```

### Game Profile 

Or lookup profile by name:

```ts
    const username: string;
    const gameProfilePromise: Promise<GameProfile> = ProfileService.lookup(username);
```

Fetch the user game profile by uuid. (This could also be used for get skin)


```ts
    import { ProfileService, GameProfile } from "@xmcl/profile-service"
    const userUUID: string;
    const gameProfilePromise: GameProfile = await ProfileService.fetch(userUUID);
```

Get player texture:

```ts
    const gameProfilePromise: GameProfile;
    const texturesPromise: Promise<GameProfile.Textures> = ProfileService.fetchProfileTexture(gameProfilePromise);
```
