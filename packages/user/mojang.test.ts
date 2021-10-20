import { checkLocation } from "./index";
import { getChallenges, responseChallenges } from "./mojang";
import nock from "nock";

describe("MojangService", () => {
    describe("#checkLocation", () => {
        test("should be send check location req and accept 204", async () => {
            nock("https://api.mojang.com")
                .get("/user/security/location", undefined, {
                    reqheaders: { Authorization: "Bearer: at" },
                }).reply(204);
            await expect(checkLocation("at"))
                .resolves.toBeTruthy();
        });
        test("should be send check location req and reject 400", async () => {
            nock("https://api.mojang.com")
                .get("/user/security/location", undefined, {
                    reqheaders: { Authorization: "Bearer: at" },
                }).reply(400);
            await expect(checkLocation("at"))
                .resolves.toBeFalsy();
        });
    });
    describe("#getChallenges", () => {
        test("should be send get challenges req and accept 200", async () => {
            nock("https://api.mojang.com")
                .get("/user/security/challenges", undefined, {
                    reqheaders: { Authorization: "Bearer: at" },
                }).reply(200, []);
            await expect(getChallenges("at"))
                .resolves
                .toEqual([]);
        });
        test("should be send get challenges req and reject 400", async () => {
            nock("https://api.mojang.com")
                .get("/user/security/challenges", undefined, {
                    reqheaders: { Authorization: "Bearer: at" },
                }).reply(400);
            await expect(getChallenges("at"))
                .rejects
                .toBeTruthy();
        });
    });
    describe("#responseChallenges", () => {
        test("should be send get challenges req and accept 200", async () => {
            nock("https://api.mojang.com")
                .post("/user/security/location", [], {
                    reqheaders: { Authorization: "Bearer: at" },
                }).reply(200, []);
            await expect(responseChallenges("at", []))
                .resolves
                .toBeTruthy();
        });
        test("should be send get challenges req and reject 400", async () => {
            nock("https://api.mojang.com")
                .post("/user/security/location", [], {
                    reqheaders: { Authorization: "Bearer: at" },
                }).reply(400);
            await expect(responseChallenges("at", []))
                .resolves
                .toBeFalsy();
        });
    });
    afterEach(() => {
        nock.cleanAll()
        nock.enableNetConnect()
    })
});
