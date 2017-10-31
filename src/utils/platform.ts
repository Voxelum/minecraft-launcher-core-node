import * as os from 'os'

let platform = os.platform()
let osName: string = 'unknown'
switch (platform) {
    case 'darwin':
        osName = 'osx'
        break
    case 'linux':
        osName = 'linux'
        break
    case 'win32':
        osName = 'windows'
        break
}

export default {
    name: osName,
    version: os.release(),
    arch: platform
}
