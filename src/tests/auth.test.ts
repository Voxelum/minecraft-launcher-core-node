import * as assert from "assert";
import { ChildProcess, spawn } from "child_process";
import { Auth, MojangService } from "../index";

function sleep(time: number) {
    return new Promise<void>((resolve, reject) => {
        setTimeout(() => { resolve(); }, time);
    });
}

describe("Auth", () => {
    let proc: ChildProcess;
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
    const MOCK = {
        hostName: "http://localhost:25566/authserver",
        authenticate: "/authenticate",
        refresh: "/refresh",
        validate: "/validate",
        invalidate: "/invalidate",
        signout: "/signout",
    };
    const RATE = 1000;
    const WAIT = 1500;

    let auth: Auth;
    describe("#login", () => {
        it("should be able to login", async function () {
            this.slow(WAIT + RATE);
            auth = await Auth.Yggdrasil.login({ username: "test1@to2mbn.org", password: "111111" }, MOCK);
            assert(auth);
            assert.equal(auth.userType, "legacy");
        });
        it("should reject invalid username password", async function () {
            this.slow(RATE + WAIT);
            await Auth.Yggdrasil.login({ username: "18211378@163.com", password: "asd-x" }, MOCK)
                .then((suc) => {
                    throw new Error("Credit shouldn't have succeed");
                }, (err) => {
                    assert.equal(err.type, "ForbiddenOperationException");
                    assert.equal(err.message, "Invalid credentials. Invalid username or password.");
                });
        });
    });
    describe("#validate", () => {
        it("should be able to valid accessToken", async function () {
            this.slow(WAIT + RATE);
            const valid = await Auth.Yggdrasil.validate({ accessToken: auth.accessToken, clientToken: auth.clientToken }, MOCK);
            assert(valid);
        });
        it("should return false when validate an invalid access token", async function () {
            this.slow(RATE + WAIT);
            const valid = await Auth.Yggdrasil.validate({ accessToken: "abc", clientToken: "bvd" }, MOCK);
            assert(valid === false);
        });
        it("should catch the error and not return false if error happened during validation", async function () {
            this.slow(RATE + WAIT);
            try {
                await Auth.Yggdrasil.validate({ accessToken: "abc", clientToken: "bvd" }, { ...MOCK, hostName: "http://localhost:25566" });
                throw new Error("This should not happen");
            } catch (e) {
                assert(e);
            }
        });
    });
    describe("#refresh", () => {
        it("should be able to refresh accessToken", async function () {
            this.slow(WAIT + RATE);
            const old = auth.accessToken;
            const oldId = auth.userId;
            auth = await Auth.Yggdrasil.refresh({ accessToken: auth.accessToken, clientToken: auth.clientToken }, MOCK);
            assert.notEqual(old, auth.accessToken);
            assert.equal(auth.userId, oldId);
            assert.equal(auth.userType, "legacy");
        });
        it("should throw error when refresh an invalid access token", async function () {
            this.slow(RATE + WAIT);
            try {
                await Auth.Yggdrasil.refresh({ accessToken: "abc", clientToken: "bvd" }, MOCK);
            } catch (e) {
                assert(e);
            }
        });
    });

    describe("#invalidate", () => {
        it("should be able to invalidate accessToken", async function () {
            this.slow(WAIT + RATE);
            await Auth.Yggdrasil.invalide({ accessToken: auth.accessToken, clientToken: auth.clientToken }, MOCK);
            await sleep(RATE);
            const valid = await Auth.Yggdrasil.validate({ accessToken: auth.accessToken, clientToken: auth.clientToken }, MOCK);
            assert(!valid);
        });
    });
    describe("#signout", () => {
        it("should be able to signout", async function () {
            this.slow(WAIT + RATE);
            await Auth.Yggdrasil.signout({ username: "test1@to2mbn.org", password: "111111" }, MOCK);
        });
        it("should catch error to non-existed user", async function () {
            this.slow(WAIT + RATE);
            try {
                await Auth.Yggdrasil.signout({ username: "test1@to2mbn.org", password: "111111" }, MOCK);
                throw new Error();
            } catch (e) {
                assert(e);
            }
        });
    });

    it("should offline auth", () => {
        const offlineUser = Auth.offline("ci010");
        assert.equal(offlineUser.selectedProfile.name, "ci010");
        assert(offlineUser.selectedProfile.id);
        assert(offlineUser.accessToken);
        assert(offlineUser.clientToken);
        assert(offlineUser.userId);
        assert(offlineUser.userType);
    });
});
