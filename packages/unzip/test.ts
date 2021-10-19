jest.mock("yauzl");

import { open } from "./index";

describe("Unzip", () => {
    describe("#open", () => {
        it("should call yauzl open", async () => {
            const value = "test.zip";
            let target: any
            let options: any
            let ret: any = {};
            (require("yauzl").open as jest.Mock).mockImplementationOnce((_target, _options, cb) => {
                target = _target
                options = _options
                cb(undefined, ret)
            });
            await expect(open(value)).resolves.toEqual(ret);
            expect(target).toEqual("test.zip");
            expect(options).toEqual({ "autoClose": false, "lazyEntries": true });
        });
        it("should call yauzl fromBuffer", async () => {
            const buff = Buffer.from([0]);
            let target: any
            let options: any
            let ret: any = {};
            (require("yauzl").fromBuffer as jest.Mock).mockImplementationOnce((_target, _options, cb) => {
                target = _target
                options = _options
                cb(undefined, ret)
            });
            await expect(open(buff)).resolves.toEqual(ret);
            expect(target).toEqual(buff);
            expect(options).toEqual({ "autoClose": false, "lazyEntries": true });
        });
        it("should call yauzl fromFd", async () => {
            const value = 1;
            let target: any
            let options: any
            let ret: any = {};
            (require("yauzl").fromFd as jest.Mock).mockImplementationOnce((_target, _options, cb) => {
                target = _target
                options = _options
                cb(undefined, ret)
            });
            await expect(open(value)).resolves.toEqual(ret);
            expect(target).toEqual(value);
            expect(options).toEqual({ "autoClose": false, "lazyEntries": true });
        });
        it("should catch error", async () => {
            (require("yauzl").open as jest.Mock).mockImplementationOnce((_target, _options, cb) => {
                cb(new Error("ERROR!"))
            });
            await expect(open("test.zip")).rejects.toEqual(new Error("ERROR!"));
            (require("yauzl").open as jest.Mock).mockImplementationOnce((_target, _options, cb) => {
                cb(undefined)
            });
            await expect(open("test.zip")).rejects.toEqual(new Error("Cannot open zip!"));
        });
    });
});
