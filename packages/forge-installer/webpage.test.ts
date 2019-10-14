import { vfs } from "@xmcl/util";
import * as path from "path";
import { ForgeWebPage } from "./forgeweb";
jest.mock("@xmcl/net");

describe("ForgeWebpage", () => {
    let mockNet: jest.Mocked<typeof import("@xmcl/net")>;
    jest.mock("@xmcl/net");
    beforeEach(() => {
        mockNet = jest.requireMock("@xmcl/net") as jest.Mocked<typeof import("@xmcl/net")>;
    });
    describe("#parse", () => {
        test("#parse", async () => {
            const content = await vfs.readFile(path.join(__dirname, "..", "..", "mock", "sample-forge.html"));
            const page = ForgeWebPage.parse(content.toString());
            expect(page).toBeTruthy();
            expect(page.versions).toHaveLength(3);
            expect(page.mcversion).toEqual("1.14.4");
            for (const ver of page.versions) {
                expect(ver.type).toBeTruthy();
                expect(ver.version).toBeTruthy();

                expect(ver.installer.sha1).toBeTruthy();
                expect(ver.installer.path).toBeTruthy();
                expect(ver.installer.md5).toBeTruthy();
            }
            const last = page.versions[page.versions.length - 1];
            expect(last.installer.md5).toEqual("2d24a32cce228d4cf3c42caf2e3cfe37");
            expect(last.installer.sha1).toEqual("80ffade96232940422cbaf218ce6d424fd9192f2");
            expect(last.installer.path).toEqual("http://files.minecraftforge.net/maven/net/minecraftforge/forge/1.14.4-28.0.4/forge-1.14.4-28.0.4-installer.jar");
        });
    });

    describe("#getWebPage", () => {
        test("Get Latest", async () => {
            mockNet.getIfUpdate.mockReturnValue(Promise.resolve({
                timestamp: "0",
            }));
            const page = await ForgeWebPage.getWebPage();

            expect(page).toBeTruthy();
            expect(mockNet.getIfUpdate).toHaveBeenCalled();
            expect(mockNet.getIfUpdate).toHaveBeenCalledWith("http://files.minecraftforge.net/maven/net/minecraftforge/forge/index.html", ForgeWebPage.parse, undefined);

        });
        test("Get Specific version", async () => {
            mockNet.getIfUpdate.mockReturnValue(Promise.resolve({
                timestamp: "0",
            }));
            const page = await ForgeWebPage.getWebPage({ mcversion: "1.12.2" });

            expect(page).toBeTruthy();
            expect(mockNet.getIfUpdate).toHaveBeenCalled();
            expect(mockNet.getIfUpdate).toHaveBeenCalledWith("http://files.minecraftforge.net/maven/net/minecraftforge/forge/index_1.12.2.html", ForgeWebPage.parse, undefined);
        });
    });
});
