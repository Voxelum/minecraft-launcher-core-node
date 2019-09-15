import { TextComponent, TextFormatting } from "./index";

describe("TextComponent", () => {
    test("normal text converting", () => {
        const raw = "testCommon tesxt";
        expect(TextComponent.from(raw).unformatted).toEqual(raw);
    });
    test("string to TextComponent and reverse convention", () => {
        const raw = "§1colored§r";
        expect(TextComponent.from(raw).formatted).toEqual(raw);
    });
});

describe("TextFormatting", () => {
    describe("#getValueByChar", () => {
        test("should be able to get by char", () => {
            expect(TextFormatting.getValueByChar("9"))
                .toEqual(TextFormatting.BLUE);
        });
        test("should return Black for non-existed char", () => {
            expect(TextFormatting.getValueByChar("z"))
                .toEqual(TextFormatting.BLACK);
        });
    });
    describe("#getValueByName", () => {
        test("should be able to get by friendly name", () => {
            expect(TextFormatting.getValueByName("dark_aqua"))
                .toEqual(TextFormatting.DARK_AQUA);
        });
        test("should return null for non-existed name", () => {
            expect(TextFormatting.getValueByName("dark_aquaaa"))
                .toBeUndefined();
        });
    });

});
