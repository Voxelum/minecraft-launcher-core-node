/**
 * @type {import('@jest/types/build/Config').InitialOptions}
 */
const config = {
    moduleFileExtensions: [
        "ts",
        "js",
        "json"
    ],
    modulePaths: [
        "packages/client",
        "packages/core",
        "packages/curseforge",
        "packages/forge-site-parser",
        "packages/gamesetting",
        "packages/installer",
        "packages/mod-parser",
        "packages/model",
        "packages/nbt",
        "packages/resourcepack",
        "packages/server-info",
        "packages/system",
        "packages/task",
        "packages/text-component",
        "packages/unzip",
        "packages/user",
        "packages/world"
    ],
    preset: 'ts-jest',
    testEnvironment: "./scripts/test-env.js",
    testSequencer: "./scripts/test-sequencer.js",
    testRegex: "packages/.*test\\.ts",
    transform: {
        "^.+\\.(ts|tsx)?$": "ts-jest"
    },
    coveragePathIgnorePatterns: ['packages/asm'],
    globals: {
        "ts-jest": {
            tsconfig: "./tsconfig.json",
            diagnostics: {
                warnOnly: true
            }
        }
    }
}

module.exports = config;