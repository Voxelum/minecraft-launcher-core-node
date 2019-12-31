# Mods

[![npm version](https://img.shields.io/npm/v/@xmcl/mods.svg)](https://www.npmjs.com/package/@xmcl/mods)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Build Status](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)

## Usage

### Parse Fabric Mod Metadata

```ts
    import { Fabric } from "@xmcl/mods";
    const modJarBinary = fs.readFileSync("your-fabric.jar");
    const metadata: Fabric.ModMetadata = await Fabric.readModMetaData(modJarBinary);

    // or directly read from path
    const sameMetadata: Fabric.ModMetadata = await Fabric.readModMetaData("your-fabric.jar");
```

### Forge Mod/Config Parsing

Read the forge mod metadata, including `@Mod` annotation and mcmods.info json data.

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

### Liteloader Mod Parsing

Read .litemod metadata:

```ts
    import { LiteLoader } from "@xmcl/mods";
    const metadata: LiteLoader.MetaData = await LiteLoader.meta(`${mock}/mods/sample-mod.litemod`);
```