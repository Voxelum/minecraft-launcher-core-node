import assert from "assert";
import { ChildProcess, spawn } from "child_process";
import * as path from "path";
import { GameProfile, ProfileService } from "./index";
import nock from "nock";
import { URLSearchParams } from "url";

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
        // jest.setTimeout(100000);
        // try {
        //     await new Promise((resolve, reject) => {
        //         proc = spawn("java", ["-jar", path.join(root, "yggdrasil-mock-server-0.0.1-SNAPSHOT.jar")]);
        //         proc.stdout.on("data", (b) => {
        //             // console.log(b.toString());
        //             if (b.toString().indexOf("moe.yushi.yggdrasil.mockserver.Main") !== -1 &&
        //                 b.toString().indexOf("Started Main") !== -1) {
        //                 resolve();
        //             }
        //         });
        //     });
        // } catch (e) {
        //     console.error("Cannot start the yggdrasil mock server!");
        //     console.error(e);
        //     describe = describe.skip;
        // }
        // await sleep(1000);
    });
    afterAll(() => { proc.kill(); });
    afterEach(() => sleep(RATE));

    describe("#lookupAll", () => {
        test("should fetch profile by name", async () => {
            nock("https://api.mojang.com")
                .get("/users/profiles/minecraft", ["character1"])
                .reply(200, [
                    {
                        id: "00000000000000000000000000000000",
                        name: "character1",
                    }
                ]);
            const [s] = await ProfileService.lookupAll(["character1"]);
            expect(s!.name).toBe("character1");
            expect(s!.id).toBe("00000000000000000000000000000000");
        });
        test("should return undefined if profile doesn't exist", async () => {
            nock("https://api.mojang.com")
                .get("/users/profiles/minecraft", ["character1", "characterX"])
                .reply(200, [
                    {
                        id: "00000000000000000000000000000000",
                        name: "character1",
                    },
                    {},
                ]);
            const [a, b] = await ProfileService.lookupAll(["character1", "characterX"]);
            expect(a).toBeTruthy();
            expect(b).toBeUndefined();
        });
    });

    describe("#lookup", () => {
        test("should fetch profile by name", async () => {
            nock("https://api.mojang.com")
                .get("/users/profiles/minecraft/lookup")
                .reply(200, {
                    id: "00000000000000000000000000000000",
                    name: "character1",
                });
            const s = await ProfileService.lookup("lookup");
            expect(s).toBeTruthy();
            expect(s!.name).toBe("character1");
            expect(s!.id).toBe("00000000000000000000000000000000");
        });
    });
    describe("#getTexture", () => {
        test("should be able to get texture", () => {
            const profile: GameProfile = {
                id: "00000000000000000000000000000000",
                name: "character1",
                properties: { textures: "eyJ0aW1lc3RhbXAiOjE1NDEzODY0MzI2OTksInByb2ZpbGVJZCI6ImFiZjgxZmU5OWYwZDQ5NDhhOTA5NzcyMWE4MTk4YWM0IiwicHJvZmlsZU5hbWUiOiJDSTAxMCIsInNpZ25hdHVyZVJlcXVpcmVkIjp0cnVlLCJ0ZXh0dXJlcyI6eyJTS0lOIjp7InVybCI6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvZGYwMzE0NzJmYjg3MjgyNjA4MjdjMTY2NzA2ZTJiYTI0YTBmYzlhMmRhNThlM2MyZDVlNWMzMDI0ZDQxNTNlZSJ9fX0=" },
            };
            const text = ProfileService.getTextures(profile);
            expect(text).toEqual({
                timestamp: 1541386432699,
                profileId: "abf81fe99f0d4948a9097721a8198ac4",
                profileName: "CI010",
                signatureRequired: true,
                textures: {
                    SKIN: {
                        url: "http://textures.minecraft.net/texture/df031472fb8728260827c166706e2ba24a0fc9a2da58e3c2d5e5c3024d4153ee"
                    }
                }
            });
        });
        test("should parse empty texture", () => {
            const profile: GameProfile = {
                id: "00000000000000000000000000000000",
                name: "character1",
                properties: {},
            };
            let text = ProfileService.getTextures(profile);
            expect(text).toBeUndefined();

            Reflect.deleteProperty(profile, "properties");

            text = ProfileService.getTextures(profile);
            expect(text).toBeUndefined();
        });
    });

    describe("#setTexture", () => {
        test("should be able to delete texture", async () => {
            nock("https://api.mojang.com")
                .delete("/user/profile/uuid/skin", undefined, { reqheaders: { Authorization: "Bearer my-token" } })
                .reply(200);

            await expect(ProfileService.setTexture({ accessToken: "my-token", type: "skin", uuid: "uuid" }))
                .resolves
                .toBeUndefined();
        });
        test("should be able to set texture by url", async () => {
            nock("https://api.mojang.com")
                .post("/user/profile/uuid/skin", undefined, { reqheaders: { Authorization: "Bearer my-token" } })
                .query(new URLSearchParams({ url: "http://my-skin.url", model: "" }))
                .reply(200);

            await expect(ProfileService.setTexture({
                accessToken: "my-token", type: "skin", uuid: "uuid", texture: {
                    url: "http://my-skin.url"
                }
            })).resolves.toBeUndefined();
        });
        test("should be able to set texture by data", async () => {
            nock("https://api.mojang.com")
                .put("/user/profile/uuid/skin", undefined, {
                    reqheaders: {
                        Authorization: "Bearer my-token",
                    }
                })
                .reply(200);
            await ProfileService.setTexture({
                accessToken: "my-token", type: "skin", uuid: "uuid", texture: {
                    url: "http://my-skin.url"
                },
                data: Buffer.from([12]),
            });
        });
    });

    describe("#fetch", () => {
        test("should fetch from offical endpoint by default", async () => {
            nock("https://sessionserver.mojang.com")
                .get("/session/minecraft/profile/00000000000000000000000000000000")
                .query(new URLSearchParams({ unsigned: "false" }))
                .reply(200, {
                    id: "00000000000000000000000000000000",
                    name: "character1",
                });
            const s = await ProfileService.fetch("00000000000000000000000000000000");
            expect(s.name).toBe("character1");
            expect(s.id).toBe("00000000000000000000000000000000");
        });
        test.skip("should catch too many request error by default", async () => {
            nock("https://sessionserver.mojang.com")
                .get("/session/minecraft/profile/uuid")
                .query(new URLSearchParams({ unsigned: "false" }))
                .reply(429, {
                    "error": "TooManyRequestsException",
                    "errorMessage": "The client has sent too many requests within a certain amount of time"
                });
            try {
                await ProfileService.fetch("uuid");
            } catch (e) {
                expect(e.statusCode).toEqual(429);
                expect(e.error).toEqual("TooManyRequestsException");
                expect(e.errorMessage).toEqual("The client has sent too many requests within a certain amount of time");
            }
        });
        test("should fetch the correct username and uuid", async () => {
            nock("http://localhost:25566")
                .get("/sessionserver/session/minecraft/profile/00000000000000000000000000000000?unsigned=false")
                .reply(200, {
                    id: "00000000000000000000000000000000",
                    name: "character1",
                });
            const s = await ProfileService.fetch("00000000000000000000000000000000", { api: MOCK });
            expect(s.name).toBe("character1");
            expect(s.id).toBe("00000000000000000000000000000000");
        });
        test("the game profile properties should be correct format", async () => {
            nock("http://localhost:25566")
                .get("/sessionserver/session/minecraft/profile/00000000000000000000000000000000?unsigned=false")
                .reply(200, {
                    id: "00000000000000000000000000000000",
                    name: "character1",
                    properties: [{ name: "textures", value: "eyJ0aW1lc3RhbXAiOjE1NDEzODY0MzI2OTksInByb2ZpbGVJZCI6ImFiZjgxZmU5OWYwZDQ5NDhhOTA5NzcyMWE4MTk4YWM0IiwicHJvZmlsZU5hbWUiOiJDSTAxMCIsInNpZ25hdHVyZVJlcXVpcmVkIjp0cnVlLCJ0ZXh0dXJlcyI6eyJTS0lOIjp7InVybCI6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvZGYwMzE0NzJmYjg3MjgyNjA4MjdjMTY2NzA2ZTJiYTI0YTBmYzlhMmRhNThlM2MyZDVlNWMzMDI0ZDQxNTNlZSJ9fX0=" }],
                });
            const s = await ProfileService.fetch("00000000000000000000000000000000", { api: MOCK });
            expect(s.properties).toBeTruthy();
            expect(s.properties!.textures).toBeTruthy();
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
});

describe("Texture", () => {
    describe("#getModelType", () => {
        test("slim", () => {
            expect(GameProfile.Texture.getModelType({
                url: "",
                metadata: { model: "slim" }
            })).toEqual("slim");
        });
        test("steve", () => {
            expect(GameProfile.Texture.getModelType({
                url: "",
                metadata: { model: "steve" }
            })).toEqual("steve");
        });
    });
    describe("#isSlim", () => {
        test("slim", () => {
            expect(GameProfile.Texture.isSlim({
                url: "",
                metadata: { model: "slim" }
            })).toEqual(true);
        });
        test("steve", () => {
            expect(GameProfile.Texture.isSlim({
                url: "",
                metadata: { model: "steve" }
            })).toEqual(false);
        });
        test("default", () => {
            expect(GameProfile.Texture.isSlim({
                url: "",
            })).toEqual(false);
        });
    });
});
