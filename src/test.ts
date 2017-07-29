import { Version } from './version';
import './download'
import { MinecraftFolder } from './file_struct';
import { Launcher } from './launch'
import { AuthService } from './auth'

const folder = new MinecraftFolder('C:/Users/CIJhn/AppData/Roaming/.launcher')
Version.parse(folder, '1.9.4').then((ver) => {
    return Version.checkDependency(ver, folder, { checksum: true })
}).then(ver => {
    return Launcher.launch(AuthService.offlineAuth('ci010'), {
        javaPath: 'C:/Program Files/Java/jre1.8.0_91/bin/javaw.exe',
        resourcePath: "C:/Users/CIJhn/AppData/Roaming/.launcher",
        gamePath: 'C:/Users/CIJhn/AppData/Roaming/.launcher/profiles/1486147016881',
        minMemory: 1024,
        version: ver.version
    }).then(proc => {
        proc.stdout.on('data', (s) => console.log(s))
    })
        .catch(err => {
            console.log(err)
        })
})