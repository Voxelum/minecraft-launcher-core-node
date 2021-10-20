import { GameProfile, ProfileServiceAPI, lookup, lookupByName, getTextures, setTexture } from "./index";
import nock from "nock";
import { URLSearchParams } from "url";
import { ProfileLookuper, PROFILE_API_MOJANG } from "./service";

const API: ProfileServiceAPI = {
    texture: "http://localhost:25566/user/profile/${uuid}/${type}",
    profile: "http://localhost:25566/sessionserver/session/minecraft/profile/${uuid}",
    profileByName: "http://localhost:25566/api/profiles/minecraft/${name}",
};

describe("ProfileService", () => {

    // describe("#lookupAll", () => {
    //     test("should fetch profile by name", async () => {
    //         nock("https://api.mojang.com")
    //             .get("/users/profiles/minecraft", ["character1"])
    //             .reply(200, [
    //                 {
    //                     id: "00000000000000000000000000000000",
    //                     name: "character1",
    //                 }
    //             ]);
    //         const [s] = await lookupAll(["character1"]);
    //         expect(s.name).toBe("character1");
    //         expect(s.id).toBe("00000000000000000000000000000000");
    //     });
    //     test("should return undefined if profile doesn't exist", async () => {
    //         nock("https://api.mojang.com")
    //             .get("/users/profiles/minecraft", ["character1", "characterX"])
    //             .reply(200, [
    //                 {
    //                     id: "00000000000000000000000000000000",
    //                     name: "character1",
    //                 },
    //                 {},
    //             ]);
    //         const [a, b] = await lookupAll(["character1", "characterX"]);
    //         expect(a).toBeTruthy();
    //         expect(b).toBeUndefined();
    //     });
    // });

    describe("#lookupByName", () => {
        test("should fetch profile by name", async () => {
            nock("https://api.mojang.com")
                .get("/users/profiles/minecraft/lookup")
                .reply(200, JSON.stringify({
                    id: "00000000000000000000000000000000",
                    name: "character1",
                }));
            const s = await lookupByName("lookup");
            expect(s).toBeTruthy();
            expect(s.name).toBe("character1");
            expect(s.id).toBe("00000000000000000000000000000000");
        });
    });
    describe("#getTexture", () => {
        test("should be able to get texture", () => {
            const profile: GameProfile = {
                id: "00000000000000000000000000000000",
                name: "character1",
                properties: { textures: "eyJ0aW1lc3RhbXAiOjE1NDEzODY0MzI2OTksInByb2ZpbGVJZCI6ImFiZjgxZmU5OWYwZDQ5NDhhOTA5NzcyMWE4MTk4YWM0IiwicHJvZmlsZU5hbWUiOiJDSTAxMCIsInNpZ25hdHVyZVJlcXVpcmVkIjp0cnVlLCJ0ZXh0dXJlcyI6eyJTS0lOIjp7InVybCI6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvZGYwMzE0NzJmYjg3MjgyNjA4MjdjMTY2NzA2ZTJiYTI0YTBmYzlhMmRhNThlM2MyZDVlNWMzMDI0ZDQxNTNlZSJ9fX0=" },
            };
            const text = getTextures(profile);
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
            let text = getTextures(profile);
            expect(text).toBeUndefined();

            Reflect.deleteProperty(profile, "properties");

            text = getTextures(profile);
            expect(text).toBeUndefined();
        });
    });

    describe("#setTexture", () => {
        test("should be able to delete texture", async () => {
            nock("https://api.mojang.com")
                .delete("/user/profile/uuid/skin", undefined, { reqheaders: { Authorization: "Bearer my-token" } })
                .reply(200);

            await expect(setTexture({ accessToken: "my-token", type: "skin", uuid: "uuid" }))
                .resolves
                .toBeUndefined();
        });
        test("should be able to set texture by url", async () => {
            nock("https://api.mojang.com")
                .post("/user/profile/uuid/skin", undefined, { reqheaders: { Authorization: "Bearer my-token" } })
                .query(new URLSearchParams({ url: "http://my-skin.url", model: "" }))
                .reply(200);

            await expect(setTexture({
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
            await setTexture({
                accessToken: "my-token", type: "skin", uuid: "uuid",
                texture: {
                    data: Buffer.from([12]),
                },
            });
        });
    });

    describe("#lookup", () => {
        test("should fetch from offical endpoint by default", async () => {
            nock("https://sessionserver.mojang.com")
                .get("/session/minecraft/profile/00000000000000000000000000000000")
                .query(new URLSearchParams({ unsigned: "false" }))
                .reply(200, {
                    id: "00000000000000000000000000000000",
                    name: "character1",
                });
            const s = await lookup("00000000000000000000000000000000");
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
                await fetch("uuid");
            } catch (e) {
                expect((e as any).statusCode).toEqual(429);
                expect((e as any).error).toEqual("TooManyRequestsException");
                expect((e as any).errorMessage).toEqual("The client has sent too many requests within a certain amount of time");
            }
        });
        test("should fetch the correct username and uuid", async () => {
            nock("http://localhost:25566")
                .get("/sessionserver/session/minecraft/profile/00000000000000000000000000000000?unsigned=true")
                .reply(200, {
                    id: "00000000000000000000000000000000",
                    name: "character1",
                });
            const s = await lookup("00000000000000000000000000000000", { api: API });
            expect(s.name).toBe("character1");
            expect(s.id).toBe("00000000000000000000000000000000");
        });
        test("the game profile properties should be correct format", async () => {
            nock("http://localhost:25566")
                .get("/sessionserver/session/minecraft/profile/00000000000000000000000000000000?unsigned=true")
                .reply(200, {
                    id: "00000000000000000000000000000000",
                    name: "character1",
                    properties: [{ name: "textures", value: "eyJ0aW1lc3RhbXAiOjE1NDEzODY0MzI2OTksInByb2ZpbGVJZCI6ImFiZjgxZmU5OWYwZDQ5NDhhOTA5NzcyMWE4MTk4YWM0IiwicHJvZmlsZU5hbWUiOiJDSTAxMCIsInNpZ25hdHVyZVJlcXVpcmVkIjp0cnVlLCJ0ZXh0dXJlcyI6eyJTS0lOIjp7InVybCI6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvZGYwMzE0NzJmYjg3MjgyNjA4MjdjMTY2NzA2ZTJiYTI0YTBmYzlhMmRhNThlM2MyZDVlNWMzMDI0ZDQxNTNlZSJ9fX0=" }],
                });
            const s = await lookup("00000000000000000000000000000000", { api: API });
            expect(s.properties).toBeTruthy();
            expect(s.properties.textures).toBeTruthy();
            for (const key in s.properties) {
                expect(typeof key === "string").toBeTruthy();
                expect(typeof s.properties[key] === "string").toBeTruthy();
            }
        });
        test("should catch error if the profile doesn't exists", async () => {
            await expect(lookup("asd", { api: API }))
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

describe("ProfileLookuper", () => {
    describe("#lookup", () => {
        test("should be able to send lookup", async () => {
            const lk = new ProfileLookuper(PROFILE_API_MOJANG);
            nock("https://sessionserver.mojang.com")
                .get("/session/minecraft/profile/uuid")
                .query(new URLSearchParams({ unsigned: "false" }))
                .reply(200, {
                    id: "uuid",
                    name: "character1",
                });
            await expect(lk.lookup("uuid"))
                .resolves
                .toBeTruthy();
        });
        test("should be able to defer lookup", async () => {
            const lk = new ProfileLookuper(PROFILE_API_MOJANG);
            nock("https://sessionserver.mojang.com")
                .get("/session/minecraft/profile/uuid").twice()
                .query(new URLSearchParams({ unsigned: "false" }))
                .reply(200, {
                    id: "uuid",
                    name: "character1",
                });
            await Promise.all([
                expect(lk.lookup("uuid"))
                    .resolves
                    .toBeTruthy(),
                expect(lk.lookup("uuid"))
                    .resolves
                    .toBeTruthy(),
            ]);
        });
    });
    afterEach(() => {
        nock.cleanAll()
        nock.enableNetConnect()
    })
});
