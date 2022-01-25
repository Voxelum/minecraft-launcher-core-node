# Modrinth API

[![npm version](https://img.shields.io/npm/v/@xmcl/modrinth.svg)](https://www.npmjs.com/package/@xmcl/modrinth)
[![Downloads](https://img.shields.io/npm/dm/@xmcl/modrinth.svg)](https://npmjs.com/@xmcl/modrinth)
[![Install size](https://packagephobia.now.sh/badge?p=@xmcl/modrinth)](https://packagephobia.now.sh/result?p=@xmcl/modrinth)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Build Status](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Build/badge.svg)](https://github.com/Voxelum/minecraft-launcher-core-node/actions?query=workflow%3ABuild)

Provide the modrinth described in https://github.com/modrinth/labrinth/wiki/API-Documentation

Currently only the read mod related APIs are implemented.

## Usage

### Search Mod in Modrinth

You can use keyword to search

```ts
    import { searchMods } from '@xmcl/modrinth'
    const searchOptions: SearchOptions = {
        categoryId: 6, // 6 is mod,
    };
    const result: SearchModResult = await searchMods(settingString);
    const totalModsCounts = result.total_hits;
    for (const mod of result.hits) {
        console.log(`${mod.mod_id} ${mod.title} ${mod.description}`); // print mod info
    }
```

### Get Mod in Modrinth

You can get mod detail info via mod id, including the download url

```ts
import { getMod, Mod, getModVersion, ModVersionFile, ModVersion } from '@xmcl/modrinth'

const modid: string; // you can get this id from searchMods
const mod: Mod = await getMod(modid) // mod details
const modVersions: string[] = mod.versions;
const oneModVersion: string = modVersions[0];

const modVersion: ModVersion = await getModVersion(oneModVersion);

const files: ModVersionFile[] = modVersion.files;

const { url, name, hashes } = files[0]; // now you can get file name, file hashes and download url of the file
```
