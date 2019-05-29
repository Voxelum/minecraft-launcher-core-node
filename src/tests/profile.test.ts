import * as assert from "assert";
import { ChildProcess, spawn } from "child_process";
import { GameProfile, MojangService, ProfileService } from "../index";

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

    before(async function () {
        this.timeout(100000);
        await new Promise((resolve, reject) => {
            proc = spawn("java", ["-jar", "yggdrasil-mock-server-0.0.1-SNAPSHOT.jar"]);
            proc.stdout.on("data", (b) => {
                if (b.toString().indexOf("moe.yushi.yggdrasil.mockserver.Main") !== -1 &&
                    b.toString().indexOf("Started Main") !== -1) {
                    resolve();
                }
            });
        });
        await sleep(1000);
    });
    after(() => { proc.kill(); });
    afterEach(() => sleep(RATE));

    describe("#lookup", () => {
        it("should fetch profile by name", async function () {
            this.slow(RATE + WAIT);
            const [s] = await ProfileService.lookUpAll(["character1"], { api: MOCK });
            assert(s);
            if (s) {
                assert.equal(s.name, "character1");
                assert.equal("00000000000000000000000000000000", s.id);
            }
        }).timeout(10000);
        it("should return undefined if profile doesn't exist", async function () {
            this.slow(RATE + WAIT);
            const [a, b] = await ProfileService.lookUpAll(["character1", "characterX"], { api: MOCK });
            assert(a);
            assert.equal(undefined, b);
        });
    });

    describe("#fetch", () => {
        let profilePromise: Promise<GameProfile>;
        before(() => {
            profilePromise = ProfileService.fetch("00000000000000000000000000000000", { api: MOCK });
        });
        it("should fetch the correct username and uuid", async () => {
            const s = await profilePromise;
            assert.equal(s.name, "character1");
            assert.equal("00000000000000000000000000000000", s.id);
        }).timeout(10000);
        it("the game profile properties should be correct format", async () => {
            const s = await profilePromise;
            if (s.properties !== undefined) {
                for (const key in s.properties) {
                    assert(typeof key === "string");
                    assert(typeof s.properties[key] === "string");
                }
            }
        });
        it("should catch error if the profile doesn't exists", async function () {
            try {
                await ProfileService.fetch("asd", { api: MOCK });
            } catch (e) {
                assert(e);
            }
        });
    });

    describe("#getTextures", () => {
        const profile = {
            id: "abf81fe99f0d4948a9097721a8198ac4",
            name: "CI010",
            // tslint:disable-next-line:max-line-length
            properties: { textures: "eyJ0aW1lc3RhbXAiOjE1NDEzODY0MzI2OTksInByb2ZpbGVJZCI6ImFiZjgxZmU5OWYwZDQ5NDhhOTA5NzcyMWE4MTk4YWM0IiwicHJvZmlsZU5hbWUiOiJDSTAxMCIsInNpZ25hdHVyZVJlcXVpcmVkIjp0cnVlLCJ0ZXh0dXJlcyI6eyJTS0lOIjp7InVybCI6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvZGYwMzE0NzJmYjg3MjgyNjA4MjdjMTY2NzA2ZTJiYTI0YTBmYzlhMmRhNThlM2MyZDVlNWMzMDI0ZDQxNTNlZSJ9fX0=" },
        };
        let texturesPromise: Promise<GameProfile.Textures>;
        before(() => {
            texturesPromise = ProfileService.getTextures(profile);
        });
        it("the textures object format should be correct", async () => {
            const textures = await texturesPromise;
            assert(typeof textures.profileId === "string");
            assert(typeof textures.profileName === "string");
            assert(typeof textures.textures === "object");
            assert(typeof textures.timestamp === "number");
        }).timeout(10000);
        it("the texture in textures should be correct", async () => {
            const textures = (await texturesPromise).textures;
            if (textures.skin) {
                const skin = textures.skin;
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
                if (skin.data) {
                    assert(skin.data instanceof Buffer);
                }
            }
        }).timeout(10000);
    });


});
