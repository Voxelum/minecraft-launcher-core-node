import { Version } from './version';
import './download'
import { MinecraftFolder } from './file_struct';

const folder = new MinecraftFolder('C:/Users/CIJhn/AppData/Roaming/.launcher')
Version.parse(folder, '1.9.4').then((ver) => {
    return Version.checkDependency(ver, folder, { checksum: true }).catch(err => {
        console.log(err)
    })
}).catch(err => {
    console.log(err)
})