import { diagnose, MinecraftFolder, MinecraftLocation, Version } from '@xmcl/core'
import { existsSync } from 'fs'
import { join } from 'path'
import { describe, expect, test } from 'vitest'
import { installForge } from './forge'
import { ForgeVersion, install, installDependencies, MinecraftVersion } from './index'
import { getLiteloaderVersionList, installLiteloader, LiteloaderVersion } from './liteloader'

const javaPath = (global as any).Java

describe.skip('Install', () => {
  async function assertNoError(version: string, loc: MinecraftLocation) {
    const diag = await diagnose(version, loc)
    expect(diag.issues).toHaveLength(0)
  }
  describe('MinecraftClient', () => {
    async function installVersionClient(version: MinecraftVersion, gameDirectory: string) {
      const loc = MinecraftFolder.from(gameDirectory)
      await install(version, loc)
      expect(existsSync(loc.getVersionJar(version.id))).toBeTruthy()
      expect(existsSync(loc.getVersionJson(version.id))).toBeTruthy()
      await assertNoError(version.id, loc)
    }
    test('should be able to install 1.6.4', async ({ temp }) => {
      await installVersionClient({
        id: '1.6.4',
        type: 'release',
        time: '2019-06-28T07:06:16+00:00',
        releaseTime: '2013-09-19T15:52:37+00:00',
        url: 'https://launchermeta.mojang.com/v1/packages/b71bae449192fbbe1582ff32fb3765edf0b9b0a8/1.6.4.json',
      }, temp)
    })
    test('should be able to install 1.7.10', async ({ temp }) => {
      await installVersionClient({
        id: '1.7.10',
        type: 'release',
        time: '',
        releaseTime: '',
        url: 'https://launchermeta.mojang.com/v1/packages/2e818dc89e364c7efcfa54bec7e873c5f00b3840/1.7.10.json',
      }, temp)
    })
    test('should be able to install 1.12.2', async ({ temp }) => {
      await installVersionClient({
        id: '1.12.2',
        type: 'release',
        time: '2018-02-15T16:26:45+00:00',
        releaseTime: '2017-09-18T08:39:46+00:00',
        url: 'https://launchermeta.mojang.com/v1/packages/6e69e85d0f85f4f4b9e12dd99d102092a6e15918/1.12.2.json',
      }, temp)
    })
    test('should be able to install 1.14.4', async ({ temp }) => {
      await installVersionClient({
        id: '1.14.4',
        type: 'release',
        url: 'https://launchermeta.mojang.com/v1/packages/132979c36455cc1e17e5f9cc767b4e13c6947033/1.14.4.json',
        time: '2019-07-19T09:28:03+00:00',
        releaseTime: '2019-07-19T09:25:47+00:00',
      }, temp)
    })
    test('should be able to install 1.15.2', async ({ temp }) => {
      await installVersionClient({
        id: '1.15.2',
        type: 'release',
        url: 'https://launchermeta.mojang.com/v1/packages/b2bc26bec3ed3d4763722941b75a25c0a043b744/1.15.2.json',
        time: '2020-01-24T11:23:24+00:00',
        releaseTime: '2020-01-17T10:03:52+00:00',
      }, temp)
    })
    test.only('should be able to install 1.20.1', async ({ temp }) => {
      await installVersionClient({
        id: '1.20.1',
        type: 'release',
        url: 'https://launchermeta.mojang.com/v1/packages/7a66a503888c280c377a998c43b584cf70891d1c/1.20.1.json',
        time: '2025-01-22T06:36:57+00:00',
        releaseTime: '2023-06-12T13:25:51+00:00',
      }, temp)
    })
  })

  describe('MinecraftServer', () => {
    test(
      'should be able to install minecraft server on 1.12.2',
      async ({ temp }) => {
        const meta = {
          id: '1.12.2',
          type: 'release',
          time: '2018-02-15T16:26:45+00:00',
          releaseTime: '2017-09-18T08:39:46+00:00',
          url: 'https://launchermeta.mojang.com/v1/packages/6e69e85d0f85f4f4b9e12dd99d102092a6e15918/1.12.2.json',
        }
        const version = await install(meta, temp, { side: 'server' })
      },
    )
  })
}, 100000000)

