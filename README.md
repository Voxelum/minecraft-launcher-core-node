# Minecraft Launcher Core

[![npm](https://img.shields.io/npm/l/@xmcl/core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Build Status](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Build/badge.svg)](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Build/badge.svg)
[![Convensional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://www.conventionalcommits.org)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)

Provide several useful functions to build a Minecraft Launcher.

Most packages are targeting the [Electron](https://electronjs.org) environment. Feel free to report issues related to it.

- [Minecraft Launcher Core](#minecraft-launcher-core)
  - [Installation & Usage](#installation--usage)
    - [Bundle & Treeshaking](#bundle--treeshaking)
    - [CommonJS](#commonjs)
    - [Electron Version](#electron-version)
  - [Getting Start](#getting-start)
  - [Active Packages](#active-packages)
  - [Featured Launcher](#featured-launcher)
  - [Contribute](#contribute)
  - [Credit](#credit)

## Installation & Usage

This repo maintaining multiple mini packages for specific functions.

If you use electron to write a minimum launcher, you can install `@xmcl/core` which only has such functions:

- Parse existed Minecraft version
- Launch the game

If you have bigger ambition on your launcher, you want it be able to download/install Minecraft, then you can have `@xmcl/installer`, which contains the functions of:

- Get the version information of Minecraft/Forge/Liteloader/Fabric
- Install Minecraft/Forge/Liteloader/Fabric to the game folder

If you still not satisfied, as you want even provide the function to parse existed resource pack and mods under game folder, then you will have `@xmcl/mod-parser` and `@xmcl/resourcepack` modules, which contain such functions:

- Parse Forge/Liteloader/Fabric mods metadata
- Parse resource pack metadata

There are more packages for advantage usages, and you can check out the getting started section to navigate.


### Bundle & Treeshaking

The module built with `ES5` module option by typescript. To use treeshake, please make sure your bundle system support esm import/export.

Some bundler like webpack, rollup support treeshake by default. Just make sure you dont do something like `import * as SomeNamespace from ...`, which will bundle the whole package.
(But `import { xxx } from 'xxx'` will still work)


### CommonJS

If you don't have a bundler to transform the package, you can still use it in cjs. The webpack will pick the `"main"` field in package.json which is pointing to the cjs version.

It means you don't need to do anything in extra ideally.

### Electron Version

Recommend to use the latest electron, so you don't need to setup babel with webpack 4.

The dependency `got` use async generator in dist code. Therefore, the electron should at least support `async generator`.
It requires electron have the minimum version of `v3.x` (node version `>= 10`).

## Getting Start

Go [Getting Start](/USAGE.md) page.


## Active Packages

| Name                    | Usage                             | Version                                                                                                                           | Location                                                  | Runtime Envrionment |
| ----------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------- |
| @xmcl/core              | Launch Minecraft                  | [![npm version](https://img.shields.io/npm/v/@xmcl/core.svg)](https://www.npmjs.com/package/@xmcl/core)                           | [packages/core             ](/packages/core)              | Node                |
| @xmcl/installer         | Install Minecraft                 | [![npm version](https://img.shields.io/npm/v/@xmcl/installer.svg)](https://www.npmjs.com/package/@xmcl/installer)                 | [packages/installer        ](/packages/installer)         | Node                |
| @xmcl/user              | User Authentication and skin      | [![npm version](https://img.shields.io/npm/v/@xmcl/user.svg)](https://www.npmjs.com/package/@xmcl/user)                           | [packages/user             ](/packages/user)              | Node/Browser        |
| @xmcl/mod-parser        | Parse forge/liteloader/fabric mod | [![npm version](https://img.shields.io/npm/v/@xmcl/mod-parser.svg)](https://www.npmjs.com/package/@xmcl/mod-parser)               | [packages/mod-parser       ](/packages/mod-parser)        | Node/Browser        |
| @xmcl/forge-site-parser | Parse forge website               | [![npm version](https://img.shields.io/npm/v/@xmcl/forge-site-parser.svg)](https://www.npmjs.com/package/@xmcl/forge-site-parser) | [packages/forge-site-parser](/packages/forge-site-parser) | Node/Browser        |
| @xmcl/client            | Ping Minecraft Server             | [![npm version](https://img.shields.io/npm/v/@xmcl/client.svg)](https://www.npmjs.com/package/@xmcl/client)                       | [packages/client           ](/packages/client)            | Node                |
| @xmcl/model             | Display player/block model        | [![npm version](https://img.shields.io/npm/v/@xmcl/model.svg)](https://www.npmjs.com/package/@xmcl/model)                         | [packages/model            ](/packages/model)             | Browser             |
| @xmcl/gamesetting       | Parse game setting                | [![npm version](https://img.shields.io/npm/v/@xmcl/gamesetting.svg)](https://www.npmjs.com/package/@xmcl/gamesetting)             | [packages/gamesetting      ](/packages/gamesetting)       | Node/Browser        |
| @xmcl/java-installer    | Install Java from Mojang          | [![npm version](https://img.shields.io/npm/v/@xmcl/java-installer.svg)](https://www.npmjs.com/package/@xmcl/java-installer)       | [packages/java-installer   ](/packages/java-installer)    | Node                |
| @xmcl/nbt               | Parse NBT                         | [![npm version](https://img.shields.io/npm/v/@xmcl/nbt.svg)](https://www.npmjs.com/package/@xmcl/nbt)                             | [packages/nbt              ](/packages/nbt)               | Node/Browser        |
| @xmcl/text-component    | Parse and render Minecraft Text   | [![npm version](https://img.shields.io/npm/v/@xmcl/text-component.svg)](https://www.npmjs.com/package/@xmcl/text-component   )    | [packages/text-component   ](/packages/text-component)    | Node/Browser        |
| @xmcl/resource-manager  | Load model from resource pack     | [![npm version](https://img.shields.io/npm/v/@xmcl/resource-manager.svg)](https://www.npmjs.com/package/@xmcl/resource-manager )  | [packages/resource-manager ](/packages/resource-manager)  | Node/Browser        |
| @xmcl/world             | Load save metadata                | [![npm version](https://img.shields.io/npm/v/@xmcl/world.svg)](https://www.npmjs.com/package/@xmcl/world)                         | [packages/world            ](/packages/world)             | Node/Browser        |
| @xmcl/resourcepack      | Parse resource pack               | [![npm version](https://img.shields.io/npm/v/@xmcl/resourcepack.svg)](https://www.npmjs.com/package/@xmcl/resourcepack)           | [packages/resourcepack     ](/packages/resourcepack)      | Node/Browser        |
| @xmcl/server-info       | Parse servers.dat                 | [![npm version](https://img.shields.io/npm/v/@xmcl/server-info.svg)](https://www.npmjs.com/package/@xmcl/server-info)             | [packages/server-info      ](/packages/server-info)       | Node/Browser        |
| @xmcl/task              | Util package to create task       | [![npm version](https://img.shields.io/npm/v/@xmcl/task.svg)](https://www.npmjs.com/package/@xmcl/task)                           | [packages/task             ](/packages/task)              | Node                |
| @xmcl/system            | A fs middleware for browser/node  | [![npm version](https://img.shields.io/npm/v/@xmcl/system.svg)](https://www.npmjs.com/package/@xmcl/system)                       | [packages/system           ](/packages/system)            | Node/Browser        |
| @xmcl/unzip             | yauzl unzip wrapper               | [![npm version](https://img.shields.io/npm/v/@xmcl/unzip.svg)](https://www.npmjs.com/package/@xmcl/unzip)                         | [packages/unzip            ](/packages/unzip)             | Node                |

## Featured Launcher

- [PureLauncher](https://github.com/Apisium/PureLauncher): An awesome Minecraft Launcher using React to build beautiful UI.

## Contribute

See [Contribute.md](/CONTRIBUTE.md)

## Credit

[Yu Xuanchi](https://github.com/yuxuanchiadm), co-worker, quality control of this project.

[Haowei Wen](https://github.com/yushijinhun), the author of [JMCCC](https://github.com/to2mbn/JMCCC), [Authlib Injector](https://github.com/to2mbn/authlib-injector), and [Indexyz](https://github.com/Indexyz), help me a lot on Minecraft launching, authing.

