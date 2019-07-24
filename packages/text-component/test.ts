import * as assert from "assert";
import { TextComponent } from "./index";

describe("TextComponent", () => {
    it("normal text converting", () => {
        const raw = "testCommon tesxt";
        assert.equal(TextComponent.from(raw).unformatted, raw);
    });
    it("string to TextComponent and reverse convention", () => {
        const raw = "§1colored§r";
        assert.equal(TextComponent.from(raw).formatted, raw);
    });
});
