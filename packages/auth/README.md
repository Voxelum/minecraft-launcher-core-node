# Auth Module

[![npm version](https://img.shields.io/npm/v/@xmcl/auth.svg)](https://www.npmjs.com/package/auth)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Build Status](https://travis-ci.org/voxelum/minecraft-launcher-core-node.svg)](https://travis-ci.org/voxelum/minecraft-launcher-core-node)

This is a sub-module belong to [minecraft-launcher-core](https://www.npmjs.com/package/@xmcl/minecraft-launcher-core) module. You can still use this individually.

### User Login & Auth (Official/Offline) 

```ts
    import { Auth } from "@xmcl/auth";
    const username: string;
    const password: string;
    const authFromMojang: Auth = await Auth.Yggdrasil.login({ username, password }); // official login
    const authOffline: Auth = Auth.offline(username); // offline login

    const accessToken: string = authFromMojang.accessToken;
```

Online/offline login

```ts
    import { Auth } from "@xmcl/auth";
    const accessToken: string;
    const clientToken: string;
    const valid: boolean = await Auth.Yggdrasil.validate({ accessToken, clientToken });
    const newAuth: Auth = await Auth.Yggdrasil.refresh({ accessToken, clientToken });
    await Auth.Yggdrasil.invalidate({ accessToken, clientToken });
```

Validate/Refresh/Invalidate access token.


```ts
    import { Auth } from "@xmcl/auth";
    const username: string;
    const password: string;
    const yourAPI: Auth.Yggdrasil.API;
    const authFromMojang: Auth = await Auth.Yggdrasil.login({ username, password }, yourAPI); // official login
```

Use third party Yggdrasil API to auth.
