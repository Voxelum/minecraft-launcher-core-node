jest.mock("child_process");

import { exec } from "child_process";
import { JavaInstaller } from "./index";
import { VFS } from "@xmcl/util";

describe("JavaInstaller", () => {
    const mockExc = exec as any as jest.Mock;
    describe("#resolveJava", () => {
        test("should resolve old java version", async () => {
            VFS.setVirtualFS({ async exists() { return true } });
            mockExc.mockImplementationOnce((arg: string, cb: any) => {
                cb(undefined, undefined, `java version "1.7.0_55"
                Java(TM) SE Runtime Environment (build 1.7.0_55-b13)
                Java HotSpot(TM) 64-Bit Server VM (build 24.55-b03, mixed mode)`);
            });
            const inf = await JavaInstaller.resolveJava("path/to/java");
            expect(inf).toEqual({ path: "path/to/java", version: "1.7.0", majorVersion: 7 });
        });
        test("should resolve new java version", async () => {
            VFS.setVirtualFS({ async exists() { return true } });
            mockExc.mockImplementationOnce((arg: string, cb: any) => {
                cb(undefined, undefined, `java 10.0.1 2018-04-17
                Java(TM) SE Runtime Environment 18.3 (build 10.0.1+10)
                Java HotSpot(TM) 64-Bit Server VM 18.3 (build 10.0.1+10, mixed mode)`);
            });
            const inf = await JavaInstaller.resolveJava("path/to/java");
            expect(inf).toEqual({ path: "path/to/java", version: "10.0.1", majorVersion: 10 });
        });
        test("should return undefined if path not existed", async () => {
            VFS.setVirtualFS({ async exists() { return false } });
            const inf = await JavaInstaller.resolveJava("path/to/java");
            expect(inf).toBeUndefined();
        });
        test("should return undefined if the process is not java", async () => {
            VFS.setVirtualFS({ async exists() { return true } });
            mockExc.mockImplementationOnce((arg: string, cb: any) => {
                cb(undefined, undefined, "whatever");
            });
            const inf = await JavaInstaller.resolveJava("path/to/java");
            expect(inf).toBeUndefined();
        });
        test("should return undefined if the process is not java and return nothing in stderr", async () => {
            VFS.setVirtualFS({ async exists() { return true } });
            mockExc.mockImplementationOnce((arg: string, cb: any) => {
                cb(undefined, undefined, undefined);
            });
            const inf = await JavaInstaller.resolveJava("path/to/java");
            expect(inf).toBeUndefined();
        });
    })
    VFS.restoreToDefault();
});
