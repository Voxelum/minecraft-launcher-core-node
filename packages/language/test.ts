import * as path from "path";
import { Language } from "./index";

describe("Language", () => {
    const root = path.normalize(path.join(__dirname, "..", "..", "mock"));

    test.skip("no successful version reading", () => {
        return Language.read(root, "1.12").catch((e) => {
            expect(e.type).toEqual("MissingVersionIndex");
        });
    });
});
