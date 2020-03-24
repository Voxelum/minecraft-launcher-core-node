import { searchAddons } from "./index";

describe("Curseforge", () => {
    describe("#searchAddon", () => {
        test("Should be able to search", async () => {
            let result = await searchAddons({
                searchFilter: "jei"
            });
        });
    });
});
