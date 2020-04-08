# Resource Manager

[![npm version](https://img.shields.io/npm/v/@xmcl/resource-manager.svg)](https://www.npmjs.com/package/@xmcl/resource-manager)
[![Downloads](https://img.shields.io/npm/dm/@xmcl/resource-manager.svg)](https://npmjs.com/@xmcl/resource-manager)
[![Install size](https://packagephobia.now.sh/badge?p=@xmcl/resource-manager)](https://packagephobia.now.sh/result?p=@xmcl/resource-manager)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Build Status](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Build/badge.svg)](https://github.com/Voxelum/minecraft-launcher-core-node/actions?query=workflow%3ABuild)

## Usage

### Load Minecraft Resource

You can use this module in nodejs/electron:

```ts
import { openFileSystem } from "@xmcl/system"; 
import { ResourcePack, Resource } from "@xmcl/resourcepack"; 
import { ResourceManager, ResourceLocation } from "@xmcl/resource-manager"
const manager: ResourceManager = new ResourceManager();

// add a resource source which load resource from file
await manager.addResourcePack(new ResourcePack(await openFileSystem('/base/path')));

// load grass block model resource; it will load file at `assets/${location.domain}/${location.path}`
// which is '/base/path/assets/minecraft/models/block/grass.json'
// same logic with minecraft
const resource = await manager.get(ResourceLocation.ofModelPath('block/grass'));

const content: string = await resource.read("utf-8"); // your resource content
const modelJSON = JSON.parse(content);
```

The resource manager will do the simplest cache for same resource location.

You can clear the cache by:

```ts
manager.clearCache();
```

### Load Minecraft Block Model

You can use this to load Minecraft block model and texture just like Minecraft.

```ts
    import { ResourcePack, Resource, BlockModel } from "@xmcl/resourcepack"; 
    import { ResourceManager, ModelLoader } from "@xmcl/resource-manager";
    import { openFileSystem } from "@xmcl/system";

    const man = new ResourceManager();
    const resourcePack = new ResourcePack(await openFileSystem("/path/to/resource-pack.zip"));
    // setup resource pack
    man.addResourcePack(resourcePack);

    const loader = new ModelLoader(man);

    await loader.loadModel("block/grass"); // load grass model
    await loader.loadModel("block/stone"); // load stone model
    // ... load whatever you want model

    const textures: Record<string, Resource> = loader.textures;
    const models: Record<string, BlockModel.Resolved> = loader.models;

    const resolvedModel: BlockModel.Resolved = models["block/grass"];
```


