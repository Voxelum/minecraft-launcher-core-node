import nock from "nock";
import {
    login,
    validate,
    invalidate,
    refresh,
    offline,
    signout,
    Authenticator,
    Authentication
} from "./index";
import uuid from "uuid/v4";
import { AUTH_API_MOJANG } from "./auth";

describe("Auth", () => {
    const API = {
        hostName: "http://localhost:25567/authserver",
        authenticate: "/authenticate",
        refresh: "/refresh",
        validate: "/validate",
        invalidate: "/invalidate",
        signout: "/signout",
    };

    describe("Authenticator", () => {
        const clientToken = uuid();
        const client = new Authenticator(clientToken, API);
        let auth: Authentication;
        describe("#login", () => {
            test("should be able to login", async () => {
                const username = "test1@to2mbn.org";
                const password = "111111";
                nock(API.hostName).post(API.authenticate, {
                    agent: { name: "Minecraft", version: 1 },
                    requestUser: true,
                    clientToken,
                    username,
                    password,
                }).reply(200, {
                    clientToken,
                    accessToken: uuid(),
                });
                auth = await client.login({ username, password });
                expect(auth).toBeTruthy();
                expect(auth.clientToken).toEqual(client.clientToken);
            });
            test("should be able to login without request user", async () => {
                const username = "test1@to2mbn.org";
                const password = "111111";
                nock(API.hostName).post(API.authenticate, {
                    agent: { name: "Minecraft", version: 1 },
                    requestUser: false,
                    clientToken,
                    username,
                    password,
                }).reply(200, {
                    clientToken,
                    accessToken: uuid(),
                });
                auth = await client.login({ username, password, requestUser: false });
                expect(auth).toBeTruthy();
                expect(auth.clientToken).toEqual(client.clientToken);
            });
            test("should reject invalid username password", async () => {
                const username = "test1@to2mbn.org";
                const password = "111111";
                nock(API.hostName).post(API.authenticate, {
                    agent: { name: "Minecraft", version: 1 },
                    requestUser: true,
                    clientToken,
                    username,
                    password,
                }).reply(400, JSON.stringify({
                    error: "InvalidArguments"
                }));
                await expect(client.login({ username, password }))
                    .rejects
                    .toEqual({
                        error: "InvalidArguments",
                        statusCode: 400,
                        statusMessage: "",
                    });
            });
            test("should reject if get non error response", async () => {
                const username = "test1@to2mbn.org";
                const password = "111111";
                nock(API.hostName).post(API.authenticate, {
                    agent: { name: "Minecraft", version: 1 },
                    requestUser: true,
                    clientToken,
                    username,
                    password,
                }).reply(400, { hello: "world" });
                await expect(client.login({ username, password }))
                    .rejects
                    .toEqual({
                        error: "General",
                        statusCode: 400,
                        statusMessage: "",
                        hello: "world",
                    });
            });
            test("should reject if get non 200 invalid return", async () => {
                const username = "test1@to2mbn.org";
                const password = "111111";
                nock(API.hostName).post(API.authenticate, {
                    agent: { name: "Minecraft", version: 1 },
                    requestUser: true,
                    clientToken,
                    username,
                    password,
                }).reply(400, "Not a JSON");
                await expect(client.login({ username, password }))
                    .rejects
                    .toEqual({
                        error: "General",
                        statusCode: 400,
                        statusMessage: "",
                        body: "Not a JSON",
                    });
            });
            test("should reject if get 200 and invalid return", async () => {
                const username = "test1@to2mbn.org";
                const password = "111111";
                nock(API.hostName).post(API.authenticate, {
                    agent: { name: "Minecraft", version: 1 },
                    requestUser: true,
                    clientToken,
                    username,
                    password,
                }).reply(200, "Not a JSON");
                await expect(client.login({ username, password }))
                    .rejects
                    .toEqual({
                        error: "General",
                        statusCode: 200,
                        statusMessage: "",
                        body: "Not a JSON",
                    });
            });
        });
        describe("#validate", () => {
            test("should be able to valid accessToken with response 200", async () => {
                nock(API.hostName).post(API.validate, {
                    clientToken,
                    accessToken: auth.accessToken,
                }).reply(200);
                await expect(client.validate({ accessToken: auth.accessToken }))
                    .resolves
                    .toBeTruthy();
            });
            test("should return false when validate an invalid access token with response 400", async () => {
                nock(API.hostName).post(API.validate, {
                    clientToken,
                    accessToken: "abc",
                }).reply(400);
                await expect(client.validate({ accessToken: "abc" }))
                    .resolves
                    .toBeFalsy();
            });
            test("should not include extra option to the payload", async () => {
                nock(API.hostName).post(API.validate, {
                    clientToken,
                    accessToken: "abc",
                }).reply(200);
                await expect(client.validate({ accessToken: "abc", extra: "1" } as any))
                    .resolves
                    .toBeTruthy();
            });
        });
        describe("#refresh", () => {
            test("should be able to refresh accessToken", async () => {
                nock(API.hostName).post(API.refresh, {
                    clientToken,
                    accessToken: auth.accessToken,
                    requestUser: false,
                }).reply(200, { accessToken: "newId", clientToken });
                const result = await client.refresh({ accessToken: auth.accessToken });
                expect(result).toEqual({
                    accessToken: "newId",
                    clientToken,
                });
            });
            test("should be able to refresh and request user", async () => {
                nock(API.hostName).post(API.refresh, {
                    clientToken,
                    accessToken: auth.accessToken,
                    requestUser: true,
                }).reply(200, { accessToken: "newId", clientToken });
                const result = await client.refresh({ accessToken: auth.accessToken, requestUser: true });
                expect(result).toEqual({
                    accessToken: "newId",
                    clientToken,
                });
            });
        });
        describe("#invalidate", () => {
            test("should be able to invalidate accessToken", async () => {
                nock(API.hostName).post(API.invalidate, {
                    clientToken,
                    accessToken: auth.accessToken,
                }).reply(204);
                await client.invalidate({ accessToken: auth.accessToken });
            });
        });
        describe("#signout", () => {
            test("should be able to signout", async () => {
                nock(API.hostName).post(API.signout, {
                    username: "test1@to2mbn.org",
                    password: "111111",
                }).reply(204);
                await client.signout({ username: "test1@to2mbn.org", password: "111111" });
            });
        });
    });


    describe("#login", () => {
        test("should be able to login", async () => {
            const clientToken = "CT";
            const username = "username";
            const password = "password";
            nock(API.hostName).post(API.authenticate, {
                agent: { name: "Minecraft", version: 1 },
                requestUser: true,
                clientToken,
                username,
                password,
            }).reply(200, {
                clientToken,
                accessToken: uuid(),
            });
            await login({ username, password, clientToken }, API);
        });
        test("should be gen a random clientToken if it's not provided", async () => {
            const username = "username";
            const password = "password";
            nock(API.hostName).post(API.authenticate, {
                agent: { name: "Minecraft", version: 1 },
                requestUser: true,
                clientToken: /.+/,
                username,
                password,
            }).reply(200, {
                accessToken: uuid(),
            });
            await login({ username, password }, API);
        });
        test("should be able to login to mojang by default", async () => {
            const clientToken = "CT";
            const username = "username";
            const password = "password";
            nock(AUTH_API_MOJANG.hostName).post(AUTH_API_MOJANG.authenticate, {
                agent: { name: "Minecraft", version: 1 },
                requestUser: true,
                clientToken,
                username,
                password,
            }).reply(200, {
                clientToken,
                accessToken: uuid(),
            });
            await login({ username, password, clientToken });
        });
    });
    describe("#validate", () => {
        test("should be able to valid accessToken", async () => {
            const clientToken = "CT";
            const accessToken = "tk";
            nock(API.hostName).post(API.validate, {
                accessToken,
                clientToken,
            }).reply(200);
            const result = await validate({ accessToken, clientToken }, API);
            expect(result).toBe(true);
        });
        test("should be able to catch the false", async () => {
            const clientToken = "CT";
            const accessToken = "tk";
            nock(API.hostName).post(API.validate, {
                clientToken,
                accessToken,
            }).reply(400);
            const result = await validate({ accessToken, clientToken }, API);
            expect(result).toBe(false);
        });
        test("should be able to valid accessToken to mojang by default", async () => {
            const clientToken = "CT";
            const accessToken = "tk";
            nock(AUTH_API_MOJANG.hostName).post(AUTH_API_MOJANG.validate, {
                accessToken,
                clientToken,
            }).reply(200);
            const result = await validate({ accessToken, clientToken });
            expect(result).toBe(true);
        });
    });
    describe("#refresh", () => {
        test("should be able to refresh accessToken", async () => {
            const clientToken = "CT";
            const accessToken = "tk";
            nock(API.hostName).post(API.refresh, {
                clientToken,
                accessToken,
                requestUser: false,
            }).reply(200);
            await refresh({ accessToken, clientToken }, API);
        });
        test("should be able to refresh accessToken to mojang by default", async () => {
            const clientToken = "CT";
            const accessToken = "tk";
            nock(AUTH_API_MOJANG.hostName).post(AUTH_API_MOJANG.refresh, {
                clientToken,
                accessToken,
                requestUser: false,
            }).reply(200);
            await refresh({ accessToken, clientToken });
        });
    });
    describe("#invalidate", () => {
        test("should be able to invalidate accessToken", async () => {
            const clientToken = "CT";
            const accessToken = "tk";
            nock(API.hostName).post(API.invalidate, {
                clientToken,
                accessToken,
            }).reply(200);
            await invalidate({ accessToken, clientToken }, API);
        });
        test("should be able to invalidate accessToken to mojang by default", async () => {
            const clientToken = "CT";
            const accessToken = "tk";
            nock(AUTH_API_MOJANG.hostName).post(AUTH_API_MOJANG.invalidate, {
                clientToken,
                accessToken,
            }).reply(200);
            await invalidate({ accessToken, clientToken });
        });
    });
    describe("#signout", () => {
        test("should be able to signout", async () => {
            const username = "username";
            const password = "password";
            nock(API.hostName).post(API.signout, {
                username,
                password,
            }).reply(200);
            await signout({ username, password }, API);
        });
        test("should be able to signout to mojang by default", async () => {
            const username = "username";
            const password = "password";
            nock(AUTH_API_MOJANG.hostName).post(AUTH_API_MOJANG.signout, {
                username,
                password,
            }).reply(200);
            await signout({ username, password });
        });
    });

    test("#offline", () => {
        const offlineUser = offline("ci010");
        expect(offlineUser.selectedProfile.name).toEqual("ci010");
        expect(offlineUser.selectedProfile.id).toBeTruthy();
        expect(offlineUser.accessToken).toBeTruthy();
        expect(offlineUser.clientToken).toBeTruthy();
        expect(offlineUser.user!.id).toBeTruthy();
    });
});
