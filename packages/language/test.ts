import * as assert from "assert";
import * as path from "path";
import { Language } from "./index";

before(function () {
    this.assets = path.normalize(path.join(__dirname, "..", "..", "assets"));
    this.gameDirectory = path.join(this.assets, "temp");
});

describe("Language", function () {
    it("no successful version reading", function () {
        return Language.read(path.join(this.gameDirectory), "1.12").catch((e) => {
            assert.equal(e.type, "MissingVersionIndex");
        });
    });
});
