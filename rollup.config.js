import fs, { existsSync, readdirSync } from "fs";
import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import { join } from "path";

/**
 * @param {string} packagePath
 */
function generate(packagePath) {
  if (!fs.existsSync(`${packagePath}/package.json`)) {
    return
  }
  const packageJson = JSON.parse(
    fs.readFileSync(`${packagePath}/package.json`).toString()
  );
  const deps = Object.keys(packageJson.dependencies || {}).concat(
    Object.keys(packageJson.peerDependencies || {})
  );
  const external = [
    // "uuid/dist/esm-node/sha1",
    // "uuid/dist/esm-node/v35",
    // "uuid/dist/sha1",
    // "uuid/dist/v35",
    // "uuid/dist/esm-browser/sha1",
    // "uuid/dist/esm-browser/v35",
    "fs",
    "util",
    "url",
    "os",
    "http",
    "https",
    "path",
    "events",
    "crypto",
    "stream",
    "net",
    "zlib",
    "constants",
    "child_process",
    "dgram",
    ...deps,
  ];
  /**
   * @type {import('rollup').RollupOptions[]}
   */
  const result = [
    {
      input: `${packagePath}/index.ts`,
      output: [
        {
          sourcemap: true,
          dir: `${packagePath}/dist`,
          entryFileNames: (chunk) => `${chunk.name}.esm.js`,
          format: "esm",
        },
        {
          sourcemap: true,
          dir: `${packagePath}/dist`,
          entryFileNames: (chunk) => `${chunk.name}.js`,
          format: "cjs",
        },
      ],
      plugins: [
        nodeResolve({ browser: false, preferBuiltins: true }),
        typescript({
          tsconfig: join(packagePath, "tsconfig.json"),
          declaration: true,
          declarationMap: true,
          sourceMap: true,
          inlineSourceMap: true,
          inlineSources: true,
          outDir: `${packagePath}/dist`,
        }),
        commonjs(),
        json(),
      ],
      external: (source, importer, isResolved) => {
        if (external.indexOf(source) !== -1) {
          return true;
        }
        if (source.startsWith("three")) {
          return true;
        }
        return false;
      },
    },
  ];
  const existedBrowserEntry = existsSync(`${packagePath}/index.browser.ts`);
  if (packageJson.browser) {
    result.push({
      input: existedBrowserEntry
        ? `${packagePath}/index.browser.ts`
        : `${packagePath}/index.ts`,
      output: [
        {
          file: `${packagePath}/dist/index.browser.js`,
          sourcemap: true,
          format: "esm",
        },
      ],
      plugins: [
        nodeResolve({ browser: true, preferBuiltins: false }),
        typescript({
          tsconfig: join(packagePath, "tsconfig.json"),
          declaration: false,
          declarationMap: false,
          sourceMap: true,
          inlineSourceMap: true,
          inlineSources: true,
          lib: ["dom"],
        }),
        commonjs(),
        json(),
      ],
      external,
    });
  }
  return result;
}

const options = readdirSync("./packages")
  .map((p) => join(__dirname, "packages", p))
  .map(generate)
  .filter(v => !!v)
  .reduce((all, cur) => all.concat(cur));

export default options;
