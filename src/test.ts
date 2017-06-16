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

import {ServerInfo} from './game' 
let s = 'C:/Users/cijhn/AppData/Roaming/.minecraft/servers.dat'
import * as fs from 'fs'
let buf = fs.readFileSync(s)
let read = nbt.NBT.read(buf)
if (read) {
    let arr: ServerInfo[] = read.root.servers
    console.log(arr)
}
// const NBT = nbt.NBT
// let obj = {
//     test: NBT.Type.String,
//     int: NBT.Type.Int,
//     intArray: NBT.Type.IntArray,
//     constomType: {
//         propA: NBT.Type.Int
//     },
//     type: 'ServerInfo'
// }

// let abuf = new ArrayBuffer(3)
// import * as ByteBuffer from 'bytebuffer'
// let bb = ByteBuffer.allocate(2)
// bb.writeByte(1)
// console.log(bb)
// bb.writeByte(2)
// bb.writeByte(3)
// bb.writeByte(4)
// bb.writeByte(5)
// console.log(bb)