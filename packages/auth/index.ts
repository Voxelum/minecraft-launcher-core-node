import Auth, { setRequester, GameProfile } from "./auth";
import { extend, post } from "got";

function fetch(apiPath: string, body: any) {
    return post(apiPath, { method: "POST", json: true, encoding: "utf-8", body, throwHttpErrors: false });
}
fetch.extends = function (option: { baseUrl: string }) {
    const client = extend({ baseUrl: option.baseUrl, json: true, method: "POST", encoding: "utf-8", throwHttpErrors: false });
    return function fetch(apiPath: string, body: any) {
        return client(apiPath, { body });
    }
};

setRequester(fetch as any);

export { Auth, GameProfile };

export default Auth;
