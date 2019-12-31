# Forge-installer Module

[![npm version](https://img.shields.io/npm/v/@xmcl/forge-installer.svg)](https://www.npmjs.com/package/@xmcl/forge-installer)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Build Status](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)

This is a sub-module belong to [minecraft-launcher-core](https://www.npmjs.com/package/@xmcl/minecraft-launcher-core) module. You can still use this individually.

## New Forge Installing process

The module have three stage for installing new forge *(mcversion >= 1.13)*

1. Deploy forge installer jar
   1. Download installer jar
   2. Extract forge universal jar files in installer jar into `.minecraft/libraries`
   3. Extract `version.json` into target version folder, `.minecraft/versions/<ver>/<ver>.json`
   4. Extract `installer_profile.json` into target version folder, `.minecraft/versions/<ver>/installer_profile.json`
2. Download Dependencies
   1. Merge libraires in `installer_profile.json` and `<ver>.json`
   2. Download them
3. Post processing forge jar
   1. Parse `installer_profile.json`
   2. Get the processors info and execute all of them.

The `ForgeInstaller.install` will do all of them.

The `ForgeInstaller.installByInstallerPartial` will do 2 and 3.

If you want to just do step 3, you can use `ForgeInstaller.diagnose` and find which libraries is break and use `ForgeInstaller.postProcess` to handle it.

## Usage

### Forge Installation

Get the forge version info and install forge from it. 

```ts
    import { ForgeInstaller, ForgeWebPage } from "@xmcl/forge-installer";
    import { MinecraftLocation } from "@xmcl/util";
    const page: ForgeWebPage = await ForgeWebPage.getWebPage();
    const minecraftLocation: MinecraftLocation;
    const mcversion = page.mcversion; // mc version
    const firstVersionOnPage: ForgeWebPage.Version = page.versions[0];
    await ForgeInstaller.install(firstVersionOnPage, minecraftLocation);
```

Notice that this installation doesn't ensure full libraries installation.
Please run `Installer.installDependencies` afther that.

The new 1.13 forge installation process requires java to run. 
Either you have `java` executable in your environment variable PATH,
or you can assign java location by `ForgeInstaller.install(forgeVersionMeta, minecraftLocation, { java: yourJavaExecutablePath });`.

If you use this auto installation process to install forge, please checkout [Lex's Patreon](https://www.patreon.com/LexManos).
Consider support him to maintains forge.

