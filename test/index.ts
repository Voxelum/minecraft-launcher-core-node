import * as path from "path";

declare module "mocha" {
    interface IHookCallbackContext {
        assets: string;
        gameDirectory: string;
    }

    interface ISuiteCallbackContext {
        assets: string;
        gameDirectory: string;
    }
    interface ITestCallbackContext {
        assets: string;
        gameDirectory: string;
    }
}

before(function() {
    this.assets = path.normalize(path.join(__dirname, "..", "..", "assets"));
    this.gameDirectory = path.join(this.assets, "temp");
});
