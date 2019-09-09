# Version Module

[![npm version](https://img.shields.io/npm/v/@xmcl/version.svg)](https://www.npmjs.com/package/version)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Build Status](https://travis-ci.org/voxelum/minecraft-launcher-core-node.svg)](https://travis-ci.org/voxelum/minecraft-launcher-core-node)

This is a sub-module belong to [minecraft-launcher-core](https://www.npmjs.com/package/@xmcl/minecraft-launcher-core) module. You can still use this individually.

### Minecraft Version Parsing

```ts
    import { Versoin } from "@xmcl/version";
    const minecraftLocation: string;
    const minecraftVersionId: string;

    const resolvedVersion: ResolvedVersion = await Version.parse(minecraftLocation, minecraftVersionId);
```

Parse minecraft version as a resolved version, which is used for launching process. You can also read version info from it if you want.

```ts
    import { Versoin, VersionDiagnosis } from "@xmcl/version";
    const minecraftLocation: string;
    const minecraftVersionId: string;

    const report: VersionDiagnosis = await Version.diagnose(minecraftLocation, minecraftVersionId);
```

Get the report of the version. It can check if version missing assets/libraries.
