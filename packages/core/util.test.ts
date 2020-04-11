import { join, normalize } from "path";
import { getSha1, validateSha1 } from "./util";

const root = normalize(join(__dirname, "..", "..", "mock"));

describe("util", () => {
    describe("#validateSha1", () => {
        test("should return false if the file not found", async () => {
            await expect(validateSha1(join(root, "test.ss")))
                .resolves
                .toEqual(false);
        });
        test("should return false if the sha not matched", async () => {
            await expect(validateSha1(join(root, "options.txt"), "abc"))
                .resolves
                .toEqual(false);
        });
        test("should return true if the sha matched", async () => {
            await expect(validateSha1(join(root, "options.txt"), "e1719c99026ae3714ea24f13f50cdf6894844511"))
                .resolves
                .toEqual(true);
        });
        test("should return true if the sha not given and file existed in non strict", async () => {
            await expect(validateSha1(join(root, "options.txt")))
                .resolves
                .toEqual(true);
        });
        test("should return false if the sha not given and file existed in strict", async () => {
            await expect(validateSha1(join(root, "options.txt"), undefined, true))
                .resolves
                .toEqual(false);
        });
    });
    describe("#getSha1", () => {
        test("should get sha1", async () => {
            await expect(getSha1(join(root, "options.txt")))
                .resolves
                .toEqual("e1719c99026ae3714ea24f13f50cdf6894844511");
        });
    });
});
