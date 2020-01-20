import { launch } from '@xmcl/core';
import { login, Authentication, offline } from '@xmcl/user';

let authentication: Authentication = offline("offline-user-name");
let gamePath: string = "your game path";
let javaPath: string = "your java path";
let version: string = "1.14.4";

async function userLogin(username: string, password: string) {
    authentication = await login({ username, password });
}

async function gameLaunch() {
    const process = await launch({
        accessToken: authentication.accessToken,
        gamePath,
        javaPath,
        version,
        gameProfile: authentication.selectedProfile,
    });
    process.stdout.on('data', (b) => {
        // print mc output
        console.log(b.toString());
    });
    process.stderr.on('data', (b) => {
        // print mc err output
        console.log(b.toString());
    });
}

