import Auth, { setRequester } from "./auth";

async function post(apiPath: string, body: any) {
    const response = await fetch(apiPath, {
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json"
        },
        method: "POST"
    });
    const respBody = await response.json();
    return {
        body: respBody,
        statusCode: response.status,
        statusMessage: response.statusText,
    }
}
post.extends = function (option: { baseUrl: string }) {
    return function (apiPath: string, body: any) {
        return post(option.baseUrl + apiPath, body);
    }
};

setRequester(post as any);

export { Auth };

export default Auth;
