
import * as fs from "fs";
import * as path from "path";
import { readInfo, readInfoSync, writeInfo, writeInfoSync } from "./index";


describe("Server Info", () => {
    const root = path.normalize(path.join(__dirname, "..", "..", "mock"));
    test("should read server.dat file", async () => {
        const data = fs.readFileSync(`${root}/servers.dat`);
        const infos = await readInfo(data);
        expect(infos[0].name).toEqual("nyaacat");
        expect(infos[1].name).toEqual("himajin");
        expect(infos[2].name).toEqual("mcJp");
        expect(infos[3].name).toEqual("Minecraft Server");
    });
    test("should sync read server.dat file", async () => {
        const data = fs.readFileSync(`${root}/servers.dat`);
        const infos = readInfoSync(data);
        expect(infos[0].name).toEqual("nyaacat");
        expect(infos[1].name).toEqual("himajin");
        expect(infos[2].name).toEqual("mcJp");
        expect(infos[3].name).toEqual("Minecraft Server");
    });
    test("should write to nbt data right", async () => {
        const byte = await writeInfo([
            {
                name: "abc",
                ip: "ip!",
                icon: "",
                acceptTextures: 0,
            }
        ]);
        const readBack = await readInfo(byte);
        expect(readBack[0]).toBeTruthy();
        expect(readBack[0].name).toEqual("abc");
        expect(readBack[0].ip).toEqual("ip!");
    });
    test("should sync write to nbt data right", async () => {
        const byte = writeInfoSync([
            {
                name: "abc",
                ip: "ip!",
                icon: "",
                acceptTextures: 0,
            }
        ]);
        const readBack = await readInfo(byte);
        expect(readBack[0]).toBeTruthy();
        expect(readBack[0].name).toEqual("abc");
        expect(readBack[0].ip).toEqual("ip!");
    });
});
