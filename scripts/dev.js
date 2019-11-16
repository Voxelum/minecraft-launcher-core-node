const ts = require("typescript");
const jest = require("jest");

const project = process.argv[2];

// const watchHost = ts.createWatchCompilerHost("tsconfig.json", undefined, ts.sys)
// ts.createWatchProgram(watchHost);
jest.run(["--watch", `packages/${project}`])
