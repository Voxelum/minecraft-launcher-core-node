import * as ygg from './yggdrasil'
import * as auth from './auth'
import * as game from './game'
import * as launch from './launch'
import * as nbt from './nbt'
import * as text from './text'
import * as version from './version'
import * as mc from './file_struct'

// let a = auth.Authorizer.offlineAuth('ci010')
// let v = version.parseVersion('C:/Users/cijhn/AppData/Roaming/.minecraft', '1.12')
// if (v) {
//     let location = new mc.MinecraftLocation('C:/Users/cijhn/AppData/Roaming/.minecraft')
//     let child = launch.Launcher.launch(a, {
//         gamePath: 'C:/Users/cijhn/AppData/Roaming/.minecraft',
//         javaPath: 'C:/Program Files/Java/jdk1.8.0_131/bin/javaw.exe',
//         version: v,
//         minMemory: 1024
//     })
// }

// import * as fs from 'fs'
// import * as path from 'path'
// let map = 'C:/Users/CIJhn/Workspace/Output/Standard/.minecraft/saves/We_Are_The_Ranger_Map_MC1.9V2'
// let level = path.join(map, 'level.dat')
// fs.readFile(level, (e, d) => {
//     let info = game.WorldInfo.read(d)
//     console.log(info)
// })

game.Language.exportLanguages(new mc.MinecraftLocation('C:/Users/CIJhn/Workspace/Output/Standard/.minecraft'),
    '1.8', (lang, e) => {
        console.log(e)
        console.log(lang)
    })

