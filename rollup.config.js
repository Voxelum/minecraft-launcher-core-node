import fs from 'fs';
import typescript from 'rollup-plugin-typescript2';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';

let packages = fs.readdirSync('packages')

function generate(dir) {
    let typescriptPlugin = typescript({
        tsconfigOverride: { compilerOptions: { declaration: false } }
    })
    let cjsPlugin = commonjs();

    let internals = fs.readdirSync(`${dir}`)
        .filter((p) => fs.statSync(`${dir}/${p}`).isDirectory())
        .filter((p) => fs.existsSync(`${dir}/${p}/package.json`));
    let resolvePlugin = resolve();

    let packageJson = JSON.parse(fs.readFileSync(`${dir}/package.json`).toString());
    let deps = Object.keys(packageJson.dependencies || {});
    let result = [
        {
            input: `${dir}/index.ts`,
            output: [{
                file: `${dir}/index.cjs.js`,
                format: 'cjs'
            }],
            plugins: [typescriptPlugin, cjsPlugin, resolvePlugin, json()],
            external: [...internals.map(s => `./${s}`), 'uuid/v4', 'fs', 'util', 'url', 'os', 'http', 'https', 'path', 'events', 'crypto', 'stream', 'net', 'zlib', 'child_process', ...deps],
        },
    ]
    if (packageJson.browser) {
        result.push({
            input: `${dir}/index.browser.ts`,
            output: [{
                file: `${dir}/index.browser.cjs.js`,
                format: 'cjs'
            }],
            plugins: [typescriptPlugin, cjsPlugin, resolve({ browser: true, preferBuiltins: false }), json()],
            external: ['uuid/v4', 'fs', 'util', 'url', 'os', 'http', 'https', 'path', 'events', 'crypto', 'stream', 'net', 'zlib', 'child_process', ...deps],
        });
    }
    if (internals.length !== 0) {
        internals.forEach((inter) => {
            result.push(...generate(`${dir}/${inter}`));
        });
    }
    return result;
}

let configs = [];
/**
 * @param {string} dirName 
 */
function getConfig(dirName) {
    try {
        let config = generate(`packages/${dirName}`);
        configs.push(...config);
    } catch (e) {
        console.error(e);
        console.log(`Skip ${dirName}`);
    }
}

packages.forEach(getConfig)

export default configs;
