import * as path from "path";
import { readFabricMod } from "./fabric";

declare const mockDir: string;

describe("Fabric", () => {

    describe("#readFabricMod", () => {
        it("should read the simple fabric json", async () => {
            const mod = await readFabricMod(path.join(mockDir, "mods", "fabric-sample.jar"));
            expect(mod).toBeTruthy();
            expect(mod).toEqual({
                schemaVersion: 1,
                id: "appleskin",
                version: "1.0.8",
                name: "AppleSkin",
                description: "Adds various food-related HUD improvements",
                authors: ["squeek502"],
                contact:
                {
                    sources: "https://github.com/squeek502/AppleSkin",
                    homepage: "https://minecraft.curseforge.com/projects/appleskin",
                    issues: "https://github.com/squeek502/AppleSkin/issues"
                },
                license: "Unlicense",
                icon: "assets/appleskin/appleskin.png",
                environment: "*",
                entrypoints: { client: ["squeek.appleskin.AppleSkin"] },
                mixins: ["appleskin.mixins.json"],
                depends: { fabricloader: ">=0.4.0", fabric: "*" }
            });
        });
    })
});
