import * as os from "os";

const platform = os.platform();
let osName: string = "unknown";
switch (platform) {
    case "darwin":
        osName = "osx";
        break;
    case "linux":
        osName = "linux";
        break;
    case "win32":
        osName = "windows";
        break;
}

let arch = os.arch();
if (arch.startsWith("x")) { arch = arch.substring(1); }
export default {
    arch,
    name: osName,
    version: os.release(),
};
