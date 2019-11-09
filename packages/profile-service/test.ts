import assert from "assert";
import { ChildProcess, spawn } from "child_process";
import * as path from "path";
import { GameProfile, ProfileService } from "./index";

function sleep(time: number) {
    return new Promise<void>((resolve, reject) => {
        setTimeout(() => { resolve(); }, time);
    });
}

describe("ProfileService", () => {
    let proc: ChildProcess;
    const MOCK: ProfileService.API = {
        texture: "http://localhost:25566/user/profile/${uuid}/${type}",
        profile: "http://localhost:25566/sessionserver/session/minecraft/profile/${uuid}",
        profileByName: "http://localhost:25566/api/profiles/minecraft/${name}",
    };
    const RATE = 1000;
    const WAIT = 1500;
    const root = path.normalize(path.join(__dirname, "..", "..", "mock"));

    beforeAll(async function () {
        jest.setTimeout(100000);
        try {
            await new Promise((resolve, reject) => {
                proc = spawn("java", ["-jar", path.join(root, "yggdrasil-mock-server-0.0.1-SNAPSHOT.jar")]);
                proc.stdout.on("data", (b) => {
                    // console.log(b.toString());
                    if (b.toString().indexOf("moe.yushi.yggdrasil.mockserver.Main") !== -1 &&
                        b.toString().indexOf("Started Main") !== -1) {
                        resolve();
                    }
                });
            });
        } catch (e) {
            console.error("Cannot start the yggdrasil mock server!");
            console.error(e);
            describe = describe.skip;
        }
        await sleep(1000);
    });
    afterAll(() => { proc.kill(); });
    afterEach(() => sleep(RATE));

    describe("#lookup", () => {
        test("should fetch profile by name", async () => {
            // this.slow(RATE + WAIT);
            const [s] = await ProfileService.lookUpAll(["character1"], { api: MOCK });
            assert(s);
            if (s) {
                expect(s.name).toBe("character1");
                expect(s.id).toBe("00000000000000000000000000000000");
            }
        });
        test("should return undefined if profile doesn't exist", async () => {
            // this.slow(RATE + WAIT);
            const [a, b] = await ProfileService.lookUpAll(["character1", "characterX"], { api: MOCK });
            expect(a).toBeTruthy();
            expect(b).toBeUndefined();
        });
    });

    describe("#fetch", () => {
        let profilePromise: Promise<GameProfile>;
        beforeAll(() => {
            profilePromise = ProfileService.fetch("00000000000000000000000000000000", { api: MOCK });
        });
        test("should fetch the correct username and uuid", async () => {
            const s = await profilePromise;
            expect(s.name).toBe("character1");
            expect(s.id).toBe("00000000000000000000000000000000");
        });
        test("the game profile properties should be correct format", async () => {
            const s = await profilePromise;
            for (const key in s.properties) {
                expect(typeof key === "string").toBeTruthy();
                expect(typeof s.properties[key] === "string").toBeTruthy();
            }
        });
        test("should catch error if the profile doesn't exists", async () => {
            await expect(ProfileService.fetch("asd", { api: MOCK }))
                .rejects
                .toBeTruthy();
        });
    });

    describe("#getTextures", () => {
        const profile = {
            id: "abf81fe99f0d4948a9097721a8198ac4",
            name: "CI010",
            properties: { textures: "eyJ0aW1lc3RhbXAiOjE1NDEzODY0MzI2OTksInByb2ZpbGVJZCI6ImFiZjgxZmU5OWYwZDQ5NDhhOTA5NzcyMWE4MTk4YWM0IiwicHJvZmlsZU5hbWUiOiJDSTAxMCIsInNpZ25hdHVyZVJlcXVpcmVkIjp0cnVlLCJ0ZXh0dXJlcyI6eyJTS0lOIjp7InVybCI6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvZGYwMzE0NzJmYjg3MjgyNjA4MjdjMTY2NzA2ZTJiYTI0YTBmYzlhMmRhNThlM2MyZDVlNWMzMDI0ZDQxNTNlZSJ9fX0=" },
        };
        let texturesPromise: Promise<GameProfile.TexturesInfo>;
        beforeAll(() => {
            texturesPromise = ProfileService.getTextures(profile);
        });
        test("the textures object format should be correct", async () => {
            const textures = await texturesPromise;
            assert(typeof textures.profileId === "string");
            assert(typeof textures.profileName === "string");
            assert(typeof textures.textures === "object");
            assert(typeof textures.timestamp === "number");
        });
        test("the texture in textures should be correct", async () => {
            const textures = (await texturesPromise).textures;
            if (textures.SKIN) {
                const skin = textures.SKIN;
                assert(typeof skin.url === "string");
                if (skin.metadata) {
                    assert(typeof skin.metadata === "object");
                    assert(typeof skin.metadata.model === "string");
                    assert(skin.metadata.model === "steve" ||
                        skin.metadata.model === "slim");
                    for (const key in skin.metadata) {
                        assert(typeof key === "string");
                        assert(typeof skin.metadata[key] === "string");
                    }
                }
            }
        });
    });


});
