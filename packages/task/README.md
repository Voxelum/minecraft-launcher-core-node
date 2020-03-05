# Task Module

[![npm version](https://img.shields.io/npm/v/@xmcl/task.svg)](https://www.npmjs.com/package/@xmcl/task)
[![Downloads](https://img.shields.io/npm/dm/@xmcl/task.svg)](https://npmjs.com/@xmcl/task)
[![Install size](https://packagephobia.now.sh/badge?p=@xmcl/task)](https://packagephobia.now.sh/result?p=@xmcl/task)
[![npm](https://img.shields.io/npm/l/@xmcl/minecraft-launcher-core.svg)](https://github.com/voxelum/minecraft-launcher-core-node/blob/master/LICENSE)
[![Build Status](https://github.com/voxelum/minecraft-launcher-core-node/workflows/Build/badge.svg)](https://github.com/Voxelum/minecraft-launcher-core-node/actions?query=workflow%3ABuild)

This is a helper module for Minecraft Launcher. See the github home page for more information.

## Usage

### Progress Moniting

You can use `@xmcl/task` model to track the progress of a task. *In the launcher, they are majorly download task.*

The module is designed with event based. Use event to track what's happening.

The module won't mutate the task node, as many of us use the state management things required `Unidirectional Data Flow`.

Therefore you can just treat the `TaskRuntime` object a stateless event emitter.

```ts
    import { Task, TaskRuntime, TaskHandle } from "@xmcl/task";

    const runtime: TaskRuntime = Task.createRuntime();
    const task: Task<YourResultType>; // your task
    
    runtime.on("update", ({ progress, total, message }, node) => {
        // handle the progress, total update.
        // message usually the current downloading url.
    });
    runtime.on("execute", (node, parent) => {
        const name = child.name; // name is just the name to create the task

        const newChildPath = child.path; // path is the chaining all parents' name togather
        // if parent name is 'install'
        // and child name is 'json'
        // the path will be 'install.json'

        const arguments = child.arguments; // argument is optional
        // normally the arguments is some values that helps you to localized
        // like 'library' task in during install library
        // it will provide a 'lib' property which is the name of the library
    });

    runtime.on("finish", (result, node) => {
        // every node, parent or child will emit finish event when it finish
    });

    runtime.on("node-error", (error, node) => {
        // emit when a task node (parent or child) failed
    });

    const handle: TaskHandle<YourResultType> = runtime.submit(task);
    await handle.wait();
    // the error will still reject to the promise
```
