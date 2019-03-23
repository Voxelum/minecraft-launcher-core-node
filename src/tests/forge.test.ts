import * as assert from "assert";
import { Forge, ForgeWebPage } from "..";

describe("Forge", () => {
    describe("Webpage", function () {
        it("should get the webpage infomation", async () => {
            const page = await ForgeWebPage.getWebPage();
            assert(page);

            const vers = new Set<string>();
            for (const v of page.versions) {
                assert(v.changelog);
                assert(v.universal);
                assert(v.mdk);
                assert(v.installer);
                assert.equal(page.mcversion, v.mcversion);
                if (vers.has(v.version)) { throw new Error("Should not have duplicated version"); }
                vers.add(v.version);
            }
        }).timeout(100000);

        it("should not fetch duplicate forge version", async () => {
            const first = await ForgeWebPage.getWebPage();
            const sec = await ForgeWebPage.getWebPage({ fallback: first });

            assert.equal(first.timestamp, sec.timestamp);
        }).timeout(100000);
    });

    it("should read exactly things in jar", async function() {
        const metadata = await Forge.readModMetaData(`${this.assets}/sample-mod.jar`);
        assert.equal(metadata.length, 3);
    });

    it("should read mcmod.info in jar", async function() {
        const metadata = await Forge.readModMetaData(`${this.assets}/sample-mod.jar`);
        assert.equal(metadata[0].modid, "soundfilters");
        assert.equal(metadata[0].name, "Sound Filters");
        assert.equal(metadata[0].description, "Adds reveb to caves, as well as muted sounds underwater/in lava, and behind walls.");
        assert.equal(metadata[0].version, "0.8_for_1,8");
        assert.equal(metadata[0].mcversion, "1.8");
        assert.equal(metadata[0].credits, "Made by Tmtravlr.");
    });

    it("should read @Mod in jar", async function() {
        const metadata = await Forge.readModMetaData(`${this.assets}/sample-mod.jar`);
        assert.equal(metadata[2].modid, "NuclearCraft");
        assert.equal(metadata[2].version, "1.9e");
    });


    it("should detect optifine from class in jar", async function() {
        const metadata = await Forge.readModMetaData(`${this.assets}/sample-mod.jar`);
        assert.equal(metadata[1].modid, "OptiFine");
        assert.equal(metadata[1].name, "OptiFine");
        assert.equal(metadata[1].description, "OptiFine is a Minecraft optimization mod. It allows Minecraft to run faster and look better with full support for HD textures and many configuration options.");
        assert.equal(metadata[1].version, "HD_U_C5");
        assert.equal(metadata[1].mcversion, "1.12.1");
        assert.equal(metadata[1].url, "https://optifine.net");
    });



    describe("Config", () => {
        const cfg1 = `
    # Configuration file

    tweaks {
        # Replace the FML test config GUI with a working GUI.
        B:replaceInGameConfig=true
    }


    versioncheck {
        # Should the mod check for updates?
        B:checkForUpdates=true

        # A list of known updates. Deleting versions from the list will remind you about them again.
        S:knownVersions <
            InGameInfoXML 2.8.1.82
            LunatriusCore 1.1.2.21
         >

        # Should the mod remind you only for new updates (once per version)?
        B:silenceKnownUpdates=false
    }
    `;
        let config: Forge.Config;
        it("forge config parsing", () => {
            config = Forge.Config.parse(cfg1);
        });
        it("forge config categories parsing", () => {
            assert(config.versioncheck);
            assert(config.tweaks);
        });
        it("forge config property parsing", () => {
            assert.equal(config.tweaks.properties[0].name, "replaceInGameConfig");
            assert.equal(config.tweaks.properties[0].comment, "Replace the FML test config GUI with a working GUI.");
            assert.equal(config.tweaks.properties[0].type, "B");
        });
        it("forge config multiple properties parsing", () => {
            assert.equal(config.versioncheck.properties[0].name, "checkForUpdates");
            assert.equal(config.versioncheck.properties[1].name, "knownVersions");
            assert.equal(config.versioncheck.properties[1].value[0], "InGameInfoXML 2.8.1.82");
            assert.equal(config.versioncheck.properties[1].value[1], "LunatriusCore 1.1.2.21");
            assert.equal(config.versioncheck.properties[2].name, "silenceKnownUpdates");
            assert.equal(config.versioncheck.properties[0].type, "B");
            assert.equal(config.versioncheck.properties[1].type, "S");
            assert.equal(config.versioncheck.properties[2].type, "B");
        });
    });
});
