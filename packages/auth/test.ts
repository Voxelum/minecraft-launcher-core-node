import assert from "assert";
import { ChildProcess, spawn } from "child_process";
import * as path from "path";
import { Auth } from "./index";

function sleep(time: number) {
    return new Promise<void>((resolve, reject) => {
        setTimeout(() => { resolve(); }, time);
    });
}

describe("Auth", () => {
    let proc: ChildProcess;
    let auth: Auth;

    const root = path.normalize(path.join(__dirname, "..", "..", "mock"));
    const MOCK = {
        hostName: "http://localhost:25567/authserver",
        authenticate: "/authenticate",
        refresh: "/refresh",
        validate: "/validate",
        invalidate: "/invalidate",
        signout: "/signout",
    };
    const RATE = 1000;
    const WAIT = 1500;

    beforeAll(async function () {
        jest.setTimeout(1000000);
        try {
            await new Promise((resolve, reject) => {
                proc = spawn("java", ["-jar", path.join(root, "yggdrasil-mock-server-0.0.1-SNAPSHOT.jar"), "--server.port=25567"]);
                proc.on("error", reject);
                proc.stdout.on("data", (b) => {
                    // console.log(b.toString());
                    if (b.toString().indexOf("moe.yushi.yggdrasil.mockserver.Main") !== -1 &&
                        b.toString().indexOf("Started Main") !== -1) {
                        resolve();
                    }
                });
            });
        } catch (e) {
            describe = describe.skip;
            console.error("Cannot start the yggdrasil mock server!");
            console.error(e);
        }
        await sleep(1000);
    });
    afterAll(() => { proc.kill(); });
    afterEach(async () => { await sleep(RATE); });

    describe("#login", () => {
        test("should be able to login", async () => {
            auth = await Auth.Yggdrasil.login({ username: "test1@to2mbn.org", password: "111111" }, MOCK);
            expect(auth).toBeTruthy();
            expect(auth.userType).toEqual("mojang");
        });
        test("should reject invalid username password", async () => {
            await expect(Auth.Yggdrasil.login({ username: "18211378@163.com", password: "asd-x" }, MOCK))
                .rejects
                .toBeTruthy();
        });
    });
    describe("#validate", () => {
        test("should be able to valid accessToken", async () => {
            const valid = await Auth.Yggdrasil.validate({ accessToken: auth.accessToken, clientToken: auth.clientToken }, MOCK);
            expect(valid).toBeTruthy();
        });
        test("should return false when validate an invalid access token", async () => {
            const valid = await Auth.Yggdrasil.validate({ accessToken: "abc", clientToken: "bvd" }, MOCK);
            assert(valid === false);
            expect(valid).toBeFalsy();
        });
        test("should catch the error and not return false if error happened during validation", async () => {
            await expect(Auth.Yggdrasil.validate({ accessToken: "abc", clientToken: "bvd" }, { ...MOCK, hostName: "http://localhost:25566" }))
                .rejects
                .toBeTruthy();
        });
    });
    describe("#refresh", () => {
        test("should be able to refresh accessToken", async () => {
            const old = auth.accessToken;
            const oldId = auth.userId;
            auth = await Auth.Yggdrasil.refresh({ accessToken: auth.accessToken, clientToken: auth.clientToken }, MOCK);
            expect(old).not.toEqual(auth.accessToken);
            expect(auth.userId).toEqual(oldId);
            expect(auth.userType).toEqual("mojang");
        });
        test("should throw error when refresh an invalid access token", async () => {
            await expect(Auth.Yggdrasil.refresh({ accessToken: "abc", clientToken: "bvd" }, MOCK))
                .rejects
                .toBeTruthy();
        });
    });

    describe("#invalidate", () => {
        test("should be able to invalidate accessToken", async () => {
            await Auth.Yggdrasil.invalide({ accessToken: auth.accessToken, clientToken: auth.clientToken }, MOCK);
            await sleep(RATE);
            const valid = await Auth.Yggdrasil.validate({ accessToken: auth.accessToken, clientToken: auth.clientToken }, MOCK);
            expect(valid).toBeFalsy();
        });
    });
    describe("#signout", () => {
        test("should be able to signout", async () => {
            await Auth.Yggdrasil.signout({ username: "test1@to2mbn.org", password: "111111" }, MOCK);
        });
        test("should mute error to non-existed user", async () => {
            await expect(Auth.Yggdrasil.signout({ username: "test1@to2mbn.org", password: "111111" }, MOCK))
                .resolves.toBeFalsy();
        });
    });

    test("should offline auth", () => {
        const offlineUser = Auth.offline("ci010");
        expect(offlineUser.selectedProfile.name).toEqual("ci010");
        expect(offlineUser.selectedProfile.id).toBeTruthy();
        expect(offlineUser.accessToken).toBeTruthy();
        expect(offlineUser.clientToken).toBeTruthy();
        expect(offlineUser.userId).toBeTruthy();
        expect(offlineUser.userType).toBeTruthy();
    });
});
