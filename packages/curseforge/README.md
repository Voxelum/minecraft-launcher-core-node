# Curseforge API

[![npm version](https://img.shields.io/npm/v/@xmcl/curseforge.svg)](https://www.npmjs.com/package/@xmcl/curseforge)
[![Downloads](https://img.shields.io/npm/dm/@xmcl/curseforge.svg)](https://npmjs.com/@xmcl/curseforge)
[![Install size](https://packagephobia.now.sh/badge?p=@xmcl/curseforge)](https://packagephobia.now.sh/result?p=@xmcl/curseforge)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Build Status](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Build/badge.svg)](https://github.com/Voxelum/minecraft-launcher-core-node/actions?query=workflow%3ABuild)

Provide the curseforge (twitch) API in https://twitchappapi.docs.apiary.io/

## Usage

### Find Curseforge Mods by search keyword

You can use keyword to search

```ts
    import { searchAddons, SearchOptions } from '@xmcl/curseforge'
    const searchOptions: SearchOptions = {
        categoryId: 6, // 6 is mod,
    };
    const addons: AddonInfo[] = await searchAddons(searchOptions);
```
