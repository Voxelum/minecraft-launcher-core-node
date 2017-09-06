import { WorldInfo, ProfileService, GameProfile } from "./index";

// ProfileService.fetch('abf81fe99f0d4948a9097721a8198ac4').then(s => {
//     let t = GameProfile.getTextures(s)
//     if (t) console.log(t.textures)
// })

import * as url from 'url'

;ProfileService.lookup('ci010').then(s => {
    console.log('good')
    console.log(s)
}).catch(e => {
    console.log(e)
})

// import * as fs from 'fs-extra'

// console.log(WorldInfo.parse(fs.readFileSync('./tests/assets/sample-map/level.dat')))