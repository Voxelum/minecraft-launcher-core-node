import { parseJavaVersion } from "./java";
import { JavaInstaller } from ".";
import { join, normalize } from "path";
import { writeFile, ensureFile } from "./util";

const root = normalize(join(__dirname, "..", "..", "temp"));

describe("JavaInstaller", () => {
    describe("#parseJavaVersion", () => {
        test("should resolve old java version", async () => {
            let version = `java version "1.7.0_55"
            Java(TM) SE Runtime Environment (build 1.7.0_55-b13)
            Java HotSpot(TM) 64-Bit Server VM (build 24.55-b03, mixed mode)`;
            const inf = parseJavaVersion(version);
            expect(inf).toEqual({ version: "1.7.0", majorVersion: 7 });
        });
        test("should resolve new java version", async () => {
            let version = `java 10.0.1 2018-04-17
            Java(TM) SE Runtime Environment 18.3 (build 10.0.1+10)
            Java HotSpot(TM) 64-Bit Server VM 18.3 (build 10.0.1+10, mixed mode)`;
            const inf = parseJavaVersion(version);
            expect(inf).toEqual({ version: "10.0.1", majorVersion: 10 });
        });
        test("should return undefined if version is not valid", async () => {
            let version = "java aaaa 2018-04-17";
            const inf = parseJavaVersion(version);
            expect(inf).toEqual(undefined);
        });
    });
    describe("#install", () => {
        test("should install from mojang src from windows", async () => {
            const mock = jest.fn();
            const downloadMock = jest.fn();
            await JavaInstaller.installJreFromMojang({
                destination: join(root, "jre"),
                cacheDir: join(root),
                unpackLZMA: async (rt, d) => { mock(d) },
                downloader: {
                    async downloadFile(option) {
                        downloadMock();
                        await ensureFile(option.destination);
                        await writeFile(option.destination, "");
                    },
                },
                platform: {
                    name: "windows",
                    arch: "x64",
                    version: "",
                },
            });
        });
    });
});
