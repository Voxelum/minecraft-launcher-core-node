import { BaseTask, TaskState, Task, task, TaskContext, CancelledError } from "./index";

function wait(time: number) {
    return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, time);
    });
}

class TimeoutTask extends BaseTask<void> {
    private remaining: number;
    private handle!: NodeJS.Timeout;

    protected async runTask(): Promise<void> {
        if (this.remaining > 0) {
            return new Promise((resolve, reject) => {
                this.handle = setInterval(() => {
                    if (this.isCancelled) {
                        clearInterval(this.handle);
                        reject(new CancelledError());
                    } else if (this.isPaused) {
                        clearInterval(this.handle);
                        reject();
                    } else if (this.remaining > 0) {
                        this.remaining -= 1;
                        this._progress += 1;
                        this.update(1);
                    } else {
                        clearInterval(this.handle);
                        resolve();
                    }
                }, 1000);
            });
        }
    }
    protected async cancelTask(): Promise<void> {
        clearInterval(this.handle);
    }
    protected async pauseTask(): Promise<void> {
        clearInterval(this.handle);
    }
    protected async resumeTask(): Promise<void> {
    }

    constructor(_total: number) {
        super();
        this._total = _total;
        this.remaining = _total;
    }
}

class MockTask extends BaseTask<void> {
    public context: TaskContext = {};
    public _promise: Promise<void> = new Promise(() => {});
    constructor(
        public runTask: () => Promise<void> = jest.fn().mockReturnValue(Promise.resolve()),
        public cancelTask: () => Promise<void> = jest.fn().mockReturnValue(Promise.resolve()),
        public pauseTask: () => Promise<void> = jest.fn().mockReturnValue(Promise.resolve()),
        public resumeTask: () => Promise<void> = jest.fn().mockReturnValue(Promise.resolve()),
    ) {
        super();
    }
}

