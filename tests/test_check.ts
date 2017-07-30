import { Version } from '../src/version';
import { MinecraftFolder } from '../src/file_struct';
// describe('tes', () => {
//     it('should check', (done) => {
//         Version.parse('C:/Users/CIJhn/AppData/Roaming/.launcher', '1.12')
//             .then(version => {
//                 return Version.checkDependency(version,
//                     new MinecraftFolder('C:/Users/CIJhn/AppData/Roaming/.launcher'),
//                     { checksum: false })
//             }).then(() => {
//                 done()
//             }).catch((err) => {
//                 console.warn(err)
//                 done()
//             })
//     }).timeout(1000000)
// })