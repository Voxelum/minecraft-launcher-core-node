import { Version } from "..";
import * as assert from 'assert'

describe('Version', () => {
    it('should be able to mixin the version string', () => {
        const s = Version.mixinArgumentString('--tweakClass com.mumfrey.liteloader.launch.LiteLoaderTweaker --username ${auth_player_name} --version ${version_name} --gameDir ${game_directory} --assetsDir ${assets_root} --assetIndex ${assets_index_name} --uuid ${auth_uuid} --accessToken ${auth_access_token} --userType ${user_type} --versionType ${version_type}', '--tweakClass com.mumfrey.liteloader.launch.LiteLoaderTweaker --username ${auth_player_name} --version ${version_name} --gameDir ${game_directory} --assetsDir ${assets_root} --assetIndex ${assets_index_name} --uuid ${auth_uuid} --accessToken ${auth_access_token} --userType ${user_type} --tweakClass net.minecraftforge.fml.common.launcher.FMLTweaker --versionType Forge')
        assert.equal(s, '--tweakClass com.mumfrey.liteloader.launch.LiteLoaderTweaker --tweakClass net.minecraftforge.fml.common.launcher.FMLTweaker --username ${auth_player_name} --version ${version_name} --gameDir ${game_directory} --assetsDir ${assets_root} --assetIndex ${assets_index_name} --uuid ${auth_uuid} --accessToken ${auth_access_token} --userType ${user_type} --versionType ${version_type}')
    })
    it('should be able to mixin the version', async () => {
        const ver = await Version.parse('./assets/temp', '1.12.2')
        console.log(ver)
        //     Version.mixinVersion('test', {
        //         mainClass: 'PARENT.MAIN',
        //         arguments: {

        //         },
        //         id: 'parent',
        //         libraries: [],
        //         downloads: { client: '' }
        //     })
        // })
    })
})
