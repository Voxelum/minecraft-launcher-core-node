# Launch Module

[![npm version](https://img.shields.io/npm/v/@xmcl/launch.svg)](https://www.npmjs.com/package/@xmcl/launch)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Build Status](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)

This is a sub-module belong to [minecraft-launcher-core](https://www.npmjs.com/package/@xmcl/minecraft-launcher-core) module. You can still use this individually.

### Launch

Launch minecraft from a version:

```ts
    import { Launcher } from "@xmcl/launch"
    const version: string; // full version id, like 1.13, or your forge version like, 1.13-forge-<someForgeVersion>
    const javaPath: string; // java executable path
    const gamePath: string; // .minecraft path
    const proc: Promise<ChildProcess> = Launcher.launch({ gamePath, javaPath, version });
```

Detach from the parent process. So your launcher's exit/crash won't affact the Minecraft running.

```ts
    const proc: Promise<ChildProcess> = Launcher.launch({ gamePath, javaPath, version, extraExecOption: { detached: true } });
```

