# Changelog

## 3.5.3
### @xmcl/installer@2.9.4
#### Bug Fixes

- fix: ensure the download stream and write end (#170) ([5fba3b037d627c175067d81563703a0e512ff458](https://github.com/voxelum/minecraft-launcher-core-node/commit/5fba3b037d627c175067d81563703a0e512ff458))


## 3.5.2
### @xmcl/installer@2.9.3
#### Bug Fixes

- fix: append new url on front of urls array ([485fda80d068a58858be8540a92f2262aa06a638](https://github.com/voxelum/minecraft-launcher-core-node/commit/485fda80d068a58858be8540a92f2262aa06a638))
### @xmcl/mod-parser@2.0.9
#### Bug Fixes

- fix: correctly type the fabric metadata ([1a1d9e4907f094820fcba3127f49b4f751831b0f](https://github.com/voxelum/minecraft-launcher-core-node/commit/1a1d9e4907f094820fcba3127f49b4f751831b0f))


## 3.5.1
### @xmcl/mod-parser@2.0.8
#### Bug Fixes

- fix: ignore empty modid during parsing mod ([91ae8a63e3ccdb6676aef0a7b3746948a562cddd](https://github.com/voxelum/minecraft-launcher-core-node/commit/91ae8a63e3ccdb6676aef0a7b3746948a562cddd))


## 3.5.0
### @xmcl/core@2.4.0
#### Features

- feat: custom launch server executable option ([0df6c44e85cb98e41ecd33f06e4a1bb5faf6d145](https://github.com/voxelum/minecraft-launcher-core-node/commit/0df6c44e85cb98e41ecd33f06e4a1bb5faf6d145))
#### Bug Fixes

- fix: crashReport location should not contain nextline ([ce5069457ffffe69919a8bd9187cbbee7bfae915](https://github.com/voxelum/minecraft-launcher-core-node/commit/ce5069457ffffe69919a8bd9187cbbee7bfae915))
### @xmcl/system@2.1.0
#### Features

- feat: add cd for file system ([bdd0bb8e06d20371558d41f5be940b28b3bace35](https://github.com/voxelum/minecraft-launcher-core-node/commit/bdd0bb8e06d20371558d41f5be940b28b3bace35))
### @xmcl/installer@2.9.2
#### Bug Fixes

- fix: allow retry on EPROTO & ECANCELED ([f4a103cf43f4dd84e1e2bbb91d8dd67905b5e289](https://github.com/voxelum/minecraft-launcher-core-node/commit/f4a103cf43f4dd84e1e2bbb91d8dd67905b5e289))
- fix: just install jar for server ([9f63f2f987baa3c4a75fb2ad9c32998e3072745b](https://github.com/voxelum/minecraft-launcher-core-node/commit/9f63f2f987baa3c4a75fb2ad9c32998e3072745b))
- Dependency @xmcl/core bump **patch**
### @xmcl/mod-parser@2.0.7
- Dependency @xmcl/system bump **patch**
### @xmcl/resourcepack@1.0.13
- Dependency @xmcl/system bump **patch**
### @xmcl/model@1.0.13
- Dependency @xmcl/resourcepack bump **patch**
### @xmcl/resource-manager@2.0.2
- Dependency @xmcl/system bump **patch**
- Dependency @xmcl/resourcepack bump **patch**
### @xmcl/world@1.1.2
- Dependency @xmcl/system bump **patch**


## 3.4.1
### @xmcl/core@2.3.1
#### Bug Fixes

- fix: wrong native sha validation ([2ca1a3c6a8653a2a90495f895f4838edc0a1209a](https://github.com/voxelum/minecraft-launcher-core-node/commit/2ca1a3c6a8653a2a90495f895f4838edc0a1209a))
### @xmcl/installer@2.9.1
- Dependency @xmcl/core bump **patch**


## 3.4.0
### @xmcl/task@2.2.0
#### Features

- feat: support passing cancel outside ([f8f50503d387a85ba91232801a7dd46e01367802](https://github.com/voxelum/minecraft-launcher-core-node/commit/f8f50503d387a85ba91232801a7dd46e01367802))
#### Bug Fixes

- fix: emit pause whatever the case ([c6d6b4e3a42f9edb5e7d130672fb983547a8c7b4](https://github.com/voxelum/minecraft-launcher-core-node/commit/c6d6b4e3a42f9edb5e7d130672fb983547a8c7b4))
### @xmcl/installer@2.9.0
#### Features

- feat: add support install from loader version ([d03dd862d7d43fb8d9a45b7fec74545aa9351c2a](https://github.com/voxelum/minecraft-launcher-core-node/commit/d03dd862d7d43fb8d9a45b7fec74545aa9351c2a))
#### Bug Fixes

- fix: download cancel handle ([02af0af0e8a8c3b4faced57c57cc2c953dd4825e](https://github.com/voxelum/minecraft-launcher-core-node/commit/02af0af0e8a8c3b4faced57c57cc2c953dd4825e))
- fix: downloader not work for url without eTag ([554703f3b3a84e4a7361d238f21816359cfa23c1](https://github.com/voxelum/minecraft-launcher-core-node/commit/554703f3b3a84e4a7361d238f21816359cfa23c1))
- fix: add more robust check to Java installer (#160) ([a8d2ee6bacd3c2049e386e448015dd401fa6ccfb](https://github.com/voxelum/minecraft-launcher-core-node/commit/a8d2ee6bacd3c2049e386e448015dd401fa6ccfb))
- Dependency @xmcl/task bump **patch**


## 3.3.0
### @xmcl/core@2.3.0
#### Features

- feat(core): support `resolve` for non-standard version json ([2ed83ab62d5a12261460e57de74cb119982388b2](https://github.com/voxelum/minecraft-launcher-core-node/commit/2ed83ab62d5a12261460e57de74cb119982388b2))
### @xmcl/curseforge@0.1.2
#### Bug Fixes

- fix: guard the get with the http code ([d831e5882115497445410156738fa262c0cd7af5](https://github.com/voxelum/minecraft-launcher-core-node/commit/d831e5882115497445410156738fa262c0cd7af5))
### @xmcl/forge-site-parser@2.0.5
#### Bug Fixes

- fix: change the fast-html-parser to node-html-parser ([961bad778566f6193542acff675a10fe3d81810a](https://github.com/voxelum/minecraft-launcher-core-node/commit/961bad778566f6193542acff675a10fe3d81810a))
### @xmcl/task@2.1.8
#### Bug Fixes

- fix: wait pause correctly & typo on pause event ([607688870924888cc49605e9c14b9eee910d370a](https://github.com/voxelum/minecraft-launcher-core-node/commit/607688870924888cc49605e9c14b9eee910d370a))
### @xmcl/installer@2.8.2
#### Bug Fixes

- fix: return the installed optifine version ([95c681a26c2e9ab174005468d045586e0c37f310](https://github.com/voxelum/minecraft-launcher-core-node/commit/95c681a26c2e9ab174005468d045586e0c37f310))
- Dependency @xmcl/core bump **patch**
- Dependency @xmcl/forge-site-parser bump **patch**
- Dependency @xmcl/task bump **patch**


## 3.2.1
### @xmcl/installer@2.8.1
#### Bug Fixes

- fix: correctly find Config.class on old version of Optifine (#155) ([66489b19a4416485e9727f57d704bc819a3f744b](https://github.com/voxelum/minecraft-launcher-core-node/commit/66489b19a4416485e9727f57d704bc819a3f744b))


## 3.2.0
### @xmcl/task@2.1.7
#### Bug Fixes

- fix: wrong pause dispatch ([df8e7364b1a9281e5acfd0ce9cd5ebb2af637fb9](https://github.com/voxelum/minecraft-launcher-core-node/commit/df8e7364b1a9281e5acfd0ce9cd5ebb2af637fb9))
### @xmcl/installer@2.8.0
#### Features

- feat: support more options to swap urls src ([c064074773c1be0887f0e73ffa52aa506ea44995](https://github.com/voxelum/minecraft-launcher-core-node/commit/c064074773c1be0887f0e73ffa52aa506ea44995))
- Dependency @xmcl/task bump **patch**


## 3.1.3
### @xmcl/installer@2.7.3
#### Bug Fixes

- fix: correctly reset state ([db73d6f9870e158bd8b22d8c613811a1a2091581](https://github.com/voxelum/minecraft-launcher-core-node/commit/db73d6f9870e158bd8b22d8c613811a1a2091581))
- fix: caught the error during fetch & checksum to ensure result (#149) ([b3950d9db367815a3b0faec2cdf73c4ce9fdcb2d](https://github.com/voxelum/minecraft-launcher-core-node/commit/b3950d9db367815a3b0faec2cdf73c4ce9fdcb2d))


## 3.1.2
### @xmcl/installer@2.7.2
#### Bug Fixes

- fix: support real pause and resume (in-memory) and handle event correctly (#146) ([0d35b742ad0ec04aa7b907dc5fbdfa98be064212](https://github.com/voxelum/minecraft-launcher-core-node/commit/0d35b742ad0ec04aa7b907dc5fbdfa98be064212))


## 3.1.1
### @xmcl/installer@2.7.1
#### Bug Fixes

- fix: phantom reference of the gotjs ([4c5d9daaae2a61e2c1f2725b0a342fd5e35aed88](https://github.com/voxelum/minecraft-launcher-core-node/commit/4c5d9daaae2a61e2c1f2725b0a342fd5e35aed88))


## 3.1.0
### @xmcl/core@2.2.0
#### Features

- feat: support legacy Minecraft assets link ([783daa03310f59b2847cc47ba855b6843c11a13e](https://github.com/voxelum/minecraft-launcher-core-node/commit/783daa03310f59b2847cc47ba855b6843c11a13e))
- feat: remove got from @xmcl/installer and support segment download ([667cd78b491f7073a12e44d1f8d32f6e89108be8](https://github.com/voxelum/minecraft-launcher-core-node/commit/667cd78b491f7073a12e44d1f8d32f6e89108be8))
### @xmcl/installer@2.7.0
#### Features

- feat: remove got from @xmcl/installer and support segment download ([667cd78b491f7073a12e44d1f8d32f6e89108be8](https://github.com/voxelum/minecraft-launcher-core-node/commit/667cd78b491f7073a12e44d1f8d32f6e89108be8))
- feat: adjust the fabric get version list API ([4a966a1084620490223c499752ab195e647d80db](https://github.com/voxelum/minecraft-launcher-core-node/commit/4a966a1084620490223c499752ab195e647d80db))
- Dependency @xmcl/core bump **patch**


## 3.0.3
### @xmcl/curseforge@0.1.1
#### Bug Fixes

- fix: correct the usage of the API ([bbd383e236321c4d8dc32539ba622708b9656de9](https://github.com/voxelum/minecraft-launcher-core-node/commit/bbd383e236321c4d8dc32539ba622708b9656de9))


## 3.0.2
### @xmcl/task@2.1.6
#### Bug Fixes

- fix: nest task propagation ([b8b5a2ed156e0cc796316202086a87c91d76468c](https://github.com/voxelum/minecraft-launcher-core-node/commit/b8b5a2ed156e0cc796316202086a87c91d76468c))
### @xmcl/installer@2.6.8
- Dependency @xmcl/task bump **patch**


## 3.0.1
### @xmcl/core@2.1.3
#### Bug Fixes

- fix: inverted validation result ([01b9866964f90aed9eb55d53fec178c464aacf23](https://github.com/voxelum/minecraft-launcher-core-node/commit/01b9866964f90aed9eb55d53fec178c464aacf23))
### @xmcl/resourcepack@1.0.12
#### Bug Fixes

- fix: wrong resourcepack info return ([a9b1359bccf436f73d96a4a09622970360df6c07](https://github.com/voxelum/minecraft-launcher-core-node/commit/a9b1359bccf436f73d96a4a09622970360df6c07))
### @xmcl/installer@2.6.7
- Dependency @xmcl/core bump **patch**
### @xmcl/model@1.0.12
- Dependency @xmcl/resourcepack bump **patch**
### @xmcl/resource-manager@2.0.1
- Dependency @xmcl/resourcepack bump **patch**


## 3.0.0
### @xmcl/nbt@2.0.3
#### Bug Fixes

- fix: unify the error thrown ([6d3d5c79518305685316e81bf7f30cb0a0134972](https://github.com/voxelum/minecraft-launcher-core-node/commit/6d3d5c79518305685316e81bf7f30cb0a0134972))
### @xmcl/unzip@1.2.0
#### Features

- feat: add find entry ([0c509e151ba3c3a2af4924a76891dc0674402ead](https://github.com/voxelum/minecraft-launcher-core-node/commit/0c509e151ba3c3a2af4924a76891dc0674402ead))
### @xmcl/client@2.0.5
- Dependency @xmcl/nbt bump **patch**
### @xmcl/core@2.1.2
#### Bug Fixes

- fix: clear fs deps on core and installer modules ([ff78d9bc8743fd39a7c0b08a794e9ec5adcf3af5](https://github.com/voxelum/minecraft-launcher-core-node/commit/ff78d9bc8743fd39a7c0b08a794e9ec5adcf3af5))
- fix: correct parse of snapshot version ([fdf5600325546309b79e74e4699cbac3702125eb](https://github.com/voxelum/minecraft-launcher-core-node/commit/fdf5600325546309b79e74e4699cbac3702125eb))
- fix: unify the error thrown ([6d3d5c79518305685316e81bf7f30cb0a0134972](https://github.com/voxelum/minecraft-launcher-core-node/commit/6d3d5c79518305685316e81bf7f30cb0a0134972))
- Dependency @xmcl/unzip bump **patch**
### @xmcl/installer@2.6.6
#### Bug Fixes

- fix: forge 1.12 new pipeline #136 ([a131b7e0f9968b66b1273f16ea1b369b88bd883f](https://github.com/voxelum/minecraft-launcher-core-node/commit/a131b7e0f9968b66b1273f16ea1b369b88bd883f))
- fix: clear fs deps on core and installer modules ([ff78d9bc8743fd39a7c0b08a794e9ec5adcf3af5](https://github.com/voxelum/minecraft-launcher-core-node/commit/ff78d9bc8743fd39a7c0b08a794e9ec5adcf3af5))
- fix: wrong platform to install jre #135 ([78d538d365a19256b27c07f891ec0488193dd3f3](https://github.com/voxelum/minecraft-launcher-core-node/commit/78d538d365a19256b27c07f891ec0488193dd3f3))
- fix: unify the error thrown ([6d3d5c79518305685316e81bf7f30cb0a0134972](https://github.com/voxelum/minecraft-launcher-core-node/commit/6d3d5c79518305685316e81bf7f30cb0a0134972))
- Dependency @xmcl/core bump **patch**
### @xmcl/system@2.0.0
#### BREAKING CHANGES

- BREAKING CHANGE: simplify API of resource-manager and system ([2ec473b35d8c7c14cbdf5971fc811f14fbb4eff0](https://github.com/voxelum/minecraft-launcher-core-node/commit/2ec473b35d8c7c14cbdf5971fc811f14fbb4eff0))
- Dependency @xmcl/unzip bump **patch**
### @xmcl/mod-parser@2.0.6
#### Bug Fixes

- fix: use new system API ([b796688089f9697d833ccea76647c6fba802839a](https://github.com/voxelum/minecraft-launcher-core-node/commit/b796688089f9697d833ccea76647c6fba802839a))
- Dependency @xmcl/system bump **patch**
### @xmcl/resourcepack@1.0.11
#### Bug Fixes

- fix: clear fs deps on core and installer modules ([ff78d9bc8743fd39a7c0b08a794e9ec5adcf3af5](https://github.com/voxelum/minecraft-launcher-core-node/commit/ff78d9bc8743fd39a7c0b08a794e9ec5adcf3af5))
- fix: use new system API ([b796688089f9697d833ccea76647c6fba802839a](https://github.com/voxelum/minecraft-launcher-core-node/commit/b796688089f9697d833ccea76647c6fba802839a))
- Dependency @xmcl/system bump **patch**
### @xmcl/model@1.0.11
- Dependency @xmcl/resourcepack bump **patch**
### @xmcl/resource-manager@2.0.0
#### BREAKING CHANGES

- BREAKING CHANGE: simplify API of resource-manager and system ([2ec473b35d8c7c14cbdf5971fc811f14fbb4eff0](https://github.com/voxelum/minecraft-launcher-core-node/commit/2ec473b35d8c7c14cbdf5971fc811f14fbb4eff0))
- Dependency @xmcl/system bump **patch**
- Dependency @xmcl/resourcepack bump **patch**
### @xmcl/server-info@2.0.3
- Dependency @xmcl/nbt bump **patch**
### @xmcl/world@1.1.1
#### Bug Fixes

- fix: use new system API ([b796688089f9697d833ccea76647c6fba802839a](https://github.com/voxelum/minecraft-launcher-core-node/commit/b796688089f9697d833ccea76647c6fba802839a))
- fix: remove bytebuffer dep ([54179fbe564c454a7c2d90cabc38a9d8d144ef7c](https://github.com/voxelum/minecraft-launcher-core-node/commit/54179fbe564c454a7c2d90cabc38a9d8d144ef7c))
- Dependency @xmcl/nbt bump **patch**
- Dependency @xmcl/system bump **patch**


## 2.8.0
### @xmcl/nbt@2.0.2
#### Bug Fixes

- fix: prevent losing stacktrace by throwing actual Error ([005ecb3d55cb4419b16ed24dfb8d01d91f12d9d8](https://github.com/voxelum/minecraft-launcher-core-node/commit/005ecb3d55cb4419b16ed24dfb8d01d91f12d9d8))
- fix: rollback file-type & long ([f7f963b0fe50f46280dc604ac86e9483f168837e](https://github.com/voxelum/minecraft-launcher-core-node/commit/f7f963b0fe50f46280dc604ac86e9483f168837e))
### @xmcl/core@2.1.1
#### Bug Fixes

- fix: correct the uuid usage for new version ([d33ad313eecb95393d8ba710b34f9f9058425bf0](https://github.com/voxelum/minecraft-launcher-core-node/commit/d33ad313eecb95393d8ba710b34f9f9058425bf0))
### @xmcl/user@2.1.3
#### Bug Fixes

- fix: correct the uuid usage for new version ([d33ad313eecb95393d8ba710b34f9f9058425bf0](https://github.com/voxelum/minecraft-launcher-core-node/commit/d33ad313eecb95393d8ba710b34f9f9058425bf0))
### @xmcl/client@2.0.4
#### Bug Fixes

- fix: rollback file-type & long ([f7f963b0fe50f46280dc604ac86e9483f168837e](https://github.com/voxelum/minecraft-launcher-core-node/commit/f7f963b0fe50f46280dc604ac86e9483f168837e))
- Dependency @xmcl/nbt bump **patch**
### @xmcl/installer@2.6.5
- Dependency @xmcl/core bump **patch**
### @xmcl/server-info@2.0.2
- Dependency @xmcl/nbt bump **patch**
### @xmcl/world@1.1.0
#### Features

- feat: parse blockstates in chunk ([b493b0ed81e2e520281347fafc0c27ecff0dee5f](https://github.com/voxelum/minecraft-launcher-core-node/commit/b493b0ed81e2e520281347fafc0c27ecff0dee5f))
- Dependency @xmcl/nbt bump **patch**


## 2.7.0
### @xmcl/core@2.1.0
#### Features

- feat: add resolveFromPath ([890f70aa4f492d97e5e7513afcfc71b424962bf2](https://github.com/voxelum/minecraft-launcher-core-node/commit/890f70aa4f492d97e5e7513afcfc71b424962bf2))
### @xmcl/curseforge@0.1.0
#### Features

- feat: curseforge support ([922948df3987fad92299af3c5dd5f02d06c97d76](https://github.com/voxelum/minecraft-launcher-core-node/commit/922948df3987fad92299af3c5dd5f02d06c97d76))
### @xmcl/installer@2.6.4
#### Bug Fixes

- fix: remove redundent check ([9ee553dd5e04f7fbdd89274d1c4d2dbc19973114](https://github.com/voxelum/minecraft-launcher-core-node/commit/9ee553dd5e04f7fbdd89274d1c4d2dbc19973114))
- fix: correct the task name ([408d35d5f77bc6da558d45ac74e308014f8802ae](https://github.com/voxelum/minecraft-launcher-core-node/commit/408d35d5f77bc6da558d45ac74e308014f8802ae))
- fix: expose error to outer ([5c5a0fa89605b1a0babe2fc5e681134cd749bf4f](https://github.com/voxelum/minecraft-launcher-core-node/commit/5c5a0fa89605b1a0babe2fc5e681134cd749bf4f))
- fix: expose post postProcess task ([2933d576feff0c4e0aa66b4a242903ea20b45d7e](https://github.com/voxelum/minecraft-launcher-core-node/commit/2933d576feff0c4e0aa66b4a242903ea20b45d7e))
- Dependency @xmcl/core bump **patch**


## 2.6.3
### @xmcl/installer@2.6.3
#### Bug Fixes

- fix: diagnose libraries for install profile ([f4df3752c6781fff43de562419063477fa85e39c](https://github.com/voxelum/minecraft-launcher-core-node/commit/f4df3752c6781fff43de562419063477fa85e39c))
- fix: wrong forge installer maven path ([d5babfdbf18fc3c384b09f65e3d02e21ab0c0c44](https://github.com/voxelum/minecraft-launcher-core-node/commit/d5babfdbf18fc3c384b09f65e3d02e21ab0c0c44))
- fix: catch the error in sync code ([bb9942988be2e66a2a09373052d200d6571a4ef3](https://github.com/voxelum/minecraft-launcher-core-node/commit/bb9942988be2e66a2a09373052d200d6571a4ef3))
- fix: ensure forge url normalized ([b7240061d41733d83cad79994dfc265df42d288f](https://github.com/voxelum/minecraft-launcher-core-node/commit/b7240061d41733d83cad79994dfc265df42d288f))


## 2.6.2
### @xmcl/installer@2.6.2
#### Bug Fixes

- fix: wrong error catching ([8c1900e8c1d1e6e70a575b84d29e35164b7ce429](https://github.com/voxelum/minecraft-launcher-core-node/commit/8c1900e8c1d1e6e70a575b84d29e35164b7ce429))
- fix: expose the resolved assets install task ([4fa88ba6a3bb51921055d1ae36613d58741adc8f](https://github.com/voxelum/minecraft-launcher-core-node/commit/4fa88ba6a3bb51921055d1ae36613d58741adc8f))


## 2.6.1
### @xmcl/task@2.1.5
#### Bug Fixes

- fix: wrong parent event emitted ([3833ba08c05b93e2a3c0c8d848e33d4d0cdf23ca](https://github.com/voxelum/minecraft-launcher-core-node/commit/3833ba08c05b93e2a3c0c8d848e33d4d0cdf23ca))
### @xmcl/installer@2.6.1
#### Bug Fixes

- fix: rewrite the diagnose and mark beta ([f66ca038a6578032505d30421d8fdb4a784ea0e2](https://github.com/voxelum/minecraft-launcher-core-node/commit/f66ca038a6578032505d30421d8fdb4a784ea0e2))
- fix: enable jsonUrl replacement ([54674b3e6bb48761c3402abf40556855800157b1](https://github.com/voxelum/minecraft-launcher-core-node/commit/54674b3e6bb48761c3402abf40556855800157b1))
- fix: simplify the install version requirement ([e3ace2626a37e9859252ce4a2e80112dc90dfe5f](https://github.com/voxelum/minecraft-launcher-core-node/commit/e3ace2626a37e9859252ce4a2e80112dc90dfe5f))
- Dependency @xmcl/task bump **patch**


## 2.6.0
### @xmcl/unzip@1.1.3
#### Bug Fixes

- fix: remove dead code & force bump ([8b1a4122b021f51fff8482d2705efdbc60b06d65](https://github.com/voxelum/minecraft-launcher-core-node/commit/8b1a4122b021f51fff8482d2705efdbc60b06d65))
### @xmcl/task@2.1.4
#### Bug Fixes

- fix: shorten the name and use correct export ([b40af8a46cbf316883491445d10493ea9ec6ef1b](https://github.com/voxelum/minecraft-launcher-core-node/commit/b40af8a46cbf316883491445d10493ea9ec6ef1b))
### @xmcl/core@2.0.7
- Dependency @xmcl/unzip bump **patch**
### @xmcl/installer@2.6.0
#### Features

- feat: include java installer ([5bcce2320d48f3a11a01e568f9207540d7d73d91](https://github.com/voxelum/minecraft-launcher-core-node/commit/5bcce2320d48f3a11a01e568f9207540d7d73d91))
#### Bug Fixes

- fix: add progress status and mark beta ([4d6dbe96397b3e16b179343954c8b8928c6cc358](https://github.com/voxelum/minecraft-launcher-core-node/commit/4d6dbe96397b3e16b179343954c8b8928c6cc358))
- Dependency @xmcl/core bump **patch**
- Dependency @xmcl/task bump **patch**
### @xmcl/system@1.0.9
- Dependency @xmcl/unzip bump **patch**
### @xmcl/mod-parser@2.0.5
- Dependency @xmcl/system bump **patch**
### @xmcl/resourcepack@1.0.10
- Dependency @xmcl/system bump **patch**
### @xmcl/model@1.0.10
- Dependency @xmcl/resourcepack bump **patch**
### @xmcl/resource-manager@1.0.10
- Dependency @xmcl/system bump **patch**
- Dependency @xmcl/resourcepack bump **patch**
### @xmcl/world@1.0.9
- Dependency @xmcl/system bump **patch**


## 2.5.0
### @xmcl/nbt@2.0.1
#### Bug Fixes

- fix: use rollup to build and fix wrong import module ([c1b5582ecafc4cdfe96481b305013850d9e13cb5](https://github.com/voxelum/minecraft-launcher-core-node/commit/c1b5582ecafc4cdfe96481b305013850d9e13cb5))
### @xmcl/text-component@2.1.1
#### Bug Fixes

- fix: use rollup to build and fix wrong import module ([c1b5582ecafc4cdfe96481b305013850d9e13cb5](https://github.com/voxelum/minecraft-launcher-core-node/commit/c1b5582ecafc4cdfe96481b305013850d9e13cb5))
### @xmcl/unzip@1.1.2
#### Bug Fixes

- fix: use rollup to build and fix wrong import module ([c1b5582ecafc4cdfe96481b305013850d9e13cb5](https://github.com/voxelum/minecraft-launcher-core-node/commit/c1b5582ecafc4cdfe96481b305013850d9e13cb5))
### @xmcl/forge-site-parser@2.0.4
#### Bug Fixes

- fix: use rollup to build and fix wrong import module ([c1b5582ecafc4cdfe96481b305013850d9e13cb5](https://github.com/voxelum/minecraft-launcher-core-node/commit/c1b5582ecafc4cdfe96481b305013850d9e13cb5))
### @xmcl/gamesetting@2.0.1
#### Bug Fixes

- fix: use rollup to build and fix wrong import module ([c1b5582ecafc4cdfe96481b305013850d9e13cb5](https://github.com/voxelum/minecraft-launcher-core-node/commit/c1b5582ecafc4cdfe96481b305013850d9e13cb5))
### @xmcl/task@2.1.3
#### Bug Fixes

- fix: use rollup to build and fix wrong import module ([c1b5582ecafc4cdfe96481b305013850d9e13cb5](https://github.com/voxelum/minecraft-launcher-core-node/commit/c1b5582ecafc4cdfe96481b305013850d9e13cb5))
### @xmcl/user@2.1.2
#### Bug Fixes

- fix: use rollup to build and fix wrong import module ([c1b5582ecafc4cdfe96481b305013850d9e13cb5](https://github.com/voxelum/minecraft-launcher-core-node/commit/c1b5582ecafc4cdfe96481b305013850d9e13cb5))
### @xmcl/client@2.0.3
#### Bug Fixes

- fix: use rollup to build and fix wrong import module ([c1b5582ecafc4cdfe96481b305013850d9e13cb5](https://github.com/voxelum/minecraft-launcher-core-node/commit/c1b5582ecafc4cdfe96481b305013850d9e13cb5))
- Dependency @xmcl/nbt bump **patch**
- Dependency @xmcl/text-component bump **patch**
### @xmcl/core@2.0.6
#### Bug Fixes

- fix: use rollup to build and fix wrong import module ([c1b5582ecafc4cdfe96481b305013850d9e13cb5](https://github.com/voxelum/minecraft-launcher-core-node/commit/c1b5582ecafc4cdfe96481b305013850d9e13cb5))
- Dependency @xmcl/unzip bump **patch**
### @xmcl/installer@2.5.0
#### Features

- feat: file name resolver ([3834a7b8d244cdc1fa67e8979a7531208700c25a](https://github.com/voxelum/minecraft-launcher-core-node/commit/3834a7b8d244cdc1fa67e8979a7531208700c25a))
- feat: optifine installer ([e00536155f81c770435528c15cc4466df4e5f8d3](https://github.com/voxelum/minecraft-launcher-core-node/commit/e00536155f81c770435528c15cc4466df4e5f8d3))
#### Bug Fixes

- fix: use rollup to build and fix wrong import module ([c1b5582ecafc4cdfe96481b305013850d9e13cb5](https://github.com/voxelum/minecraft-launcher-core-node/commit/c1b5582ecafc4cdfe96481b305013850d9e13cb5))
- fix: correctly overwrite ([84559efd2a3047e732a1c70b74a52aef853cf004](https://github.com/voxelum/minecraft-launcher-core-node/commit/84559efd2a3047e732a1c70b74a52aef853cf004))
- Dependency @xmcl/core bump **patch**
- Dependency @xmcl/forge-site-parser bump **patch**
- Dependency @xmcl/task bump **patch**
### @xmcl/java-installer@0.1.4
#### Bug Fixes

- fix: use rollup to build and fix wrong import module ([c1b5582ecafc4cdfe96481b305013850d9e13cb5](https://github.com/voxelum/minecraft-launcher-core-node/commit/c1b5582ecafc4cdfe96481b305013850d9e13cb5))
- fix: wrong platform check and remove redundent check ([e08131ddd505c0065a82b86154d741200ca8f134](https://github.com/voxelum/minecraft-launcher-core-node/commit/e08131ddd505c0065a82b86154d741200ca8f134))
- Dependency @xmcl/task bump **patch**
### @xmcl/system@1.0.8
#### Bug Fixes

- fix: use rollup to build and fix wrong import module ([c1b5582ecafc4cdfe96481b305013850d9e13cb5](https://github.com/voxelum/minecraft-launcher-core-node/commit/c1b5582ecafc4cdfe96481b305013850d9e13cb5))
- fix: compatible with old njs ([16cc85c0c8456649d275d4080ef5d27572ff3f76](https://github.com/voxelum/minecraft-launcher-core-node/commit/16cc85c0c8456649d275d4080ef5d27572ff3f76))
- Dependency @xmcl/unzip bump **patch**
### @xmcl/mod-parser@2.0.4
#### Bug Fixes

- fix: use rollup to build and fix wrong import module ([c1b5582ecafc4cdfe96481b305013850d9e13cb5](https://github.com/voxelum/minecraft-launcher-core-node/commit/c1b5582ecafc4cdfe96481b305013850d9e13cb5))
- Dependency @xmcl/system bump **patch**
### @xmcl/resourcepack@1.0.9
#### Bug Fixes

- fix: use rollup to build and fix wrong import module ([c1b5582ecafc4cdfe96481b305013850d9e13cb5](https://github.com/voxelum/minecraft-launcher-core-node/commit/c1b5582ecafc4cdfe96481b305013850d9e13cb5))
- Dependency @xmcl/system bump **patch**
### @xmcl/model@1.0.9
#### Bug Fixes

- fix: use rollup to build and fix wrong import module ([c1b5582ecafc4cdfe96481b305013850d9e13cb5](https://github.com/voxelum/minecraft-launcher-core-node/commit/c1b5582ecafc4cdfe96481b305013850d9e13cb5))
- Dependency @xmcl/resourcepack bump **patch**
### @xmcl/resource-manager@1.0.9
#### Bug Fixes

- fix: use rollup to build and fix wrong import module ([c1b5582ecafc4cdfe96481b305013850d9e13cb5](https://github.com/voxelum/minecraft-launcher-core-node/commit/c1b5582ecafc4cdfe96481b305013850d9e13cb5))
- Dependency @xmcl/system bump **patch**
- Dependency @xmcl/resourcepack bump **patch**
### @xmcl/server-info@2.0.1
#### Bug Fixes

- fix: use rollup to build and fix wrong import module ([c1b5582ecafc4cdfe96481b305013850d9e13cb5](https://github.com/voxelum/minecraft-launcher-core-node/commit/c1b5582ecafc4cdfe96481b305013850d9e13cb5))
- Dependency @xmcl/nbt bump **patch**
### @xmcl/world@1.0.8
#### Bug Fixes

- fix: use rollup to build and fix wrong import module ([c1b5582ecafc4cdfe96481b305013850d9e13cb5](https://github.com/voxelum/minecraft-launcher-core-node/commit/c1b5582ecafc4cdfe96481b305013850d9e13cb5))
- Dependency @xmcl/nbt bump **patch**
- Dependency @xmcl/system bump **patch**


## 2.4.1
### @xmcl/core@2.0.5
#### Bug Fixes

- fix: authlib-injector not correctly work ([d1b117a0cb36102151ead8bdb9d0ec66b1c94e5f](https://github.com/voxelum/minecraft-launcher-core-node/commit/d1b117a0cb36102151ead8bdb9d0ec66b1c94e5f))
### @xmcl/installer@2.4.1
#### Bug Fixes

- fix: use agent on curseforge query ([b7dc132c2223a9835dfec98328ab9ecf6e36ee6a](https://github.com/voxelum/minecraft-launcher-core-node/commit/b7dc132c2223a9835dfec98328ab9ecf6e36ee6a))
- fix: batch the query url for curseforge ([3d5e4079bfb9adbf0c1cc7a32899b35da7b1c4cb](https://github.com/voxelum/minecraft-launcher-core-node/commit/3d5e4079bfb9adbf0c1cc7a32899b35da7b1c4cb))
- fix: normalize the downloader option ([e18b5df61287b171c63382725851ef69bfd0bb75](https://github.com/voxelum/minecraft-launcher-core-node/commit/e18b5df61287b171c63382725851ef69bfd0bb75))
- Dependency @xmcl/core bump **patch**


## 2.4.0
### @xmcl/unzip@1.1.1
#### Bug Fixes

- fix: skip dir for lazy unzip ([e027bd4fe99d35008a88f07fb938bdd07f8423e7](https://github.com/voxelum/minecraft-launcher-core-node/commit/e027bd4fe99d35008a88f07fb938bdd07f8423e7))
### @xmcl/user@2.1.1
#### Bug Fixes

- fix: remove got ([a8702a16cb14b74b44cb24ef63fe83a99ad1c63b](https://github.com/voxelum/minecraft-launcher-core-node/commit/a8702a16cb14b74b44cb24ef63fe83a99ad1c63b))
### @xmcl/core@2.0.4
#### Bug Fixes

- fix: extract the resolveLibrary api ([1bc71ef4594af92d82bbd991c634ef19c67d430d](https://github.com/voxelum/minecraft-launcher-core-node/commit/1bc71ef4594af92d82bbd991c634ef19c67d430d))
- Dependency @xmcl/unzip bump **patch**
### @xmcl/installer@2.4.0
#### Features

- feat: install by installer profile function and refactor ([13dc9ba3b99d7e852fd0f0c9730660fb2578761d](https://github.com/voxelum/minecraft-launcher-core-node/commit/13dc9ba3b99d7e852fd0f0c9730660fb2578761d))
- feat: support fabric meta api ([b62d6586a9a4cec018dd83b4b96fefaa6e187fc4](https://github.com/voxelum/minecraft-launcher-core-node/commit/b62d6586a9a4cec018dd83b4b96fefaa6e187fc4))
- feat: library support concurrency ([5bd91fdd48ac7b77af5abbee8ebb719375e70b0e](https://github.com/voxelum/minecraft-launcher-core-node/commit/5bd91fdd48ac7b77af5abbee8ebb719375e70b0e))
#### Bug Fixes

- fix: wrong forge maven assigning ([74a931d4c3416a77ce5ac85a9b40f680c5ad6aef](https://github.com/voxelum/minecraft-launcher-core-node/commit/74a931d4c3416a77ce5ac85a9b40f680c5ad6aef))
- Dependency @xmcl/core bump **patch**
### @xmcl/system@1.0.7
- Dependency @xmcl/unzip bump **patch**
### @xmcl/mod-parser@2.0.3
- Dependency @xmcl/system bump **patch**
### @xmcl/resourcepack@1.0.8
- Dependency @xmcl/system bump **patch**
### @xmcl/model@1.0.8
- Dependency @xmcl/resourcepack bump **patch**
### @xmcl/resource-manager@1.0.8
- Dependency @xmcl/system bump **patch**
- Dependency @xmcl/resourcepack bump **patch**
### @xmcl/world@1.0.7
- Dependency @xmcl/system bump **patch**


## 2.3.3
### @xmcl/forge-site-parser@2.0.3
#### Bug Fixes

- fix: add doc and trigger build to release ([a7bd52614bcb094279c2cb043888edb9f32afe29](https://github.com/voxelum/minecraft-launcher-core-node/commit/a7bd52614bcb094279c2cb043888edb9f32afe29))
### @xmcl/installer@2.3.3
- Dependency @xmcl/forge-site-parser bump **patch**


## 2.3.2
### @xmcl/forge-site-parser@2.0.2
#### Bug Fixes

- fix: add doc and trigger build to release ([a7bd52614bcb094279c2cb043888edb9f32afe29](https://github.com/voxelum/minecraft-launcher-core-node/commit/a7bd52614bcb094279c2cb043888edb9f32afe29))
### @xmcl/installer@2.3.2
- Dependency @xmcl/forge-site-parser bump **patch**


## 2.3.1
### @xmcl/task@2.1.2
#### Bug Fixes

- fix(task): wrong entry point ([cd086fcc318c679a48576ca8ab7a4e25f1cda461](https://github.com/voxelum/minecraft-launcher-core-node/commit/cd086fcc318c679a48576ca8ab7a4e25f1cda461))
### @xmcl/installer@2.3.1
- Dependency @xmcl/task bump **patch**
### @xmcl/java-installer@0.1.3
- Dependency @xmcl/task bump **patch**


## 2.3.0
### @xmcl/unzip@1.1.0
#### Features

- feat: add option to hook and replace to extract ([907741f728584b2045b879344edd48e6d59deb84](https://github.com/voxelum/minecraft-launcher-core-node/commit/907741f728584b2045b879344edd48e6d59deb84))
### @xmcl/task@2.1.1
#### Bug Fixes

- fix(task): stupid uncaught error ([eafd11f0b9226b585c48f919d104ef346d17cc0d](https://github.com/voxelum/minecraft-launcher-core-node/commit/eafd11f0b9226b585c48f919d104ef346d17cc0d))
### @xmcl/core@2.0.3
#### Bug Fixes

- fix: wrong import from other packages ([e4716cbd8bebf03c1526018bed60e34aae3b64c5](https://github.com/voxelum/minecraft-launcher-core-node/commit/e4716cbd8bebf03c1526018bed60e34aae3b64c5))
- fix: make it compatible with older electron ([196f3dcaea53ddd8c7068eec6fdd09ac4336d678](https://github.com/voxelum/minecraft-launcher-core-node/commit/196f3dcaea53ddd8c7068eec6fdd09ac4336d678))
- fix: adapt to new unzip api ([24ad2801dcd3ff0c67aa294e965437f45f80597c](https://github.com/voxelum/minecraft-launcher-core-node/commit/24ad2801dcd3ff0c67aa294e965437f45f80597c))
- Dependency @xmcl/unzip bump **patch**
### @xmcl/installer@2.3.0
#### Features

- feat: forge support the downloader in option ([b499e28f2b1025bfe732498762ebbbd06b26ac6a](https://github.com/voxelum/minecraft-launcher-core-node/commit/b499e28f2b1025bfe732498762ebbbd06b26ac6a))
- feat: support install curseforge modpack ([b331f9636df4fa0ab626a8756f83647cf3b06cd7](https://github.com/voxelum/minecraft-launcher-core-node/commit/b331f9636df4fa0ab626a8756f83647cf3b06cd7))
- feat(installer): add flag to throw immediately ([e909fe6904cfea8fb2a682eecb8a16a6e6c71175](https://github.com/voxelum/minecraft-launcher-core-node/commit/e909fe6904cfea8fb2a682eecb8a16a6e6c71175))
#### Bug Fixes

- fix: wrong import from other packages ([e4716cbd8bebf03c1526018bed60e34aae3b64c5](https://github.com/voxelum/minecraft-launcher-core-node/commit/e4716cbd8bebf03c1526018bed60e34aae3b64c5))
- fix: simplify the default downloader ([a4699e6388dfcdee1521104e38c587ec8f433f6e](https://github.com/voxelum/minecraft-launcher-core-node/commit/a4699e6388dfcdee1521104e38c587ec8f433f6e))
- Dependency @xmcl/core bump **patch**
- Dependency @xmcl/task bump **patch**
### @xmcl/java-installer@0.1.2
#### Bug Fixes

- fix: make it compatible with older electron ([196f3dcaea53ddd8c7068eec6fdd09ac4336d678](https://github.com/voxelum/minecraft-launcher-core-node/commit/196f3dcaea53ddd8c7068eec6fdd09ac4336d678))
- Dependency @xmcl/task bump **patch**
### @xmcl/system@1.0.6
- Dependency @xmcl/unzip bump **patch**
### @xmcl/mod-parser@2.0.2
- Dependency @xmcl/system bump **patch**
### @xmcl/resourcepack@1.0.7
- Dependency @xmcl/system bump **patch**
### @xmcl/model@1.0.7
- Dependency @xmcl/resourcepack bump **patch**
### @xmcl/resource-manager@1.0.7
- Dependency @xmcl/system bump **patch**
- Dependency @xmcl/resourcepack bump **patch**
### @xmcl/world@1.0.6
- Dependency @xmcl/system bump **patch**


## 2.2.2
### @xmcl/installer@2.2.3
#### Bug Fixes

- fix: wrong track for download chunk size ([11803bb0caf9e3b4f1a36f75b28069b8c5255920](https://github.com/voxelum/minecraft-launcher-core-node/commit/11803bb0caf9e3b4f1a36f75b28069b8c5255920))


## 2.2.1
### @xmcl/installer@2.2.2
#### Bug Fixes

- fix: (interal breaking change) add chunkLength for download ([dab5c65950386820a48b245023646b65f9fcb21a](https://github.com/voxelum/minecraft-launcher-core-node/commit/dab5c65950386820a48b245023646b65f9fcb21a))


## 2.2.0
### @xmcl/task@2.1.0
#### Features

- feat(task): support parent/child progress propagation ([261d4f2b0949193cb6d96e45f736780ab0f13215](https://github.com/voxelum/minecraft-launcher-core-node/commit/261d4f2b0949193cb6d96e45f736780ab0f13215))
### @xmcl/installer@2.2.1
#### Bug Fixes

- fix(installer): support progress for more tasks ([d8225b622754893af603da12fae3c78585061288](https://github.com/voxelum/minecraft-launcher-core-node/commit/d8225b622754893af603da12fae3c78585061288))
- Dependency @xmcl/task bump **patch**
### @xmcl/java-installer@0.1.1
- Dependency @xmcl/task bump **patch**


## 2.1.0
### @xmcl/installer@2.2.0
#### Features

- feat: add option to control concurrency and add keepalive agent (#84) ([c20904e52732cba3a0f947b20739990da05a86ab](https://github.com/voxelum/minecraft-launcher-core-node/commit/c20904e52732cba3a0f947b20739990da05a86ab))
### @xmcl/java-installer@0.1.0
#### Features

- feat: add option to control concurrency and add keepalive agent (#84) ([c20904e52732cba3a0f947b20739990da05a86ab](https://github.com/voxelum/minecraft-launcher-core-node/commit/c20904e52732cba3a0f947b20739990da05a86ab))
### @xmcl/user@2.1.0
#### Features

- feat: add option to control concurrency and add keepalive agent (#84) ([c20904e52732cba3a0f947b20739990da05a86ab](https://github.com/voxelum/minecraft-launcher-core-node/commit/c20904e52732cba3a0f947b20739990da05a86ab))


## 2.0.1
### @xmcl/text-component@2.1.0
#### Features

- feat: use style object instead of stream to release ([f2c5d951c6f6752801afc9bb79c5d9804d3d735a](https://github.com/voxelum/minecraft-launcher-core-node/commit/f2c5d951c6f6752801afc9bb79c5d9804d3d735a))
### @xmcl/core@2.0.2
#### Bug Fixes

- fix: the wrong native metadata ([8789ca204cd895d612c743566b5b9792f3d42bdb](https://github.com/voxelum/minecraft-launcher-core-node/commit/8789ca204cd895d612c743566b5b9792f3d42bdb))
- fix: support 1.15 launch log ([112188a084b3a337bf9a706954386d7b779ade2f](https://github.com/voxelum/minecraft-launcher-core-node/commit/112188a084b3a337bf9a706954386d7b779ade2f))
- fix: make undefined bypass ([36d086752c5256aa39a033ec1e5d233912adc051](https://github.com/voxelum/minecraft-launcher-core-node/commit/36d086752c5256aa39a033ec1e5d233912adc051))
### @xmcl/client@2.0.2
- Dependency @xmcl/text-component bump **patch**
### @xmcl/installer@2.1.0
#### Features

- feat: extract the downloader strategy ([b9cdcccb6e59205c4dd89bd2fb241188f4798827](https://github.com/voxelum/minecraft-launcher-core-node/commit/b9cdcccb6e59205c4dd89bd2fb241188f4798827))
#### Bug Fixes

- fix: support listen total library progress ([bdb238a5cf567dae1852b1d2543e2492cd3d1cd1](https://github.com/voxelum/minecraft-launcher-core-node/commit/bdb238a5cf567dae1852b1d2543e2492cd3d1cd1))
- fix: minimize the required version ([9aa4cef104976adfa4a9236737d9da9c20cc4dac](https://github.com/voxelum/minecraft-launcher-core-node/commit/9aa4cef104976adfa4a9236737d9da9c20cc4dac))
- fix: not force install provide full info ([27023065e31404b149cd34c928a1a3ec68dd6d89](https://github.com/voxelum/minecraft-launcher-core-node/commit/27023065e31404b149cd34c928a1a3ec68dd6d89))
- fix: extract the default downloader ([6146bf80e4950a57d809dcf12a5633f569b4dcfd](https://github.com/voxelum/minecraft-launcher-core-node/commit/6146bf80e4950a57d809dcf12a5633f569b4dcfd))
- Dependency @xmcl/core bump **patch**


## 2.0.0
### @xmcl/client@2.0.1
#### Bug Fixes

- fix(client): fetch server status return wrong value (#77) ([e51a2bd32ee9b22f04093e1cf4983e85b782a96c](https://github.com/voxelum/minecraft-launcher-core-node/commit/e51a2bd32ee9b22f04093e1cf4983e85b782a96c))
### @xmcl/core@2.0.1
#### Bug Fixes

- fix: remove the deprecated field ([09c942bf9b72018595bfb4b98561eeb82dea49a1](https://github.com/voxelum/minecraft-launcher-core-node/commit/09c942bf9b72018595bfb4b98561eeb82dea49a1))
- fix(launch): fix the launch natives check (#76) ([8e959d9efe271f22da8b69f0019f9cb25df1dfa6](https://github.com/voxelum/minecraft-launcher-core-node/commit/8e959d9efe271f22da8b69f0019f9cb25df1dfa6))
- fix(launch): fix cannot launch on shell mode ([2f75478082c57ddb00d160229dbc77f55dbef63b](https://github.com/voxelum/minecraft-launcher-core-node/commit/2f75478082c57ddb00d160229dbc77f55dbef63b))
### @xmcl/mod-parser@2.0.1
#### Bug Fixes

- fix: strip bom whenever json.parse ([e3233a94274f256f940dab346d8cb8ba805d123d](https://github.com/voxelum/minecraft-launcher-core-node/commit/e3233a94274f256f940dab346d8cb8ba805d123d))
### @xmcl/resourcepack@1.0.6
#### Bug Fixes

- fix: strip bom whenever json.parse ([e3233a94274f256f940dab346d8cb8ba805d123d](https://github.com/voxelum/minecraft-launcher-core-node/commit/e3233a94274f256f940dab346d8cb8ba805d123d))
### @xmcl/user@2.0.1
#### Bug Fixes

- fix: align the doc and user id of offline ([63560a0d71d743d5413b2096788fb3042b9dd511](https://github.com/voxelum/minecraft-launcher-core-node/commit/63560a0d71d743d5413b2096788fb3042b9dd511))
### @xmcl/installer@2.0.2
#### Bug Fixes

- fix: remove the deprecated field ([09c942bf9b72018595bfb4b98561eeb82dea49a1](https://github.com/voxelum/minecraft-launcher-core-node/commit/09c942bf9b72018595bfb4b98561eeb82dea49a1))
- Dependency @xmcl/core bump **patch**
### @xmcl/model@1.0.6
- Dependency @xmcl/resourcepack bump **patch**
### @xmcl/resource-manager@1.0.6
- Dependency @xmcl/resourcepack bump **patch**

