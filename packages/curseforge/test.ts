import nock from "nock";
import {
    getMod,
    // getAddonDatabaseTimestamp,
    // getAddonDescription,
    // getAddonFileInfo,
    // getAddonFileChangelog,
    // getAddonFileDownloadURL,
    // getAddonFiles,
    // getAddonInfo,
    // getAddons,
    // getCategories,
    // getCategoryTimestamp,
    // getFeaturedAddons,
} from "./index";

describe("Curseforge", () => {
    test.skip("#getMod", async () => {
        nock("https://api.curseforge.com").get("/v1/mods/310806")
            .reply(200, {});
        await getMod(310806);
        expect(nock.isDone()).toBeTruthy();
    });
    // test("#getAddons", async () => {
    //     nock("https://addons-ecs.forgesvc.net").post("/api/v2/addon", [310806, 2])
    //         .reply(200, []);
    //     await getAddons([310806, 2]);
    //     expect(nock.isDone()).toBeTruthy();
    // });
    // test("#getAddonDescription", async () => {
    //     nock("https://addons-ecs.forgesvc.net").get("/api/v2/addon/310806/description")
    //         .reply(200, "");
    //     await getAddonDescription(310806);
    //     expect(nock.isDone()).toBeTruthy();
    // });
    // test("#getAddonDescription", async () => {
    //     nock("https://addons-ecs.forgesvc.net").get("/api/v2/addon/310806/file/2657461/changelog")
    //         .reply(200, "");
    //     await getAddonFileChangelog(310806, 2657461);
    //     expect(nock.isDone()).toBeTruthy();
    // });
    // test("#getAddonFileInfo", async () => {
    //     nock("https://addons-ecs.forgesvc.net").get("/api/v2/addon/310806/file/2657461")
    //         .reply(200, {});
    //     await getAddonFileInfo(310806, 2657461);
    //     expect(nock.isDone()).toBeTruthy();
    // });
    // test("#getAddonFileDownloadURL", async () => {
    //     nock("https://addons-ecs.forgesvc.net").get("/api/v2/addon/310806/file/2657461/download-url")
    //         .reply(200, "");
    //     await getAddonFileDownloadURL(310806, 2657461);
    //     expect(nock.isDone()).toBeTruthy();
    // });
    // test("#getAddonFiles", async () => {
    //     nock("https://addons-ecs.forgesvc.net").get("/api/v2/addon/310806/files")
    //         .reply(200, []);
    //     await getAddonFiles(310806);
    //     expect(nock.isDone()).toBeTruthy();
    // });
    // test("#getAddonDatabaseTimestamp", async () => {
    //     nock("https://addons-ecs.forgesvc.net").get("/api/v2/addon/timestamp").reply(200, "\"2019-06-09T23:34:29.103Z\"");
    //     await getAddonDatabaseTimestamp();
    //     expect(nock.isDone()).toBeTruthy();
    // });
    // test("#getCategoryTimestamp", async () => {
    //     nock("https://addons-ecs.forgesvc.net").get("/api/v2/category/timestamp").reply(200, "\"2019-06-09T23:34:29.103Z\"");
    //     await getCategoryTimestamp();
    //     expect(nock.isDone()).toBeTruthy();
    // });
    // test("#getCategories", async () => {
    //     nock("https://addons-ecs.forgesvc.net").get("/api/v2/category").reply(200, []);
    //     await getCategories();
    //     expect(nock.isDone()).toBeTruthy();
    // });
    // describe("#getFeaturedAddons", () => {
    //     test("should fill default params", async () => {
    //         nock("https://addons-ecs.forgesvc.net").post("/api/v2/addon/featured", {
    //             "GameId": 432,
    //             "addonIds": [],
    //             "featuredCount": 4,
    //             "popularCount": 4,
    //             "updatedCount": 4
    //         }).reply(200, []);
    //         await getFeaturedAddons();
    //         expect(nock.isDone()).toBeTruthy();
    //     });
    //     test("should fill params", async () => {
    //         nock("https://addons-ecs.forgesvc.net").post("/api/v2/addon/featured", {
    //             "GameId": 431,
    //             "addonIds": [],
    //             "featuredCount": 12,
    //             "popularCount": 11,
    //             "updatedCount": 10
    //         }).reply(200, []);
    //         await getFeaturedAddons({
    //             featuredCount: 12,
    //             popularCount: 11,
    //             updatedCount: 10,
    //             gameId: 431,
    //         });
    //         expect(nock.isDone()).toBeTruthy();
    //     });
    // });
    // describe("#searchAddon", () => {
    //     test("should use default params", async () => {
    //         nock("https://addons-ecs.forgesvc.net")
    //             .get("/api/v2/addon/search?gameId=432&gameVersion=&index=0&pageSize=12&sort=0&searchFilter=aaa")
    //             .reply(200, {});
    //         await searchAddons({ searchFilter: "aaa" });
    //         expect(nock.isDone()).toBeTruthy();
    //     });
    //     test("should pass params", async () => {
    //         nock("https://addons-ecs.forgesvc.net")
    //             .get("/api/v2/addon/search?gameId=422&gameVersion=1.1&index=3&pageSize=3&sort=2&searchFilter=jei&sectionId=10&categoryId=0")
    //             .reply(200, {});
    //         await searchAddons({
    //             searchFilter: "jei",
    //             categoryId: 0,
    //             gameId: 422,
    //             gameVersion: "1.1",
    //             index: 3,
    //             pageSize: 3,
    //             sectionId: 10,
    //             sort: 2,
    //         });
    //         expect(nock.isDone()).toBeTruthy();
    //     });
    // });

    // afterEach(() => {
    //     nock.cleanAll()
    //     nock.enableNetConnect()
    // })
});
