# Contribute

Feel free to contribute to the project. You can fork the project and make PR to here just like any other github project.

- [Contribute](#contribute)
  - [Getting Started](#getting-started)
    - [Setup Dev Workspace](#setup-dev-workspace)
    - [How to Dev](#how-to-dev)
    - [Commit You Code](#commit-you-code)
    - [Before Submit PR](#before-submit-pr)
  - [Build System](#build-system)
    - [ESM](#esm)
    - [CommonJs](#commonjs)
    - [How user know which version they are using?](#how-user-know-which-version-they-are-using)
    - [Why not dist folder?](#why-not-dist-folder)
  - [Dependencies & Module Coupling](#dependencies--module-coupling)
    - [Core Features (Node/Electron Only)](#core-features-nodeelectron-only)
    - [User Authorization Features (Node/Electron/Browser)](#user-authorization-features-nodeelectronbrowser)
    - [General Gaming Features (Node/Electron/Browser)](#general-gaming-features-nodeelectronbrowser)
    - [Client Only Features (Browser Only)](#client-only-features-browser-only)

## Getting Started

Introduce how to setup environment, modify code and submit PR.

### Setup Dev Workspace

Use git to clone the project `git clone https://github.com/Voxelum/minecraft-launcher-core-node`.

After you cloned the project, you can just install it like normal node project by `npm install` in your repo folder. 

Only If there are somethings missing, you can try to run `npm run update` or `npx lerna bootstrap`.

**The install process should not produce new package-lock.json files under `packages/<module>/`**

### How to Dev

The code are splited into seperated projects, which layed in under `packages` folder. Most of them are really simple (only one `index.ts` file or few files).

The simplest way to run the code is write a test and then run it.

And, the simplest way to run a test is `npx jest packages/<the-package>/<the-test-file.test.ts>`.

Also you can use the command `npm run dev`.

For example, you want to add a functions to parse minecraft chunk data, you can add some code in `packages/world/index.ts`. You might also want to add some test related to your new features, just add somthing in `packages/world/test.ts`. 

During this process, you can first run `npm run dev world`, and it will start to auto compile & test the code for world module. You can see the result immediately.

**Please make sure you clean all built js files before you run your test! The test will fail if there are built js file! You can run `npm run build:clean` to clean all js!** 

**Highly recommended to add test for the features,** ~~which I always lazy to add.~~

### Commit You Code

Make sure you commit your code using the [conventional commit format](https://www.conventionalcommits.org/en/v1.0.0-beta.2/). The github action will use your commit message to generate changelog and bump version. They are important.

### Before Submit PR

Make sure you run `npm run build` to pass lint and compile at least. (I always forget this)

## Build System

The whole project use typescript and rollup js to build. It will build both `esm` and `commonjs` version js files. Some modules can be used in browser, and they will have browser version built.

### ESM

The `esm` version will be just compiled by typescript `tsc`, and emit just along side the original `.ts` files. The reason for that is it provides the option for user to treeshaking and not import all the things at once in some cases. 

For example, the `@xmcl/installer` module has files, `minecraft.ts` and `forge.ts` which serve for installing minecraft and forge. Importing the `@xmcl/installer` can only import the whole `minecraft.ts` OR the whole `forge.ts`, OR both (user can decide), but the import `@xmcl/installer/minecraft` can only import Minecraft functions (one by one, in detail). 

### CommonJs

The `commonjs` version provides the compatibility version for directly `require('@xmcl/module')` in nodejs without a build system with `esm` support. It's built by rollup.js and it built all the files into the single js file. It will called `index.cjs.js`. Notice using the require, you cannot have the syntex like `require('@xmcl/installer/minecraft')`, since that file is in esm format.

For example, all the files in `@xmcl/installer` module will be built into a single file, `packages/installer/index.cjs.js`  and it contains cjs version can be required directly in node.js

### How user know which version they are using?

If you run nodejs and directly require a module `require('@xmcl/core')`, the node module resolution will give you the `main` field in package json, which is the `index.cjs.js` file.

If you using webpack, and bundle these into a single file, it will pick the `main` field if there is no esm support, or pick `module` field if the esm is supported. It will pick the browser file if you are built for browser.

This the same for other bundle system.

### Why not dist folder?

`dist` folder will make user import like `@xmcl/installer/dist/sub-module`, and I think current way is better for user.

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