# Mojang Module

[![npm version](https://img.shields.io/npm/v/@xmcl/mojang.svg)](https://www.npmjs.com/package/mojang)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Build Status](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)

This is a sub-module belong to [minecraft-launcher-core](https://www.npmjs.com/package/@xmcl/minecraft-launcher-core) module. You can still use this individually.

### Mojang Account Info

```ts
    import { MojangService } from "@xmcl/mojang";
    const accessToken: string;
    const info: Promise<MojangAccount> = MojangService.getAccountInfo(accessToken);
```

Get personal info from mojang.

```ts
    import { MojangService } from "@xmcl/mojang";
    const accessToken: string;
    const validIp: boolean = await MojangService.checkLocation(accessToken);

    if (!validIp) {
        const challenges: MojangChallenge[] = await MojangService.getChallenges(accessToken);
        // after your answer the challenges
        const responses: MojangChallengeResponse[];
        await MojangService.responseChallenges(accessToken, responses);
    }
```

Validate if user have a validated IP address, and get & answer challenges to validate player's identity.
