
## Contribute

Feel free to contribute to the project. You can fork the project and make PR to here just like any other github project.

### Setup Dev Workspace

Use git to clone the project `git clone https://github.com/Voxelum/minecraft-launcher-core-node`.

After you cloned the project, you can just install it like normal node project by `npm install` in your repo folder. If there are somethings missing, you can try to run `npm run update` or `npx lerna bootstrap`.

### How to Dev

The code are splited into seperated projects, which layed in under `packages` folder. Most of them are really simple (only one `index.ts` file or few files).

The simplest way to run the code is write a test and then run it.

And, the simplest way to run a test is `npx jest packages/<the-package>/<the-test-file.test.ts>`.

Also you can use the command `npm run dev`.

For example, you want to add a functions to parse minecraft chunk data, you can add some code in `packages/world/index.ts`. You might also want to add some test related to your new features, just add somthing in `packages/world/test.ts`. 

During this process, you can first run `npm run dev world`, and it will start to auto compile & test the code for world module. You can see the result immediately.

**Please make sure you clean all built js files before you run your test! The test will fail if there are built js file! You can run `npm run build:clean` to clean all js!** 

**Highly recommended to add test for the features,** ~~which I always lazy to add.~~

### Before Submit PR

Make sure you run `npm run build` to pass lint and compile at least. (I always forget this) 

## Dependencies & Module Coupling

Just depict some big idea for the module design here. They may not be totally accurate. 

### Core Features (Node/Electron Only)

The features like version parsing, installing, diagnosing, are in this group:

- @xmcl/core
  - @xmcl/installer

They all depends on `@xmcl/core` module, which providing the basic version parsing system. This feature group is nodejs/electron only, as it definity requires file read/write, downloading to file functions, which are no sense on browser in my opinion.

The modules below are used as helper:

- `got`, for downloader
- `yauzl`, for decompressing zip

### User Authorization Features (Node/Electron/Browser)

The features like login, fetch user info/textures goes here:

- @xmcl/user

In node, it will use nodejs http/https module as requester.
In browser, it will use `fetch` as requester.

### General Gaming Features (Node/Electron/Browser)

The features like parsing game setting, parsing forge mod metadata, NBT parsing, game saves parsing, they don't really have any strong connection.

- @xmcl/nbt
- @xmcl/mod-parser
- @xmcl/gamesetting
- @xmcl/text-component
- @xmcl/system
  - @xmcl/resource-manager
  - @xmcl/world
  - @xmcl/resourcepack
- *@xmcl/client (this is node only module)* 

### Client Only Features (Browser Only)

The features only serves for browser:

- @xmcl/model