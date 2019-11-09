import * as path from "path";
import { Forge } from "./index";

describe("Forge", () => {
    const root = path.normalize(path.join(__dirname, "..", "..", "mock"));

    test("should read exactly things in jar", async () => {
        const metadata = await Forge.readModMetaData(`${root}/mods/sample-mod.jar`);
        expect(metadata.length).toEqual(3);
    });

    test("should read mcmod.info in jar", async () => {
        const metadata = await Forge.readModMetaData(`${root}/mods/sample-mod.jar`);
        expect(metadata.some((m) =>
            m.modid === "soundfilters" &&
            m.name === "Sound Filters" &&
            m.description === "Adds reveb to caves, as well as muted sounds underwater/in lava, and behind walls." &&
            m.version === "0.8_for_1,8" &&
            m.mcversion === "1.8" &&
            m.credits === "Made by Tmtravlr.",
        )).toBeTruthy();
    });

    test("should read @Mod in jar", async () => {
        const metadata = await Forge.readModMetaData(`${root}/mods/sample-mod.jar`);
        expect(metadata.some((m) => m.modid === "NuclearCraft" && m.version === "1.9e"))
            .toBeTruthy();
    });


    test("should detect optifine from class in jar", async () => {
        const metadata = await Forge.readModMetaData(`${root}/mods/sample-mod.jar`);
        expect(metadata.some((m) =>
            m.modid === "OptiFine" &&
            m.name === "OptiFine" &&
            m.description === "OptiFine is a Minecraft optimization mod. It allows Minecraft to run faster and look better with full support for HD textures and many configuration options." &&
            m.version === "HD_U_C5" &&
            m.mcversion === "1.12.1" &&
            m.url === "https://optifine.net",
        )).toBeTruthy();
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
        test("forge config parsing", () => {
            config = Forge.Config.parse(cfg1);
        });
        test("forge config categories parsing", () => {
            expect(config.versioncheck).toBeTruthy();
            expect(config.tweaks).toBeTruthy();
        });
        test("forge config property parsing", () => {
            expect(config.tweaks.properties[0].name).toEqual("replaceInGameConfig");
            expect(config.tweaks.properties[0].comment).toEqual("Replace the FML test config GUI with a working GUI.");
            expect(config.tweaks.properties[0].type).toEqual("B");
        });
        test("forge config multiple properties parsing", () => {
            expect(config.versioncheck.properties[0].name).toEqual("checkForUpdates");
            expect(config.versioncheck.properties[1].name).toEqual("knownVersions");
            expect(config.versioncheck.properties[1].value[0]).toEqual("InGameInfoXML 2.8.1.82");
            expect(config.versioncheck.properties[1].value[1]).toEqual("LunatriusCore 1.1.2.21");
            expect(config.versioncheck.properties[2].name).toEqual("silenceKnownUpdates");
            expect(config.versioncheck.properties[0].type).toEqual("B");
            expect(config.versioncheck.properties[1].type).toEqual("S");
            expect(config.versioncheck.properties[2].type).toEqual("B");
        });
    });
});