describe.skip('Diagnosis', () => {
  describe('#diagnose', () => {
    test.skip('should be able to diagnose empty json folder', async ({ temp }) => {
      await diagnose('1.7.10', temp)
      // expect(v17.version).toBe("1.7.0");
      // expect(v17.minecraftLocation.temp).toBe(temp);
      // expect(v17.missingAssetsIndex).toBe(false);
      // expect(v17.missingLibraries.length).toBe(0);
      // expect(v17.missingVersionJar).toBe(true);
      // expect(v17.missingVersionJson).toBe(true);
    })
  })
})

describe.skip('ForgeInstaller', () => {
  test('should install forge on 1.7.10', async ({ temp }) => {
    const meta: ForgeVersion = {
      version: '10.13.4.1614',
      installer: {
        md5: '8e16eecbe08db1d421532cda746338b3',
        sha1: 'fccafccf8ad4ce6d9f008e786b48ff53172bf9de',
        path: '/maven/net/minecraftforge/forge/1.7.10-10.13.4.1614-1.7.10/forge-1.7.10-10.13.4.1614-1.7.10-installer.jar',
      },
      universal: {
        md5: 'add0fba161c4652a96efb4264ec2d9ec',
        sha1: '25fd97f72beca728112256938e03e8105b1b78cc',
        path: '/maven/net/minecraftforge/forge/1.7.10-10.13.4.1614-1.7.10/forge-1.7.10-10.13.4.1614-1.7.10-universal.jar',
      },
      mcversion: '1.7.10',
      type: 'common',
    }
    const result = await installForge(meta, temp)

    expect(result).toEqual('1.7.10-Forge10.13.4.1614-1.7.10')
    await expect(existsSync(join(temp, 'versions', '1.7.10-Forge10.13.4.1614-1.7.10', '1.7.10-Forge10.13.4.1614-1.7.10.json')))
      .resolves
      .toBeTruthy()
    const resolvedVersion = await Version.parse(temp, result)
    // https://github.com/Voxelum/minecraft-launcher-core-node/issues/210
    resolvedVersion.libraries.filter((lib) => lib.groupId === 'org.scala-lang.plugins')
      .forEach((lib) => { (lib.download as any).sha1 = '' })
    await installDependencies(resolvedVersion)
  })
  test('should install forge 1.12.2-14.23.5.2852', async ({ temp }) => {
    const meta = {
      mcversion: '1.12.2',
      version: '14.23.5.2852',
      installer: {
        sha1: '2a940d9441cc87c3c57f69a8bb4915c1a3ba44e6',
        path: '/maven/net/minecraftforge/forge/1.12.2-14.23.5.2852/forge-1.12.2-14.23.5.2852-installer.jar',
      },
    }
    const result = await installForge(meta, MinecraftFolder.from(temp), { java: javaPath })
    expect(result).toEqual('1.12.2-forge-14.23.5.2852')
    await expect(existsSync(join(temp, 'versions', '1.12.2-forge-14.23.5.2852', '1.12.2-forge-14.23.5.2852.json')))
      .resolves
      .toBeTruthy()
    await installDependencies(await Version.parse(temp, result))
  })

  test('should install forge 1.14.4-forge-28.0.45', async ({ temp }) => {
    const meta: ForgeVersion = {
      mcversion: '1.14.4',
      version: '28.0.45',
      universal: {
        md5: '7f95bfb1266784cf1b9b9fa285bd9b68',
        sha1: '4638379f1729ffe707ed1de94950318558366e54',
        path: '/maven/net/minecraftforge/forge/1.14.4-28.0.45/forge-1.14.4-28.0.45-universal.jar',
      },
      installer: {
        md5: 'a17c1f9ae4ba0bcefc53860a2563ef10',
        sha1: 'af051e288113eedf5c621f61cf69c407f8e36e88',
        path: '/maven/net/minecraftforge/forge/1.14.4-28.0.45/forge-1.14.4-28.0.45-installer.jar',
      },
      type: 'common',
    }
    const result = await installForge(meta, MinecraftFolder.from(temp), { java: javaPath })
    expect(result).toEqual('1.14.4-forge-28.0.45')
    await expect(existsSync(join(temp, 'versions', '1.14.4-forge-28.0.45', '1.14.4-forge-28.0.45.json')))
      .resolves
      .toBeTruthy()
    await installDependencies(await Version.parse(temp, result))
  })
  test.only('should install forge 1.20.1-forge-47.3.0', async ({ temp }) => {
    const meta = {
      mcversion: '1.20.1',
      version: '47.3.0',
      installer: {
        md5: 'ee3ca303001d1e856558b75b2a5854f1',
        sha1: '0deb8e547a9e3f098a4c9f082903499703c52f5d',
        path: '/net/minecraftforge/forge/1.20.1-47.3.0/forge-1.20.1-47.3.0-installer.jar',
      },
      type: 'common',
    }
    const result = await installForge(meta, MinecraftFolder.from(temp), { java: javaPath })
    expect(result).toEqual('1.20.1-forge-47.3.0')
    expect(existsSync(join(temp, 'versions', '1.20.1-forge-47.3.0', '1.20.1-forge-47.3.0.json')))
      .toBeTruthy()
  })
}, 100000000)

