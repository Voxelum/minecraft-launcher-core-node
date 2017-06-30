import { MojangRepository, VersionMetaList } from './download'

// let r = new MojangRepository()
// r.fetchVersionList()

import { resolveDependencyAsync, Version } from './version';

import { Language } from './game'

// Language.exportLanguagesS('', '')
//TODO test this

import * as https from 'https'
import { GET } from './string_utils'
import { MinecraftLocation } from './file_struct';

let re = new MojangRepository()
let loc = new MinecraftLocation('D:/t-hox/Desktop/test')
let v = Version.parse(loc.root, '1.12')
if (v)
    re.downloadVersionJar('server', v, loc)