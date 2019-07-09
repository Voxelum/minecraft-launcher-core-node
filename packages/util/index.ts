export * from "./fs";
export * from "./network";
export * from "./folder";

import * as folder from "./folder";
import * as fs from "./fs";
import * as network from "./network";

export default {
    ...fs,
    ...folder,
    ...network,
};
