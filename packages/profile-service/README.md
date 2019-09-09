# Profile-service Module

[![npm version](https://img.shields.io/npm/v/@xmcl/profile-service.svg)](https://www.npmjs.com/package/profile-service)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Build Status](https://travis-ci.org/voxelum/minecraft-launcher-core-node.svg)](https://travis-ci.org/voxelum/minecraft-launcher-core-node)

This is a sub-module belong to [minecraft-launcher-core](https://www.npmjs.com/package/@xmcl/minecraft-launcher-core) module. You can still use this individually.

### Game Profile 

```ts
    import { ProfileService, GameProfile } from "@xmcl/profile-service"
    const userUUID: string;
    const gameProfilePromise: GameProfile = await ProfileService.fetch(userUUID);
```

Or lookup profile by name.

```ts
    const username: string;
    const gameProfilePromise: Promise<GameProfile> = ProfileService.lookup(username);
```

Fetch the user game profile by uuid. This could also be used for get skin.

```ts
    const gameProfile: GameProfile;
    const texturesPromise: Promise<GameProfile.Textures> = ProfileService.fetchProfileTexture(gameProfile);
```
