import { ProfileService, GameProfile } from './src/profile';

ProfileService.fetchGameProfile('abf81fe99f0d4948a9097721a8198ac4').then(s => {
    let t = GameProfile.getTexture(s)
    if (t) console.log(t.textures)
})