describe.skip('LiteloaderInstaller', () => {
  describe('#update', () => {
    test('should be able to fetch liteloader version json', async () => {
      await getLiteloaderVersionList({}).then((list) => {
        expect(list).toBeTruthy()
      }).catch((e) => {
        if (e.error === '500: Internal Server Error') {
          console.warn('Liteloader website is down. Cannot test this.')
        }
      })
    })
  })
  describe('#install', () => {
    test('should be able to install liteloader on 1.12.2', async ({ temp }) => {
      const meta: LiteloaderVersion = { url: 'http://repo.mumfrey.com/content/repositories/snapshots/', type: 'SNAPSHOT', file: 'liteloader-1.12.2-SNAPSHOT.jar', version: '1.12.2-SNAPSHOT', md5: '1420785ecbfed5aff4a586c5c9dd97eb', timestamp: '1511880271', mcversion: '1.12.2', tweakClass: 'com.mumfrey.liteloader.launch.LiteLoaderTweaker', libraries: [{ name: 'net.minecraft:launchwrapper:1.12' }, { name: 'org.ow2.asm:asm-all:5.2' }] }
      const result = await installLiteloader(meta, MinecraftFolder.from(temp))
      await installDependencies(await Version.parse(temp, result))
    })
    test('should be able to install liteloader to forge', async ({ temp }) => {
      const meta: LiteloaderVersion = { url: 'http://repo.mumfrey.com/content/repositories/snapshots/', type: 'SNAPSHOT', file: 'liteloader-1.12.2-SNAPSHOT.jar', version: '1.12.2-SNAPSHOT', md5: '1420785ecbfed5aff4a586c5c9dd97eb', timestamp: '1511880271', mcversion: '1.12.2', tweakClass: 'com.mumfrey.liteloader.launch.LiteLoaderTweaker', libraries: [{ name: 'net.minecraft:launchwrapper:1.12' }, { name: 'org.ow2.asm:asm-all:5.2' }] }
      const result = await installLiteloader(meta, MinecraftFolder.from(temp), { inheritsFrom: '1.12.2-forge-14.23.5.2852' })
      const resolvedVersion = await Version.parse(temp, result)
      // https://github.com/Voxelum/minecraft-launcher-core-node/issues/210
      resolvedVersion.libraries.filter((lib) => lib.groupId === 'org.scala-lang.plugins')
        .forEach((lib) => { (lib.download as any).sha1 = '' })
      await installDependencies(resolvedVersion)
    })
  })
})

describe.skip('FabricInstaller', () => {
  // test("should be able to install fabric", async () => {
  //     await installFabricYarnAndLoader("1.14.1+build.10", "0.4.7+build.147", temp);
  //     expect(existsSync(MinecraftFolder.from(temp).getVersionJson("1.14.1-fabric1.14.1+build.10-0.4.7+build.147")))
  //         .toBeTruthy();
  // });
})
