# Launcher Core Module

[![npm version](https://img.shields.io/npm/v/@xmcl/core.svg)](https://www.npmjs.com/package/@xmcl/core)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Build Status](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)

Provide the core function to parse Minecraft version and launch.

## Usage

### Parse Version JSON 

Parse minecraft version as a resolved version, which is used for launching process. You can also read version info from it if you want.

```ts
    import { Versoin } from "@xmcl/core";
    const minecraftLocation: string;
    const minecraftVersionId: string;

    const resolvedVersion: ResolvedVersion = await Version.parse(minecraftLocation, minecraftVersionId);
```

### Launch

Launch minecraft from a version:

```ts
    import { launch } from "@xmcl/core"
    const version: string; // full version id, like 1.13, or your forge version like, 1.13-forge-<someForgeVersion>
    const javaPath: string; // java executable path
    const gamePath: string; // .minecraft path
    const proc: Promise<ChildProcess> = launch({ gamePath, javaPath, version });
```

Detach from the parent process. So your launcher's exit/crash won't affact the Minecraft running.

```ts
    const proc: Promise<ChildProcess> = Launcher.launch({ gamePath, javaPath, version, extraExecOption: { detached: true } });
```
