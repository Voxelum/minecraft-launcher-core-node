import * as assert from "assert";
import { Version } from "..";
import { MinecraftFolder } from "../libs/utils/folder";


describe("Version", function () {
    it("should be able to mixin the version string", () => {
        // tslint:disable:max-line-length
        const s = Version.mixinArgumentString("--tweakClass com.mumfrey.liteloader.launch.LiteLoaderTweaker --username ${auth_player_name} --version ${version_name} --gameDir ${game_directory} --assetsDir ${assets_root} --assetIndex ${assets_index_name} --uuid ${auth_uuid} --accessToken ${auth_access_token} --userType ${user_type} --versionType ${version_type}", "--tweakClass com.mumfrey.liteloader.launch.LiteLoaderTweaker --username ${auth_player_name} --version ${version_name} --gameDir ${game_directory} --assetsDir ${assets_root} --assetIndex ${assets_index_name} --uuid ${auth_uuid} --accessToken ${auth_access_token} --userType ${user_type} --tweakClass net.minecraftforge.fml.common.launcher.FMLTweaker --versionType Forge");
        assert.equal(s, "--tweakClass com.mumfrey.liteloader.launch.LiteLoaderTweaker --tweakClass net.minecraftforge.fml.common.launcher.FMLTweaker --username ${auth_player_name} --version ${version_name} --gameDir ${game_directory} --assetsDir ${assets_root} --assetIndex ${assets_index_name} --uuid ${auth_uuid} --accessToken ${auth_access_token} --userType ${user_type} --versionType ${version_type}");
    });
    it("should be able to extends the version", async function () {
        const ver = await Version.parse(this.gameDirectory, "1.12.2-Liteloader1.12.2-1.12.2-SNAPSHOT");
        const ver2 = await Version.parse(this.gameDirectory, "1.12.2-forge1.12.2-14.23.5.2823");

        const out = Version.extendsVersion("test", ver, ver2);
        assert(out);
    });

    it("should be able to parse version chain", async function () {
        const ver = await Version.parse(this.gameDirectory, "1.12.2-Liteloader1.12.2-1.12.2-SNAPSHOT");
        assert(ver);
        assert(ver.pathChain);
        const mc = new MinecraftFolder(this.gameDirectory);
        assert.equal(ver.pathChain.length, 2);
        assert.equal(ver.pathChain[0], mc.getVersionRoot("1.12.2-Liteloader1.12.2-1.12.2-SNAPSHOT"));
        assert.equal(ver.pathChain[1], mc.getVersionRoot("1.12.2"));
    });
});
