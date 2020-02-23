# Installer Module

[![npm version](https://img.shields.io/npm/v/@xmcl/installer.svg)](https://www.npmjs.com/package/@xmcl/installer)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Build Status](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)

Provide functions to install Minecraft client, libraries, and assets.

## Usage

### Install Minecraft

Fully install vanilla minecraft client including assets and libs.

```ts
    import { Installer } from "@xmcl/installer";
    import { ResolvedVersion, MinecraftLocation } from "@xmcl/core";

    const minecraft: MinecraftLocation;
    const list: Installer.VersionList = await Installer.getVersionList();
    const aVersion: Installer.Version = list[0]; // i just pick the first version in list here
    await Installer.install("client", aVersion, minecraft);
```

Treeshake friendly import:

```ts
    import { install, getVersionList, Version, VersionList } from "@xmcl/installer/minecraft";
    import { ResolvedVersion, MinecraftLocation } from "@xmcl/core";

    const minecraft: MinecraftLocation;
    const list: VersionList = await getVersionList();
    const aVersion: Version = list[0]; // i just pick the first version in list here
    await install("client", aVersion, minecraft);
```

Just install libraries:

```ts
    import { Installer } from "@xmcl/installer";
    import { ResolvedVersion, MinecraftLocation, Version } from "@xmcl/core";

    const minecraft: MinecraftLocation;
    const version: string; // version string like 1.13
    const resolvedVersion: ResolvedVersion = await Version.parse(version);
    await Installer.installLibraries(resolvedVersion);
```

Just install assets:

```ts
    import { Installer } from "@xmcl/installer";
    import { MinecraftLocation, ResolvedVersion, Version } from "@xmcl/core";

    const minecraft: MinecraftLocation;
    const version: string; // version string like 1.13
    const resolvedVersion: ResolvedVersion = await Version.parse(version);
    await Installer.installAssets(resolvedVersion);
```

Just ensure all assets and libraries are installed:

```ts
    import { Installer } from "@xmcl/installer";
    import { MinecraftLocation, ResolvedVersion, Version } from "@xmcl/core";

    const minecraft: MinecraftLocation;
    const version: string; // version string like 1.13
    const resolvedVersion: ResolvedVersion = await Version.parse(version);
    await Installer.installDependencies(resolvedVersion);
```

Get the report of the version. It can check if version missing assets/libraries.

```ts
    import { Diagnosis } from "@xmcl/core";
    const minecraftLocation: string;
    const minecraftVersionId: string;

    const report: Diagnosis.Report = await Diagnosis.diagnose(minecraftLocation, minecraftVersionId);
```

### Install Library/Assets with Customized Host

To swap the library to your self-host or other customized host, you can assign the `libraryHost` field in options.

For example, if you want to download the library `commons-io:commons-io:2.5` from your self hosted server, you can have

```ts
    // the example for call `installLibraries`
    // this option will also work for other functions involving libraries like `install`, `installDependencies`.
    await Installer.installLibraries(resolvedVersion, {
        libraryHost(library: ResolvedLibrary) {
            if (library.name === "commons-io:commons-io:2.5") {
                // the downloader will first try the first url in the array
                // if this failed, it will try the 2nd.
                // if it's still failed, it will try original url
                return ["https://your-host.org/the/path/to/the/jar", "your-sencodary-url"];
                // if you just have one url
                // just return a string here...
            }
            // return undefined if you don't want to change lib url
            return undefined;
        }
    });
```

To swap the assets host, you can just assign the assets host url to the options

```ts
    await Installer.installAssets(resolvedVersion, {
        assetsHost: "https://www.your-url/assets"
    });
```

The assets host should accept the get asset request like `GET https://www.your-url/assets/<hash-head>/<hash>`, where `hash-head` is the first two char in `<hash>`. The `<hash>` is the sha1 of the asset. 

### Install Forge

Get the forge version info and install forge from it. 

```ts
    import { ForgeInstaller, MinecraftLocation } from "@xmcl/installer";
    const list: ForgeInstaller.VersionList = await ForgeInstaller.getVersionList();
    const minecraftLocation: MinecraftLocation;
    const mcversion = page.mcversion; // mc version
    const firstVersionOnPage: ForgeInstaller.Version = page.versions[0];
    await ForgeInstaller.install(firstVersionOnPage, minecraftLocation);
```

Notice that this installation doesn't ensure full libraries installation.
Please run `Installer.installDependencies` afther that.

The new 1.13 forge installation process requires java to run. 
Either you have `java` executable in your environment variable PATH,
or you can assign java location by `ForgeInstaller.install(forgeVersionMeta, minecraftLocation, { java: yourJavaExecutablePath });`.

If you use this auto installation process to install forge, please checkout [Lex's Patreon](https://www.patreon.com/LexManos).
Consider support him to maintains forge.

### Install Fabric

Fetch the new fabric version list.

```ts
    import { FabricInstaller } from "@xmcl/installer";
    const versionList: Fabric.VersionList = await FabricInstaller.updateVersionList();
    const latestYarnVersion = versionList.yarnVersions[0]; // yarn version is combined by mcversion+yarn build number
    const latestLoaderVersion = versionList.loaderVersions[0];
```

Install fabric to the client. This installation process doesn't ensure the minecraft libraries.

```ts
    import { FabricInstaller } from "@xmcl/fabric";
    const minecraftLocation: MinecraftLocation;
    const yarnVersion: string; // e.g. "1.14.1+build.10"
    const loaderVersion: string; // e.g. "0.4.7+build.147"
    const installPromise: Promise<void> = FabricInstaller.install(yarnVersion, loaderVersion, minecraftLocation)
```

Please run `Installer.installDependencies` after that to install fully.

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
