import * as path from "path";
import { readModMetaData } from "./fabric";

describe("Fabric", () => {
    const root = path.join(__dirname, "..", "..", "temp");
    const mockRoot = path.join(__dirname, "..", "..", "mock");

    test("#readModMetadata", async () => {
        const mod = await readModMetaData(path.join(mockRoot, "mods", "fabric-sample.jar"));
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
});
