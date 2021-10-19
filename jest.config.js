const path = require('path');

/**
 * @type {import('@jest/types/build/Config').InitialOptions}
 */
const config = {
  moduleFileExtensions: ["ts", "js", "json"],
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
    "packages/world",
  ],
  // testEnvironment: "./scripts/test-env.js",
  // testSequencer: "./scripts/test-sequencer.js",
  testRegex: "packages/.*test\\.ts",
  transform: {
    "^.+\\.(ts|tsx)?$": [
      "@swc-node/jest",
      {
        esModuleInterop: true,
        dynamicImport: true,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        sourceMap: true,
      },
    ],
  },
  coveragePathIgnorePatterns: ["packages/asm"],
  globals: {
    mockDir: path.normalize(path.join(__dirname, "mock")),
    tempDir: path.normalize(path.join(__dirname, "temp")),
    isCI: process.env.CI || process.env.GITHUB_WORKFLOW,
  },
};

module.exports = config;
