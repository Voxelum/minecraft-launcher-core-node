# Common Module

[![npm version](https://img.shields.io/npm/v/@xmcl/system.svg)](https://www.npmjs.com/package/@xmcl/system)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Build Status](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Release%20Pre-Check/badge.svg)

A unified API to read directory or zip.

Support both nodejs and browser.

You can do read operations for zip or directory in same API:

```ts
import { System } from "@xmcl/system";

let filePath = "/path/to/dir/"
const fs = await System.openFileSystem(filePath);
fs.readFile("a.txt"); // read /path/to/dir/a.txt

let zipPath = "/path/to/file.zip"
const fs = await System.openFileSystem(zipPath);
fs.readFile("a.txt"); // read a.txt in the file.zip!
```


