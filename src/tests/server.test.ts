
import * as assert from "assert";
import * as fs from "fs";
import { Server } from "../index";

describe("Server", () => {
    it("should read server.dat file", function () {
        const data = fs.readFileSync(`${this.assets}/servers.dat`);
        const infos = Server.readInfo(data);
        assert.equal(infos[0].name, "nyaacat");
        assert.equal(infos[1].name, "himajin");
        assert.equal(infos[2].name, "mcJp");
        assert.equal(infos[3].name, "Minecraft Server");
    });
    it("should write to nbt data right", () => {
        const byte = Server.writeInfo([{
            name: "abc",
            host: "ip!",
        }]);
        const readBack = Server.readInfo(byte);
        assert(readBack[0]);
        assert.equal(readBack[0].name, "abc");
        assert.equal(readBack[0].host, "ip!");
    });
    describe("Ping", function () {
        this.slow(3000);
        it("should fetch server frame", async () => {
            const frame = await Server.fetchStatusFrame({ host: "mc.hypixel.net" });
            assert(frame);
            assert(frame.ping !== -1, "Frame should have ping");
        }).timeout(100000);
        // it("should control the port", (done) => {
        //     Server.fetchStatusFrame({ host: "mc.hypixel.net", port: 138 }, { timeout: 500, retryTimes: 0 })
        //         .then(() => done("This should not happen"))
        //         .catch((err) => { done(); });
        // }).timeout(100000);
        it("should convert frame to status", async () => {
            const frame: Server.StatusFrame = {
                version: { name: "test-version", protocol: 1 },
                players: { max: 1, online: 1 },
                description: "abc",
                favicon: "",
                ping: 5,
            };
            const status = Server.Status.from(frame);
            assert.equal(status.capacity, 1, "capacity");
            assert.equal(status.pingToServer, 5, "ping");
            assert.equal(status.onlinePlayers, 1, "online");
            assert.equal(status.serverMOTD.text, "abc", "motd");
            assert.equal(status.icon, "", "icon");
            assert.equal(status.protocolVersion, 1, "protocol");
        });
        it("should capture timeout exception", (done) => {
            Server.fetchStatus({
                host: "crafterr.me",
            }, { timeout: 100 }).then((status) => {
                done(new Error("this should not happend"));
            }, (err) => {
                done();
            });
        }).timeout(100000);
        it("should fetch server info and ping", (done) => {
            Server.fetchStatus({
                host: "mc.hypixel.net",
            }, { timeout: 10000 }).then((status) => {
                assert(status.pingToServer !== -1);
                done();
            }).catch((e) => { done(e); });
        }).timeout(100000);
    });
});
