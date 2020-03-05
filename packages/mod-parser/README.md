# Mod Parser

[![npm version](https://img.shields.io/npm/v/@xmcl/mod-parser.svg)](https://www.npmjs.com/package/@xmcl/mod-parser)
[![Downloads](https://img.shields.io/npm/dm/@xmcl/mod-parser.svg)](https://npmjs.com/@xmcl/mod-parser)
[![Install size](https://packagephobia.now.sh/badge?p=@xmcl/mod-parser)](https://packagephobia.now.sh/result?p=@xmcl/mod-parser)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Build Status](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Build/badge.svg)](https://github.com/Voxelum/minecraft-launcher-core-node/actions?query=workflow%3ABuild)

## Usage

### Parse Fabric Mod Metadata

```ts
    import { Fabric } from "@xmcl/mods";
    const modJarBinary = fs.readFileSync("your-fabric.jar");
    const metadata: Fabric.ModMetadata = await Fabric.readModMetaData(modJarBinary);

    // or directly read from path
    const sameMetadata: Fabric.ModMetadata = await Fabric.readModMetaData("your-fabric.jar");
```

### Parse Forge Mod/Config

Read the forge mod metadata, including `@Mod` annotation, mcmods.info, and toml metadata.

```ts
    import { Forge } from "@xmcl/mods";
    const forgeModJarBuff: Buffer;
    const metadata: Forge.MetaData[] = Forge.readModMetaData(forgeModJarBuff);

    const modid = metadata[0].modid; // get modid of first mods
```

Read the forge mod config file (.cfg)

```ts
    const modConfigString: string;
    const config: Forge.Config = Forge.Config.parse(modConfigString);
    const serializedBack: string = Forge.Config.stringify(config);
```

### Parse Liteloader Mod

Read .litemod metadata:

```ts
    import { LiteLoader } from "@xmcl/mods";
    const metadata: LiteLoader.MetaData = await LiteLoader.readModMetaData(`${mock}/mods/sample-mod.litemod`);
```
