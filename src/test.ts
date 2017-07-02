
// let loc = new MinecraftLocation(__dirname + '/' + '.minecraft')

// async function down() {
//     let ls: VersionMetaList = await re.fetchVersionList()
//     let v = ls.versions.filter(v => v.id == ls.latest.release)[0]
//     let inst = await re.downloadVersion(v, loc)
//     await re.downloadLibraries(inst, loc)
//     await re.downloadAssets(inst, loc)
// }
// down()

// DOWN('http://files.minecraftforge.net/maven/jline/jline/2.13/jline-2.13.jar', './test.jar')
//     .then(r => console.log('done'))

import { ForgeVersionMetaList, ForgeVersionMeta } from './forge_download';
import * as semver from 'semver'

function regular(version: string) {
    let [ver, patch] = version.split('-')
    let arr = ver.split('.')
    if (arr.length == 2)
        arr.push('0')
    return arr.join('.') + '-' + patch
}
let s = regular('1.12-pas')
console.log(s)
// ForgeVersionMetaList.update().then(result => {
//     let list: Array<any> = new Array

//     console.log(result.list.promos)
//     for (let k in result.list.promos)
//         list.push([k, result.list.promos[k]])
//     list.sort((a, b) => {
//         let s1: string = a[0]
//         let s2: string = b[0]
//         return semver.compare(s1, s2)
//     })
//     console.log(list)
// })
