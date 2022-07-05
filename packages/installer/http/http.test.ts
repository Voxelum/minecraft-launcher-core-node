import { join, normalize } from "path";
import { createDownload, DownloadOptions } from "./download";

declare const tempDir: string

describe("DownloadTask", () => {
    jest.setTimeout(100000000);
    function getDownloadOption(file: string, sha1: string): DownloadOptions {
        return {
            url: `http://speedtest.tele2.net/${file}`,
            destination: join(tempDir, file),
            headers: {
                "Accept-Encoding": "gzip, deflate",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.66 Safari/537.36 Edg/87.0.664.41"
            },
            validator: {
                algorithm: "sha1",
                hash: sha1,
            },
        }
    }
    test.skip("it should download 5MB file", async () => {
        const task = createDownload(getDownloadOption("5MB.zip", "2e95d7582c53583fa8afb54e0fe7a2597c92cbba"));
        await task.start();
    });
    test.skip("it should download 2MB file", async () => {
        const task = createDownload(getDownloadOption("2MB.zip", "7d76d48d64d7ac5411d714a4bb83f37e3e5b8df6"));
        await task.start();
    });
    test.skip("it should download 10MB file", async () => {
        const task = createDownload(getDownloadOption("10MB.zip", "8c206a1a87599f532ce68675536f0b1546900d7a"));
        await task.start();
    });
    test.skip("it should download 20MB file", async () => {
        const task = createDownload(getDownloadOption("20MB.zip", "9674344c90c2f0646f0b78026e127c9b86e3ad77"));
        await task.start();
    });
    test.skip("it should download 100MB file", async () => {
        const task = createDownload(getDownloadOption("100MB.zip", "2c2ceccb5ec5574f791d45b63c940cff20550f9a"));
        await task.start();
    });
});

