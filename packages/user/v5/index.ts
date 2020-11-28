
// @ts-expect-error
import * as sha1 from "uuid/dist/sha1";
const func = sha1.default;
export { func as sha1 };
// @ts-expect-error
export { default as v35 } from "uuid/dist/v35";
