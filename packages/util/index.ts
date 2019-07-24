export * from "./fs";
export * from "./folder";

import * as folder from "./folder";
import * as fs from "./fs";

export default {
    ...fs,
    ...folder,
};
