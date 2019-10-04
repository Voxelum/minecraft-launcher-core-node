# Launch Module

[![npm version](https://img.shields.io/npm/v/@xmcl/launch.svg)](https://www.npmjs.com/package/launch)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Build Status](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)

This is a sub-module belong to [minecraft-launcher-core](https://www.npmjs.com/package/@xmcl/minecraft-launcher-core) module. You can still use this individually.

### Launch

```ts
    import { Launcher } from "@xmcl/launch"
    const version: string;
    const javaPath: string;
    const gamePath: string;
    const proc: Promise<ChildProcess> = Launcher.launch({ gamePath, javaPath, version });
```

Launch minecraft from a version.

```ts
    const proc: Promise<ChildProcess> = Launcher.launch({ gamePath, javaPath, version, extraExecOption: { detached: true } });
```

Detach from the parent process. So your launcher's exit/crash won't affact the Minecraft running.
