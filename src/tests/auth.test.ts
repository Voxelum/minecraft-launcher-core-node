import * as assert from "assert";
import { Auth, MojangService } from "../index";
describe("Auth", () => {
    it("should reject invalid username password", () =>
        Auth.Yggdrasil.login({ username: "18211378@163.com", password: "asd-x" })
            .then((suc) => {
                throw new Error("Credit shouldn't have succeed");
            }, (err) => {
                assert.equal(err.type, "ForbiddenOperationException");
                assert.equal(err.message, "Invalid credentials. Invalid username or password.");
            }),
    ).timeout(100000);
    it("should return false when validate an invalid access token", async () => {
        const valid = await Auth.Yggdrasil.validate({ accessToken: "abc", clientToken: "bvd" });
        assert(valid === false);
    }).timeout(10000);
    it("should throw error when refresh an invalid access token", async () => {
        try {
            const auth = await Auth.Yggdrasil.refresh({ accessToken: "abc", clientToken: "bvd" });
        } catch (e) {
            assert(e);
        }
    }).timeout(10000);
    it("should offline auth", () => {
        const offlineUser = Auth.offline("ci010");
        assert.equal(offlineUser.selectedProfile.name, "ci010");
        assert(offlineUser.selectedProfile.id);
        assert(offlineUser.accessToken);
        assert(offlineUser.clientToken);
        assert(offlineUser.userId);
        assert(offlineUser.userType);
    }).timeout(10000);
});
