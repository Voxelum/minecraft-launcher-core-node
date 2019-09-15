
import assert from "assert";
import * as fs from "fs";
import * as path from "path";
import { Server } from "./index";


describe("Server", () => {
    const root =  path.normalize(path.join(__dirname, "..", "..", "mock"));
    test("should read server.dat file", async () => {
        const data = fs.readFileSync(`${root}/servers.dat`);
        const infos = await Server.readInfo(data);
        expect(infos[0].name).toEqual("nyaacat");
        expect(infos[1].name).toEqual("himajin");
        expect(infos[2].name).toEqual("mcJp");
        expect(infos[3].name).toEqual("Minecraft Server");
    });
    test("should write to nbt data right", async () => {
        const byte = await Server.writeInfo([{
            name: "abc",
            host: "ip!",
        }]);
        const readBack = await Server.readInfo(byte);
        assert(readBack[0]);
        expect(readBack[0].name).toEqual("abc");
        expect(readBack[0].host).toEqual("ip!");
    });
    describe("Ping", () => {
        // testContext.slow(3000);
        test("should fetch server frame", async () => {
            const frame = await Server.fetchStatusFrame({ host: "mc.hypixel.net" });
            assert(frame);
            assert(frame.ping !== -1, "Frame should have ping");
        });
        // it("should control the port", (done) => {
        //     Server.fetchStatusFrame({ host: "mc.hypixel.net", port: 138 }, { timeout: 500, retryTimes: 0 })
        //         .then(() => done("This should not happen"))
        //         .catch((err) => { done(); });
        // });
        test("should convert frame to status", async () => {
            const frame: Server.StatusFrame = {
                version: { name: "test-version", protocol: 1 },
                players: { max: 1, online: 1 },
                description: "abc",
                favicon: "",
                ping: 5,
            };
            const status = Server.Status.from(frame);
            expect(status.capacity).toEqual(1);
            expect(status.pingToServer).toEqual(5);
            expect(status.onlinePlayers).toEqual(1);
            expect(status.serverMOTD.text).toEqual("abc");
            expect(status.icon).toEqual("");
            expect(status.protocolVersion).toEqual(1);
        });
        test("should capture timeout exception", (done) => {
            Server.fetchStatus({
                host: "crafterr.me",
            }, { timeout: 100 }).then((status) => {
                done(new Error("this should not happend"));
            }, (err) => {
                done();
            });
        });
        test("should fetch server info and ping", (done) => {
            Server.fetchStatus({
                host: "mc.hypixel.net",
            }, { timeout: 10000 }).then((status) => {
                assert(status.pingToServer !== -1);
                done();
            }).catch((e) => { done(e); });
        });
    });
});
