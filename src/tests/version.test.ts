import * as assert from "assert";
import { Version } from "..";


describe("Version", function () {
    it("should be able to mixin the version string", () => {
        // tslint:disable:max-line-length
        const s = Version.mixinArgumentString("--tweakClass com.mumfrey.liteloader.launch.LiteLoaderTweaker --username ${auth_player_name} --version ${version_name} --gameDir ${game_directory} --assetsDir ${assets_root} --assetIndex ${assets_index_name} --uuid ${auth_uuid} --accessToken ${auth_access_token} --userType ${user_type} --versionType ${version_type}", "--tweakClass com.mumfrey.liteloader.launch.LiteLoaderTweaker --username ${auth_player_name} --version ${version_name} --gameDir ${game_directory} --assetsDir ${assets_root} --assetIndex ${assets_index_name} --uuid ${auth_uuid} --accessToken ${auth_access_token} --userType ${user_type} --tweakClass net.minecraftforge.fml.common.launcher.FMLTweaker --versionType Forge");
        assert.equal(s, "--tweakClass com.mumfrey.liteloader.launch.LiteLoaderTweaker --tweakClass net.minecraftforge.fml.common.launcher.FMLTweaker --username ${auth_player_name} --version ${version_name} --gameDir ${game_directory} --assetsDir ${assets_root} --assetIndex ${assets_index_name} --uuid ${auth_uuid} --accessToken ${auth_access_token} --userType ${user_type} --versionType ${version_type}");
    });
    it("should be able to mixin the version", async function () {
        const ver = await Version.parse(this.gameDirectory, "1.12.2-Liteloader1.12.2-1.12.2-SNAPSHOT");
        const ver2 = await Version.parse(this.gameDirectory, "1.12.2-forge1.12.2-14.23.2.2611");

        const out = Version.extendsVersion("test", ver, ver2);
        assert(out);
    });
});
