# Resource Manager

[![npm version](https://img.shields.io/npm/v/@xmcl/resource-manager.svg)](https://www.npmjs.com/package/@xmcl/resource-manager)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Build Status](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)

## Usage

### Load Minecraft Resource

You can use this module in nodejs/electron:

```ts
import { ResourceManager, ResourceLocation } from "@xmcl/resource-manager"
const manager: ResourceManager<Buffer> = new ResourceManager();

// add a resource source which load resource from file
await manager.addResourceSource(new MyFileSystemResourceSource('/base/path'));

// load grass block model resource; it will load file at `assets/${location.domain}/${location.path}`
// which is '/base/path/assets/minecraft/models/block/grass.json'
// same logic with minecraft
const resource = await manager.load(ResourceLocation.ofModelPath('block/grass'));

const url: string = resource.url; // your resource url which is file:///base/path/assets/minecraft/models/block/grass.json
const content: Buffer = resource.content; // your resource content
const modelJSON = JSON.parse(content.toString());
```

You can also use this module in browser:

```ts
import { ResourceManager, ResourceLocation } from "@xmcl/resource-manager"
const manager: ResourceManager<string> = new ResourceManager();

// add a resource source which load resource from an remote url
await manager.addResourceSource(new MyRemoteWhateverResourceSource('https://my-domain/xxx'));

// load grass block model resource; it will load file at `assets/${location.domain}/${location.path}`
// which is 'https://my-domain/xxx/assets/minecraft/models/block/grass.json'
// same logic with minecraft
const resource = await manager.load(ResourceLocation.ofModelPath('block/grass'));

const url: string = resource.url; // your resource url which is https://my-domain/xxx/assets/minecraft/models/block/grass.json
const content: string = resource.content; // your resource content string
const modelJSON = JSON.parse(content);
```

Please notice that in the sample above, all the `ResourceSource` should be implemented by yourself.

The resource manager will do the simplest cache for same resource location.

You can clear the cache by:

```ts
manager.clearCache();
```

### Load Minecraft Block Model

You can use this to load Minecraft block model and texture.

```ts
    import { ResourceManager, ModelLoader, TextureRegistry, ModelRegistry } from "@xmcl/resource-manager";
    import { BlockModel } from "@xmcl/system";

    const man = new ResourceManager();
    // setup resource manager
    man.addResourceSource(new YourCustomizedResourceSource());

    const loader = new ModelLoader(man);

    await loader.loadModel("block/grass"); // load grass model
    await loader.loadModel("block/stone"); // load stone model
    // ... load whatever you want model

    const textures: TextureRegistry = loader.textures;
    const models: ModelRegistry = loader.models;

    const resolvedModel: BlockModel.Resolved = models["block/grass"];
```


