import Auth, { setRequester } from "./auth";
import { extend, post } from "got";

function fetch(apiPath: string, body: any) {
    return post(apiPath, { json: true, encoding: "utf-8", body });
}
fetch.extends = function (option: { baseUrl: string }) {
    return extend({ baseUrl: option.baseUrl, json: true, method: "POST", encoding: "utf-8" });
};

setRequester(fetch as any);

export { Auth };

export default Auth;
