import { MojangRepository, VersionMetaList } from './download'

// let r = new MojangRepository()
// r.fetchVersionList()

import { resolveDependency, Version } from './version';

import { Language } from './game';

// Language.exportLanguagesS('', '')
//TODO test this

import * as https from 'https'
import { GET, DOWN } from './string_utils';
import { MinecraftLocation } from './file_struct';

// let re = new MojangRepository()
// let loc = new MinecraftLocation(__dirname + '/' + '.minecraft')

// async function down() {
//     let ls: VersionMetaList = await re.fetchVersionList()
//     let v = ls.versions.filter(v => v.id == ls.latest.release)[0]
//     let inst = await re.downloadVersion(v, loc)
//     await re.downloadLibraries(inst, loc)
//     await re.downloadAssets(inst, loc)
// }
// down()

DOWN('http://files.minecraftforge.net/maven/jline/jline/2.13/jline-2.13.jar', './test.jar')
    .then(r => console.log('done'))