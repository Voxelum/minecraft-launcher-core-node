import { HttpDownloader, batchedTask, MultipleError } from "./util";
import { normalize, join } from "path";
import { Task } from "@xmcl/task";

const root = normalize(join(__dirname, "..", "..", "temp"));

describe("DefaultDownloader", () => {
    describe("download", () => {
        test("should use fallback urls", async () => {
            let downloader = new HttpDownloader();
            try {
                await downloader.downloadFile({ destination: root + "/temp", url: ["h/abc", "z/abc"] });
            } catch (e) {
                expect(e.message).toEqual("Invalid URL: z/abc");
            }
        });
    });
});
describe("batchTask", () => {
    test("should throw immediately if throwErrorImmediately is enabled", async () => {
        let task = batchedTask({
            async execute() {
                throw new Error();
            },
            update() { },
        } as any, [0 as any], [1], 1, true);
        await expect(task).rejects.not.toBeInstanceOf(MultipleError);
    });
    test("should throw all event if throwErrorImmediately is disabled", async () => {
        let task = batchedTask({
            async execute() {
                throw new Error();
            },
            update() { },
        } as any, [0 as any], [1]);
        await expect(task).rejects.toBeInstanceOf(MultipleError);
    });
    test("should throw cancel event if throwErrorImmediately is disabled", async () => {
        let task = batchedTask({
            async execute() {
                throw new Task.CancelledError();
            },
            update() { },
        } as any, [0 as any], [1]);
        await expect(task).rejects.toBeInstanceOf(Task.CancelledError);
    });
});

