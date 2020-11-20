import { existsSync, statSync, rmdirSync, unlinkSync, readdirSync } from "fs";
import { resolve, join, normalize } from "path";
import { installCurseforgeModpack } from ".";
import nock from "nock";

const root = normalize(join(__dirname, "..", "..", "temp"));
const mockRoot = normalize(join(__dirname, "..", "..", "mock"));

function remove(f: string) {
    try {
        const stats = statSync(f);
        if (stats.isDirectory()) {
            const children = readdirSync(f);
            children.map((child) => remove(resolve(f, child)))
            rmdirSync(f);
        } else {
            unlinkSync(f);
        }
    } catch {

    }
}

describe("CurseforgeInstaller", () => {
    describe("#install", () => {
        jest.setTimeout(1000000);
        test("should be able to install curseforge", async () => {

            let dest = join(root, "modpack-test-root");
            remove(dest);
            nock.cleanAll();
            nock.restore();
            const manifest = await installCurseforgeModpack(join(mockRoot, "modpack.zip"), dest, {});
            expect(existsSync(join(dest, "mods", "# LibLoader.jar"))).toBeTruthy();
            expect(existsSync(join(dest, "mods", "jei_1.12.2-4.15.0.291.jar"))).toBeTruthy();
            expect(existsSync(join(dest, "mods", "RealisticTorches-1.12.2-2.1.1.jar"))).toBeTruthy();
            expect(existsSync(join(dest, "resources", "minecraft", "textures", "gui", "options_background.png"))).toBeTruthy();
            expect(manifest).toEqual({
                "author": "Shivaxi",
                "files": [
                    {
                        "fileID": 2803400,
                        "projectID": 238222,
                        "required": true,
                    },
                    {
                        "fileID": 2520544,
                        "projectID": 235729,
                        "required": true,
                    },
                ],
                "manifestType": "minecraftModpack",
                "manifestVersion": 1,
                "minecraft": {
                    "modLoaders": [
                        {
                            "id": "forge-14.23.5.2838",
                            "primary": true,
                        },
                    ],
                    "version": "1.12.2",
                },
                "name": "RLCraft",
                "overrides": "overrides",
                "version": "v2.8.1",
            });
        });
    });
});