describe("Task", () => {
    describe("task", () => {
        test("should create task routine", () => {
            const fn = jest.fn();
            const test = task("test", fn);
            expect(test.name).toEqual("test");
            expect(test.param).toEqual({});
            expect(test.executor).toEqual(fn);
        });
        test("should create task routine with param", () => {
            const fn = jest.fn();
            const param = { a: 1 }
            const test = task("test", fn, param);
            expect(test.name).toEqual("test");
            expect(test.param).toEqual(param);
            expect(test.executor).toEqual(fn);
        });
    });
    describe("TaskBase", () => {

        describe("constructor", () => {
            it("should set state to idle", () => {
                const task = new MockTask();
                expect(task.state).toEqual(TaskState.Idle);
                expect(task.progress).toEqual(0);
                expect(task.total).toEqual(-1);
                expect(task.from).toBeUndefined();
                expect(task.to).toBeUndefined();
                expect(task.id).toEqual(0);
            });
        });
        describe("#start", () => {
            it("should call the run", () => {
                const task = new MockTask();
                task.start();
                expect(task.runTask).toBeCalledTimes(1);
            });
            it("should not call the run twice", () => {
                const task = new MockTask();
                task.start();
                task.start();
                expect(task.runTask).toBeCalledTimes(1);
            });
            it("should set context", () => {
                const task = new MockTask();
                const ctx = { hello: Symbol() };
                task.start(ctx as any);
                expect((task.context as any).hello).toEqual(ctx.hello)
            });
            it("should set state to running", () => {
                const task = new MockTask();
                task.start();
                expect(task.state).toEqual(TaskState.Running);
            });
        });
        describe("#pause", () => {
            it("should call pauseTask and set task to pause state", async () => {
                const task = new MockTask(() => wait(100));
                const fn = jest.fn();
                task.start({
                    onPaused(task) {
                        fn(task.state);
                    },
                });
                await task.pause();
                expect(task.pauseTask).toBeCalledTimes(1);
                expect(task.state).toEqual(TaskState.Paused);
                expect(task.isPaused).toBe(true);
                expect(fn).toBeCalledWith(TaskState.Paused);
            });
            it("should not pause if the task is not started", async () => {
                const task = new MockTask();
                await task.pause();
                expect(task.pauseTask).toBeCalledTimes(0);
                expect(task.state).toEqual(TaskState.Idle);
                expect(task.isPaused).toBe(false);
            });
            it("should not call pauseTask twice if task is paused to pause the task", async () => {
                const task = new MockTask();
                task.start();
                await task.pause();
                await task.pause();
                expect(task.pauseTask).toBeCalledTimes(1);
            });
        });
        describe("#resume", () => {
            it("should not work if the state is not running", async () => {
                const task = new MockTask(() => wait(100));
                await task.resume();
                expect(task.resumeTask).toBeCalledTimes(0);
                expect(task.state).toBe(TaskState.Idle);
            });
            it("should resume task and set state to running", async () => {
                const task = new MockTask(() => wait(100));
                const fn = jest.fn();
                task.start({
                    onResumed(task) {
                        fn(task.state);
                    }
                });
                await task.pause();
                expect(task.state).toEqual(TaskState.Paused);
                expect(task.isPaused).toBe(true);
                await task.resume();
                expect(task.resumeTask).toBeCalled();
                expect(task.state).toEqual(TaskState.Running);
                expect(task.isPaused).toBe(false);
                expect(task.isRunning).toBe(true);
                expect(fn).toBeCalledWith(TaskState.Running);
            });
        });
        describe("#cancel", () => {
            it("should cancel idle task", async () => {
                const task = new MockTask(() => wait(100));
                await task.cancel();
                expect(task.isCancelled).toBe(true);
                expect(task.state).toBe(TaskState.Cancelled);
                expect(task.cancelTask).toBeCalledTimes(1);
            });
            it("should call onCancel and set state to cancelled", async () => {
                const task = new MockTask(() => wait(100));
                const fn = jest.fn();
                task.start({
                    onCancelled(task) {
                        fn(task.state)
                    }
                });
                await task.cancel();
                expect(task.isCancelled).toBe(true);
                expect(task.state).toBe(TaskState.Cancelled);
                expect(task.cancelTask).toBeCalledTimes(1);
                expect(fn).toBeCalledWith(TaskState.Cancelled);
            });
        })
        describe("#startAndWait", () => {
            it("should call start and return wait", () => {
                const task = new MockTask();
                task.start = jest.fn();
                const promise = task.startAndWait();
                expect(task.start).toBeCalledTimes(1);
                expect(promise).toEqual(task._promise)
            });
        });
    })
    describe("TaskRoutine", () => {
        describe("#startAndWait", () => {
            it("should run executor", async () => {
                const fn = jest.fn();
                const param = { a: 1 }
                const test = task("test", fn, param);
                expect(test.name).toEqual("test");
                expect(test.param).toEqual(param);
                expect(test.executor).toEqual(fn);
                await test.startAndWait();
                expect(fn).toBeCalled();
            });
        });
        describe("events", () => {
            jest.setTimeout(10000);
            it("should propagate the update event", async () => {
                const t = task("a", async function () {
                    const b = new TimeoutTask(2).setName("timeout");
                    await this.yield(b);
                });
                const events: any[] = [];
                const noop = jest.fn();
                function pushTask(type: string) {
                    return (task: Task, chunkSize: number = 0) => events.push({ type, chunkSize, name: task.name, progress: task.progress, total: task.total, path: task.path });
                }
                await t.startAndWait({
                    onFailed: noop,
                    onResumed: noop,
                    onPaused: noop,
                    onCancelled: noop,
                    onStart: pushTask("start"),
                    onSucceed: pushTask("success"),
                    onUpdate: pushTask("update"),
                });
                expect(noop).not.toBeCalled();
                expect(events).toStrictEqual([
                    { type: "start", progress: 0, total: -1, chunkSize: 0, path: "a", name: "a", },
                    { type: "start", progress: 0, total: 2, chunkSize: 0, path: "a.timeout", name: "timeout", },
                    { type: "update", progress: 1, total: 2, chunkSize: 1, path: "a.timeout", name: "timeout", },
                    { type: "update", progress: 1, total: 2, chunkSize: 1, path: "a", name: "a", },
                    { type: "update", progress: 2, total: 2, chunkSize: 1, path: "a.timeout", name: "timeout", },
                    { type: "update", progress: 2, total: 2, chunkSize: 1, path: "a", name: "a", },
                    { type: "success", progress: 2, total: 2, chunkSize: 0, path: "a.timeout", name: "timeout", },
                    { type: "success", progress: 2, total: 2, chunkSize: 0, path: "a", name: "a", }
                ]);
            });
            it("should propagate multiple update event in seq", async () => {
                const t = task("a", async function () {
                    const b = new TimeoutTask(2).setName("timeout1");
                    await this.yield(b);
                    const c = new TimeoutTask(2).setName("timeout2");
                    await this.yield(c);
                });
                const events: any[] = [];
                const noop = jest.fn();
                function pushTask(type: string) {
                    return (task: Task, chunkSize: number = 0) => events.push({ type, chunkSize, name: task.name, progress: task.progress, total: task.total, path: task.path });
                }
                await t.startAndWait({
                    onFailed: noop,
                    onResumed: noop,
                    onPaused: noop,
                    onCancelled: noop,
                    onStart: pushTask("start"),
                    onSucceed: pushTask("success"),
                    onUpdate: pushTask("update"),
                });
                expect(noop).not.toBeCalled();
                expect(events).toEqual([
                    { type: "start", progress: 0, total: -1, chunkSize: 0, path: "a", name: "a" },
                    { type: "start", progress: 0, total: 2, chunkSize: 0, path: "a.timeout1", name: "timeout1" },
                    { type: "update", progress: 1, total: 2, chunkSize: 1, path: "a.timeout1", name: "timeout1" },
                    { type: "update", progress: 1, total: 2, chunkSize: 1, path: "a", name: "a" },
                    { type: "update", progress: 2, total: 2, chunkSize: 1, path: "a.timeout1", name: "timeout1" },
                    { type: "update", progress: 2, total: 2, chunkSize: 1, path: "a", name: "a" },
                    { type: "success", progress: 2, total: 2, chunkSize: 0, path: "a.timeout1", name: "timeout1" },
                    { type: "start", progress: 0, total: 2, chunkSize: 0, path: "a.timeout2", name: "timeout2" },
                    { type: "update", progress: 1, total: 2, chunkSize: 1, path: "a.timeout2", name: "timeout2" },
                    { type: "update", progress: 3, total: 4, chunkSize: 1, path: "a", name: "a" },
                    { type: "update", progress: 2, total: 2, chunkSize: 1, path: "a.timeout2", name: "timeout2" },
                    { type: "update", progress: 4, total: 4, chunkSize: 1, path: "a", name: "a" },
                    { type: "success", progress: 2, total: 2, chunkSize: 0, path: "a.timeout2", name: "timeout2" },
                    { type: "success", progress: 4, total: 4, chunkSize: 0, path: "a", name: "a" }
                ]);
            });
            it("should propagate multiple update event in batch", async () => {
                const t = task("a", async function () {
                    const b = new TimeoutTask(2).setName("timeout1");
                    const c = new TimeoutTask(2).setName("timeout2");
                    await Promise.all([this.yield(c), this.yield(b)]);
                });
                const events: any[] = [];
                const noop = jest.fn();
                function pushTask(type: string) {
                    return (task: Task, chunkSize: number = 0) => events.push({ type, chunkSize, name: task.name, progress: task.progress, total: task.total, path: task.path });
                }
                await t.startAndWait({
                    onFailed: noop,
                    onResumed: noop,
                    onPaused: noop,
                    onCancelled: noop,
                    onStart: pushTask("start"),
                    onSucceed: pushTask("success"),
                    onUpdate: pushTask("update"),
                });
                expect(events).toEqual([
                    { type: "start", progress: 0, total: -1, chunkSize: 0, path: "a", name: "a" },
                    { type: "start", progress: 0, total: 2, chunkSize: 0, path: "a.timeout2", name: "timeout2" },
                    { type: "start", progress: 0, total: 2, chunkSize: 0, path: "a.timeout1", name: "timeout1" },
                    { type: "update", progress: 1, total: 2, chunkSize: 1, path: "a.timeout2", name: "timeout2" },
                    { type: "update", progress: 1, total: 4, chunkSize: 1, path: "a", name: "a" },
                    { type: "update", progress: 1, total: 2, chunkSize: 1, path: "a.timeout1", name: "timeout1" },
                    { type: "update", progress: 2, total: 4, chunkSize: 1, path: "a", name: "a" },
                    { type: "update", progress: 2, total: 2, chunkSize: 1, path: "a.timeout2", name: "timeout2" },
                    { type: "update", progress: 3, total: 4, chunkSize: 1, path: "a", name: "a" },
                    { type: "update", progress: 2, total: 2, chunkSize: 1, path: "a.timeout1", name: "timeout1" },
                    { type: "update", progress: 4, total: 4, chunkSize: 1, path: "a", name: "a" },
                    { type: "success", progress: 2, total: 2, chunkSize: 0, path: "a.timeout2", name: "timeout2" },
                    { type: "success", progress: 2, total: 2, chunkSize: 0, path: "a.timeout1", name: "timeout1" },
                    { type: "success", progress: 4, total: 4, chunkSize: 0, path: "a", name: "a" }
                ]);
            });
        });
    });
    // describe("#create", () => {
    //     test("should return the correct root node in handle", async () => {
    //         const test = task("test", function test() { })
    //         const runtime = Task.createRuntime(Task.DEFAULT_STATE_FACTORY);
    //         const handle = runtime.submit(test);
    //         expect(handle.root).toBeTruthy();
    //         expect(handle.root.path).toEqual("test");
    //         expect(handle.root.name).toEqual("test");
    //     });
    //     test("should be able to create task with string", async () => {
    //         const test = task("test", function test() { })
    //         const runtime = Task.createRuntime();
    //         runtime.once("execute", (n) => {
    //             expect(n.path).toEqual("test");
    //             expect(n.name).toEqual("test");
    //         });
    //         await runtime.submit(test).wait();
    //     });
    //     test("should be able to create task with arguments", async () => {
    //         const test = task("test", function test() { }, { x: 1 })
    //         const runtime = Task.createRuntime(Task.DEFAULT_STATE_FACTORY);
    //         runtime.once("execute", (n) => {
    //             expect(n.arguments!.x).toBe(1);
    //             expect(n.path).toEqual("test");
    //             expect(n.name).toEqual("test");
    //         });
    //         await runtime.submit(test).wait();
    //     });
    //     test("should be able to create child task with arguments", async () => {
    //         const c = task("c", function c() { }, { x: 2 });
    //         const test = task("test", function test(ctx) { return ctx.execute(c) }, { x: 1 })

    //         const runtime = Task.createRuntime(Task.DEFAULT_STATE_FACTORY);
    //         const onExec = jest.fn();
    //         const onSuccess = jest.fn();
    //         runtime.on("execute", (ch) => {
    //             onExec();
    //             expect(ch.arguments!.x).toEqual(ch.name === "c" ? 2 : 1);
    //         });
    //         runtime.on("finish", () => {
    //             onSuccess();
    //         });

    //         const handle = runtime.submit(test);

    //         await handle.wait();
    //         expect(onExec).toBeCalledTimes(2);
    //         expect(onSuccess).toBeCalledTimes(2);
    //     });
    //     test("should extends parent argument", async () => {
    //         const c = task("c", function c() { }, {});
    //         const test = task("test", function test(ctx) { return ctx.execute(c) }, { x: 1 })

    //         const onSuccess = jest.fn();
    //         const onExec = jest.fn();

    //         const runtime = Task.createRuntime(Task.DEFAULT_STATE_FACTORY);
    //         runtime.on("execute", (ch) => {
    //             onExec();
    //             expect(ch.arguments!.x).toEqual(1);
    //         });
    //         runtime.on("finish", () => {
    //             onSuccess();
    //         });

    //         const handle = runtime.submit(test);

    //         await handle.wait();
    //         expect(onSuccess).toBeCalledTimes(2);
    //         expect(onExec).toBeCalledTimes(2);
    //     });
    // });
    // describe("#execute", () => {
    //     test("should fire finish event change", async () => {
    //         const runtime = Task.createRuntime();
    //         const monitor = jest.fn();
    //         runtime.on("finish", monitor);
    //         await expect(runtime.submit(task("test", function test() { return 1; }))
    //             .wait())
    //             .resolves
    //             .toEqual(1);
    //         expect(monitor).toBeCalledTimes(1);
    //     });
    //     test("should get correct parent execute event", async () => {
    //         const runtime = Task.createRuntime();
    //         const monitor = jest.fn();
    //         runtime.on("execute", (n, p) => {
    //             if (p) { monitor(p); }
    //         });
    //         await expect(runtime.submit(task("test", async function test(c) {
    //             await c.execute(task("child", () => { }));
    //             return 1;
    //         }))
    //             .wait())
    //             .resolves
    //             .toEqual(1);
    //         expect(monitor).toBeCalledTimes(1);
    //         expect(monitor).toBeCalledWith({ arguments: undefined, name: "test", path: "test" });
    //     });
    //     test("should get correct execute event", async () => {
    //         const runtime = Task.createRuntime();
    //         const monitor = jest.fn();
    //         runtime.on("execute", (n, p) => {
    //             monitor(n, p);
    //         });
    //         await expect(runtime.submit(task("test", async function test(c) {
    //             return 1;
    //         }))
    //             .wait())
    //             .resolves
    //             .toEqual(1);
    //         expect(monitor).toBeCalledTimes(1);
    //         expect(monitor).toBeCalledWith({ arguments: undefined, name: "test", path: "test" }, undefined);
    //     });
    //     test("should be able to catch error", async () => {
    //         const runtime = Task.createRuntime();
    //         const monitor = jest.fn();
    //         runtime.on("fail", (e) => {
    //             expect(e).toEqual(new Error("Fail"));
    //             monitor();
    //         });
    //         await expect(runtime.submit(task("test", function test() { throw new Error("Fail"); }))
    //             .wait())
    //             .rejects
    //             .toEqual(new Error("Fail"));
    //         expect(monitor).toBeCalledTimes(1);
    //     });
    // });
    // describe("#update", () => {
    //     test("should be able to update status", async () => {
    //         const runtime = Task.createRuntime();
    //         const monitor = jest.fn();
    //         runtime.on("update", ({ progress, total, message }) => {
    //             expect(progress).toEqual(2);
    //             expect(total).toEqual(10);
    //             expect(message).toEqual("hello");
    //             monitor();
    //         });
    //         const handle = runtime.submit(task("test", function test(c) {
    //             c.update(2, 10, "hello");
    //         }));
    //         await expect(handle.wait()).resolves.toBeUndefined();
    //         expect(monitor).toBeCalled();
    //     });
    // });

    // describe("#cancel", () => {
    //     test("should be able to cancel the task after execution", async () => {
    //         const runtime = Task.createRuntime(Task.DEFAULT_STATE_FACTORY);
    //         runtime.on("execute", (child, parent) => {
    //             if (parent) {
    //                 expect(child.name).toEqual("A");
    //             } else {
    //                 expect(child.name).toEqual("test");
    //             }
    //         });
    //         const monitor = jest.fn();
    //         runtime.on("cancel", monitor);
    //         const monitorA = jest.fn();
    //         const monitorB = jest.fn();
    //         const handle = runtime.submit(task("test", async (c) => {
    //             await c.execute(task("A", function A() { return wait(1000).then(monitorA); }));
    //             handle.cancel();
    //             await c.execute(task("", () => wait(1000).then(monitorB)));
    //         }));
    //         await expect(handle.wait())
    //             .rejects
    //             .toEqual(new Task.CancelledError());

    //         expect(monitor).toBeCalled();
    //         expect(monitorA).toBeCalled();
    //         expect(monitorB).not.toBeCalled();
    //     });
    // });
    // describe("#pause", () => {
    //     test("should be paused the task before it execute", async () => {
    //         const runtime = Task.createRuntime(Task.DEFAULT_STATE_FACTORY);
    //         const monitor = jest.fn();
    //         const task = runtime.submit(task("monitor", monitor));
    //         task.pause();
    //         await wait(100);
    //         expect(monitor).not.toBeCalled();
    //     });
    //     test("should be paused after the task execute", async () => {
    //         const aFunc = jest.fn();
    //         const bFunc = jest.fn();

    //         const runtime = Task.createRuntime(Task.DEFAULT_STATE_FACTORY);
    //         const task = runtime.submit(task("test", async function test(c) {
    //             await c.execute(task("aFunc", aFunc));
    //             task.pause();
    //             await c.execute(task("bFunc", bFunc));
    //         }));
    //         await wait(100);
    //         expect(aFunc).toBeCalled();
    //         expect(bFunc).not.toBeCalled();
    //     });
    //     test("should pause all task", async () => {
    //         const aFunc = jest.fn();
    //         const aResume = jest.fn();
    //         const bFunc = jest.fn();
    //         const bResume = jest.fn();

    //         const runtime = Task.createRuntime(Task.DEFAULT_STATE_FACTORY);
    //         const task = runtime.submit(task("test", async function test(c) {
    //             await c.execute(task("nested", async (c) => {
    //                 await Promise.all([
    //                     c.execute(task("aFunc", async function a(x) {
    //                         x.setup(() => {
    //                             aFunc();
    //                         }, () => {
    //                             aResume();
    //                         });
    //                         await wait(1000);
    //                     })),
    //                     c.execute(task("bFunc", async function a(x) {
    //                         x.setup(() => {
    //                             bFunc();
    //                         }, () => {
    //                             bResume();
    //                         });
    //                         await wait(1000);
    //                     }))
    //                 ]);
    //             }))

    //         }));
    //         setTimeout(() => {
    //             task.pause();
    //         }, 100);
    //         await wait(200);
    //         expect(aFunc).toBeCalled();
    //         expect(bFunc).toBeCalled();
    //         expect(aResume).not.toBeCalled();
    //         expect(bResume).not.toBeCalled();
    //         task.resume();
    //         expect(aResume).toBeCalled();
    //         expect(bResume).toBeCalled();
    //     });
    // });
    // describe("#resume", () => {
    //     test("should be able to resume task", async () => {
    //         const monitor = jest.fn();
    //         const runtime = Task.createRuntime();
    //         const task = runtime.submit(task("monitor", monitor));
    //         task.pause();
    //         await wait(10);
    //         expect(monitor).not.toBeCalled();
    //         task.resume();
    //         await wait(10);
    //         expect(monitor).toBeCalled();
    //     });
    // });
    // describe("monitoring", () => {
    //     function nestTask(ctx: Task.Context) {
    //         let p = 0;
    //         let t = 10;
    //         return new Promise((resolve) => {
    //             let handle = setInterval(() => {
    //                 ctx.update(p, t);
    //                 p += 1;
    //                 if (p === 10) {
    //                     clearInterval(handle);
    //                     resolve()
    //                 }
    //             }, 1);
    //         })
    //     }
    //     test("parent should update child progress", async () => {
    //         const runtime = Task.createRuntime();
    //         const progress = [] as string[];
    //         runtime.on("update", (p, n) => {
    //             progress.push(`${n.path}: ${p.progress}/${p.total}`);
    //         });
    //         const task = runtime.submit(task("monitor", async (c) => {
    //             await c.execute(task("1", nestTask), 50);
    //             await c.execute(task("2", nestTask), 50);
    //         }));
    //         await task.wait();
    //         expect(progress).toEqual([
    //             "monitor.1: 0/10",
    //             "monitor: 0/50",
    //             "monitor.1: 1/10",
    //             "monitor: 5/50",
    //             "monitor.1: 2/10",
    //             "monitor: 10/50",
    //             "monitor.1: 3/10",
    //             "monitor: 15/50",
    //             "monitor.1: 4/10",
    //             "monitor: 20/50",
    //             "monitor.1: 5/10",
    //             "monitor: 25/50",
    //             "monitor.1: 6/10",
    //             "monitor: 30/50",
    //             "monitor.1: 7/10",
    //             "monitor: 35/50",
    //             "monitor.1: 8/10",
    //             "monitor: 40/50",
    //             "monitor.1: 9/10",
    //             "monitor: 45/50",
    //             "monitor: 50/50",
    //             "monitor.2: 0/10",
    //             "monitor: 50/100",
    //             "monitor.2: 1/10",
    //             "monitor: 55/100",
    //             "monitor.2: 2/10",
    //             "monitor: 60/100",
    //             "monitor.2: 3/10",
    //             "monitor: 65/100",
    //             "monitor.2: 4/10",
    //             "monitor: 70/100",
    //             "monitor.2: 5/10",
    //             "monitor: 75/100",
    //             "monitor.2: 6/10",
    //             "monitor: 80/100",
    //             "monitor.2: 7/10",
    //             "monitor: 85/100",
    //             "monitor.2: 8/10",
    //             "monitor: 90/100",
    //             "monitor.2: 9/10",
    //             "monitor: 95/100",
    //             "monitor: 100/100",
    //         ]);
    //     });
    //     test("parent should update nested progress", async () => {
    //         const runtime = Task.createRuntime();
    //         const progress = [] as string[];
    //         runtime.on("update", (p, n) => {
    //             progress.push(`${n.path}: ${p.progress}/${p.total}`);
    //         });
    //         const task = runtime.submit(task("monitor", async (c) => {
    //             await c.execute(task("1", async (c) => {
    //                 c.update(0, 100);
    //                 await c.execute(task("1", nestTask), 50);
    //                 await c.execute(task("1", nestTask), 50);
    //             }), 100);
    //         }));
    //         await task.wait();
    //         expect(progress).toEqual([
    //             "monitor.1: 0/100",
    //             "monitor: 0/100",
    //             "monitor.1.1: 0/10",
    //             "monitor.1: 0/100",
    //             "monitor: 0/100",
    //             "monitor.1.1: 1/10",
    //             "monitor.1: 5/100",
    //             "monitor: 5/100",
    //             "monitor.1.1: 2/10",
    //             "monitor.1: 10/100",
    //             "monitor: 10/100",
    //             "monitor.1.1: 3/10",
    //             "monitor.1: 15/100",
    //             "monitor: 15/100",
    //             "monitor.1.1: 4/10",
    //             "monitor.1: 20/100",
    //             "monitor: 20/100",
    //             "monitor.1.1: 5/10",
    //             "monitor.1: 25/100",
    //             "monitor: 25/100",
    //             "monitor.1.1: 6/10",
    //             "monitor.1: 30/100",
    //             "monitor: 30/100",
    //             "monitor.1.1: 7/10",
    //             "monitor.1: 35/100",
    //             "monitor: 35/100",
    //             "monitor.1.1: 8/10",
    //             "monitor.1: 40/100",
    //             "monitor: 40/100",
    //             "monitor.1.1: 9/10",
    //             "monitor.1: 45/100",
    //             "monitor: 45/100",
    //             "monitor.1: 50/100",
    //             "monitor: 50/100",
    //             "monitor.1.1: 0/10",
    //             "monitor.1: 50/100",
    //             "monitor: 50/100",
    //             "monitor.1.1: 1/10",
    //             "monitor.1: 55/100",
    //             "monitor: 55.00000000000001/100",
    //             "monitor.1.1: 2/10",
    //             "monitor.1: 60/100",
    //             "monitor: 60/100",
    //             "monitor.1.1: 3/10",
    //             "monitor.1: 65/100",
    //             "monitor: 65/100",
    //             "monitor.1.1: 4/10",
    //             "monitor.1: 70/100",
    //             "monitor: 70/100",
    //             "monitor.1.1: 5/10",
    //             "monitor.1: 75/100",
    //             "monitor: 75/100",
    //             "monitor.1.1: 6/10",
    //             "monitor.1: 80/100",
    //             "monitor: 80/100",
    //             "monitor.1.1: 7/10",
    //             "monitor.1: 85/100",
    //             "monitor: 85/100",
    //             "monitor.1.1: 8/10",
    //             "monitor.1: 90/100",
    //             "monitor: 90/100",
    //             "monitor.1.1: 9/10",
    //             "monitor.1: 95/100",
    //             "monitor: 95/100",
    //             "monitor.1: 100/100",
    //             "monitor: 100/100",
    //             "monitor: 100/100",
    //         ]);
    //     });
    //     test("parent should update child progress without preset", async () => {
    //         const runtime = Task.createRuntime();
    //         const progress = [] as string[];
    //         runtime.on("update", (p, n) => {
    //             progress.push(`${n.path}: ${p.progress}/${p.total}`);
    //         });
    //         const task = runtime.submit(task("monitor", async (c) => {
    //             c.update(0, 100);
    //             await c.execute(task("1", nestTask), 50);
    //             await c.execute(task("2", nestTask), 50);
    //         }));
    //         await task.wait();
    //         expect(progress).toEqual([
    //             "monitor: 0/100",
    //             "monitor.1: 0/10",
    //             "monitor: 0/100",
    //             "monitor.1: 1/10",
    //             "monitor: 5/100",
    //             "monitor.1: 2/10",
    //             "monitor: 10/100",
    //             "monitor.1: 3/10",
    //             "monitor: 15/100",
    //             "monitor.1: 4/10",
    //             "monitor: 20/100",
    //             "monitor.1: 5/10",
    //             "monitor: 25/100",
    //             "monitor.1: 6/10",
    //             "monitor: 30/100",
    //             "monitor.1: 7/10",
    //             "monitor: 35/100",
    //             "monitor.1: 8/10",
    //             "monitor: 40/100",
    //             "monitor.1: 9/10",
    //             "monitor: 45/100",
    //             "monitor: 50/100",
    //             "monitor.2: 0/10",
    //             "monitor: 50/100",
    //             "monitor.2: 1/10",
    //             "monitor: 55/100",
    //             "monitor.2: 2/10",
    //             "monitor: 60/100",
    //             "monitor.2: 3/10",
    //             "monitor: 65/100",
    //             "monitor.2: 4/10",
    //             "monitor: 70/100",
    //             "monitor.2: 5/10",
    //             "monitor: 75/100",
    //             "monitor.2: 6/10",
    //             "monitor: 80/100",
    //             "monitor.2: 7/10",
    //             "monitor: 85/100",
    //             "monitor.2: 8/10",
    //             "monitor: 90/100",
    //             "monitor.2: 9/10",
    //             "monitor: 95/100",
    //             "monitor: 100/100",
    //         ]);
    //     });
    // });

});
