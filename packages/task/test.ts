import { Task, task } from "./index";

function wait(time: number) {
    return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, time);
    });
}

describe("Task", () => {
    describe("#create", () => {
        test("should return the correct root node in handle", async () => {
            const test = Task.create("test", function test() { })
            const runtime = Task.createRuntime(Task.DEFAULT_STATE_FACTORY);
            const handle = runtime.submit(test);
            expect(handle.root).toBeTruthy();
            expect(handle.root.path).toEqual("test");
            expect(handle.root.name).toEqual("test");
        });
        test("should be able to create task with string", async () => {
            const test = Task.create("test", function test() { })
            const runtime = Task.createRuntime();
            runtime.once("execute", (n) => {
                expect(n.path).toEqual("test");
                expect(n.name).toEqual("test");
            });
            await runtime.submit(test).wait();
        });
        test("should be able to create task with arguments", async () => {
            const test = Task.create("test", function test() { }, { x: 1 })
            const runtime = Task.createRuntime(Task.DEFAULT_STATE_FACTORY);
            runtime.once("execute", (n) => {
                expect(n.arguments!.x).toBe(1);
                expect(n.path).toEqual("test");
                expect(n.name).toEqual("test");
            });
            await runtime.submit(test).wait();
        });
        test("should be able to create child task with arguments", async () => {
            const c = Task.create("c", function c() { }, { x: 2 });
            const test = Task.create("test", function test(ctx) { return ctx.execute(c) }, { x: 1 })

            const runtime = Task.createRuntime(Task.DEFAULT_STATE_FACTORY);
            const onExec = jest.fn();
            const onSuccess = jest.fn();
            runtime.on("execute", (ch) => {
                onExec();
                expect(ch.arguments!.x).toEqual(ch.name === "c" ? 2 : 1);
            });
            runtime.on("finish", () => {
                onSuccess();
            });

            const handle = runtime.submit(test);

            await handle.wait();
            expect(onExec).toBeCalledTimes(2);
            expect(onSuccess).toBeCalledTimes(2);
        });
        test("should extends parent argument", async () => {
            const c = Task.create("c", function c() { }, {});
            const test = Task.create("test", function test(ctx) { return ctx.execute(c) }, { x: 1 })

            const onSuccess = jest.fn();
            const onExec = jest.fn();

            const runtime = Task.createRuntime(Task.DEFAULT_STATE_FACTORY);
            runtime.on("execute", (ch) => {
                onExec();
                expect(ch.arguments!.x).toEqual(1);
            });
            runtime.on("finish", () => {
                onSuccess();
            });

            const handle = runtime.submit(test);

            await handle.wait();
            expect(onSuccess).toBeCalledTimes(2);
            expect(onExec).toBeCalledTimes(2);
        });
    });
    describe("#execute", () => {
        test("should fire finish event change", async () => {
            const runtime = Task.createRuntime();
            const monitor = jest.fn();
            runtime.on("finish", monitor);
            await expect(runtime.submit(Task.create("test", function test() { return 1; }))
                .wait())
                .resolves
                .toEqual(1);
            expect(monitor).toBeCalledTimes(1);
        });
        test("should get correct parent execute event", async () => {
            const runtime = Task.createRuntime();
            const monitor = jest.fn();
            runtime.on("execute", (n, p) => {
                if (p) { monitor(p); }
            });
            await expect(runtime.submit(Task.create("test", async function test(c) {
                await c.execute(task("child", () => { }));
                return 1;
            }))
                .wait())
                .resolves
                .toEqual(1);
            expect(monitor).toBeCalledTimes(1);
            expect(monitor).toBeCalledWith({ arguments: undefined, name: "test", path: "test" });
        });
        test("should get correct execute event", async () => {
            const runtime = Task.createRuntime();
            const monitor = jest.fn();
            runtime.on("execute", (n, p) => {
                monitor(n, p);
            });
            await expect(runtime.submit(Task.create("test", async function test(c) {
                return 1;
            }))
                .wait())
                .resolves
                .toEqual(1);
            expect(monitor).toBeCalledTimes(1);
            expect(monitor).toBeCalledWith({ arguments: undefined, name: "test", path: "test" }, undefined);
        });
        test("should be able to catch error", async () => {
            const runtime = Task.createRuntime();
            const monitor = jest.fn();
            runtime.on("fail", (e) => {
                expect(e).toEqual(new Error("Fail"));
                monitor();
            });
            await expect(runtime.submit(Task.create("test", function test() { throw new Error("Fail"); }))
                .wait())
                .rejects
                .toEqual(new Error("Fail"));
            expect(monitor).toBeCalledTimes(1);
        });
    });
    describe("#update", () => {
        test("should be able to update status", async () => {
            const runtime = Task.createRuntime();
            const monitor = jest.fn();
            runtime.on("update", ({ progress, total, message }) => {
                expect(progress).toEqual(2);
                expect(total).toEqual(10);
                expect(message).toEqual("hello");
                monitor();
            });
            const handle = runtime.submit(Task.create("test", function test(c) {
                c.update(2, 10, "hello");
            }));
            await expect(handle.wait()).resolves.toBeUndefined();
            expect(monitor).toBeCalled();
        });
    });

    describe("#cancel", () => {
        test("should be able to cancel the task after execution", async () => {
            const runtime = Task.createRuntime(Task.DEFAULT_STATE_FACTORY);
            runtime.on("execute", (child, parent) => {
                if (parent) {
                    expect(child.name).toEqual("A");
                } else {
                    expect(child.name).toEqual("test");
                }
            });
            const monitor = jest.fn();
            runtime.on("cancel", monitor);
            const monitorA = jest.fn();
            const monitorB = jest.fn();
            const handle = runtime.submit(Task.create("test", async (c) => {
                await c.execute(Task.create("A", function A() { return wait(1000).then(monitorA); }));
                handle.cancel();
                await c.execute(Task.create("", () => wait(1000).then(monitorB)));
            }));
            await expect(handle.wait())
                .rejects
                .toEqual(new Task.CancelledError());

            expect(monitor).toBeCalled();
            expect(monitorA).toBeCalled();
            expect(monitorB).not.toBeCalled();
        });
    });
    describe("#pause", () => {
        test("should be paused the task before it execute", async () => {
            const runtime = Task.createRuntime(Task.DEFAULT_STATE_FACTORY);
            const monitor = jest.fn();
            const task = runtime.submit(Task.create("monitor", monitor));
            task.pause();
            await wait(100);
            expect(monitor).not.toBeCalled();
        });
        test("should be paused after the task execute", async () => {
            const aFunc = jest.fn();
            const bFunc = jest.fn();

            const runtime = Task.createRuntime(Task.DEFAULT_STATE_FACTORY);
            const task = runtime.submit(Task.create("test", async function test(c) {
                await c.execute(Task.create("aFunc", aFunc));
                task.pause();
                await c.execute(Task.create("bFunc", bFunc));
            }));
            await wait(100);
            expect(aFunc).toBeCalled();
            expect(bFunc).not.toBeCalled();
        });
        test("should pause all task", async () => {
            const aFunc = jest.fn();
            const aResume = jest.fn();
            const bFunc = jest.fn();
            const bResume = jest.fn();

            const runtime = Task.createRuntime(Task.DEFAULT_STATE_FACTORY);
            const task = runtime.submit(Task.create("test", async function test(c) {
                await c.execute(Task.create("nested", async (c) => {
                    await Promise.all([
                        c.execute(Task.create("aFunc", async function a(x) {
                            x.setup(() => {
                                aFunc();
                            }, () => {
                                aResume();
                            });
                            await wait(1000);
                        })),
                        c.execute(Task.create("bFunc", async function a(x) {
                            x.setup(() => {
                                bFunc();
                            }, () => {
                                bResume();
                            });
                            await wait(1000);
                        }))
                    ]);
                }))

            }));
            setTimeout(() => {
                task.pause();
            }, 100);
            await wait(200);
            expect(aFunc).toBeCalled();
            expect(bFunc).toBeCalled();
            expect(aResume).not.toBeCalled();
            expect(bResume).not.toBeCalled();
            task.resume();
            expect(aResume).toBeCalled();
            expect(bResume).toBeCalled();
        });
    });
    describe("#resume", () => {
        test("should be able to resume task", async () => {
            const monitor = jest.fn();
            const runtime = Task.createRuntime();
            const task = runtime.submit(Task.create("monitor", monitor));
            task.pause();
            await wait(10);
            expect(monitor).not.toBeCalled();
            task.resume();
            await wait(10);
            expect(monitor).toBeCalled();
        });
    });
    describe("monitoring", () => {
        function nestTask(ctx: Task.Context) {
            let p = 0;
            let t = 10;
            return new Promise((resolve) => {
                let handle = setInterval(() => {
                    ctx.update(p, t);
                    p += 1;
                    if (p === 10) {
                        clearInterval(handle);
                        resolve()
                    }
                }, 1);
            })
        }
        test("parent should update child progress", async () => {
            const runtime = Task.createRuntime();
            const progress = [] as string[];
            runtime.on("update", (p, n) => {
                progress.push(`${n.path}: ${p.progress}/${p.total}`);
            });
            const task = runtime.submit(Task.create("monitor", async (c) => {
                await c.execute(Task.create("1", nestTask), 50);
                await c.execute(Task.create("2", nestTask), 50);
            }));
            await task.wait();
            expect(progress).toEqual([
                "monitor.1: 0/10",
                "monitor: 0/50",
                "monitor.1: 1/10",
                "monitor: 5/50",
                "monitor.1: 2/10",
                "monitor: 10/50",
                "monitor.1: 3/10",
                "monitor: 15/50",
                "monitor.1: 4/10",
                "monitor: 20/50",
                "monitor.1: 5/10",
                "monitor: 25/50",
                "monitor.1: 6/10",
                "monitor: 30/50",
                "monitor.1: 7/10",
                "monitor: 35/50",
                "monitor.1: 8/10",
                "monitor: 40/50",
                "monitor.1: 9/10",
                "monitor: 45/50",
                "monitor: 50/50",
                "monitor.2: 0/10",
                "monitor: 50/100",
                "monitor.2: 1/10",
                "monitor: 55/100",
                "monitor.2: 2/10",
                "monitor: 60/100",
                "monitor.2: 3/10",
                "monitor: 65/100",
                "monitor.2: 4/10",
                "monitor: 70/100",
                "monitor.2: 5/10",
                "monitor: 75/100",
                "monitor.2: 6/10",
                "monitor: 80/100",
                "monitor.2: 7/10",
                "monitor: 85/100",
                "monitor.2: 8/10",
                "monitor: 90/100",
                "monitor.2: 9/10",
                "monitor: 95/100",
                "monitor: 100/100",
            ]);
        });
        test("parent should update nested progress", async () => {
            const runtime = Task.createRuntime();
            const progress = [] as string[];
            runtime.on("update", (p, n) => {
                progress.push(`${n.path}: ${p.progress}/${p.total}`);
            });
            const task = runtime.submit(Task.create("monitor", async (c) => {
                await c.execute(Task.create("1", async (c) => {
                    c.update(0, 100);
                    await c.execute(Task.create("1", nestTask), 50);
                    await c.execute(Task.create("1", nestTask), 50);
                }), 100);
            }));
            await task.wait();
            expect(progress).toEqual([
                "monitor.1: 0/100",
                "monitor: 0/100",
                "monitor.1.1: 0/10",
                "monitor.1: 0/100",
                "monitor: 0/100",
                "monitor.1.1: 1/10",
                "monitor.1: 5/100",
                "monitor: 5/100",
                "monitor.1.1: 2/10",
                "monitor.1: 10/100",
                "monitor: 10/100",
                "monitor.1.1: 3/10",
                "monitor.1: 15/100",
                "monitor: 15/100",
                "monitor.1.1: 4/10",
                "monitor.1: 20/100",
                "monitor: 20/100",
                "monitor.1.1: 5/10",
                "monitor.1: 25/100",
                "monitor: 25/100",
                "monitor.1.1: 6/10",
                "monitor.1: 30/100",
                "monitor: 30/100",
                "monitor.1.1: 7/10",
                "monitor.1: 35/100",
                "monitor: 35/100",
                "monitor.1.1: 8/10",
                "monitor.1: 40/100",
                "monitor: 40/100",
                "monitor.1.1: 9/10",
                "monitor.1: 45/100",
                "monitor: 45/100",
                "monitor.1: 50/100",
                "monitor: 50/100",
                "monitor.1.1: 0/10",
                "monitor.1: 50/100",
                "monitor: 50/100",
                "monitor.1.1: 1/10",
                "monitor.1: 55/100",
                "monitor: 55.00000000000001/100",
                "monitor.1.1: 2/10",
                "monitor.1: 60/100",
                "monitor: 60/100",
                "monitor.1.1: 3/10",
                "monitor.1: 65/100",
                "monitor: 65/100",
                "monitor.1.1: 4/10",
                "monitor.1: 70/100",
                "monitor: 70/100",
                "monitor.1.1: 5/10",
                "monitor.1: 75/100",
                "monitor: 75/100",
                "monitor.1.1: 6/10",
                "monitor.1: 80/100",
                "monitor: 80/100",
                "monitor.1.1: 7/10",
                "monitor.1: 85/100",
                "monitor: 85/100",
                "monitor.1.1: 8/10",
                "monitor.1: 90/100",
                "monitor: 90/100",
                "monitor.1.1: 9/10",
                "monitor.1: 95/100",
                "monitor: 95/100",
                "monitor.1: 100/100",
                "monitor: 100/100",
                "monitor: 100/100",
            ]);
        });
        test("parent should update child progress without preset", async () => {
            const runtime = Task.createRuntime();
            const progress = [] as string[];
            runtime.on("update", (p, n) => {
                progress.push(`${n.path}: ${p.progress}/${p.total}`);
            });
            const task = runtime.submit(Task.create("monitor", async (c) => {
                c.update(0, 100);
                await c.execute(Task.create("1", nestTask), 50);
                await c.execute(Task.create("2", nestTask), 50);
            }));
            await task.wait();
            expect(progress).toEqual([
                "monitor: 0/100",
                "monitor.1: 0/10",
                "monitor: 0/100",
                "monitor.1: 1/10",
                "monitor: 5/100",
                "monitor.1: 2/10",
                "monitor: 10/100",
                "monitor.1: 3/10",
                "monitor: 15/100",
                "monitor.1: 4/10",
                "monitor: 20/100",
                "monitor.1: 5/10",
                "monitor: 25/100",
                "monitor.1: 6/10",
                "monitor: 30/100",
                "monitor.1: 7/10",
                "monitor: 35/100",
                "monitor.1: 8/10",
                "monitor: 40/100",
                "monitor.1: 9/10",
                "monitor: 45/100",
                "monitor: 50/100",
                "monitor.2: 0/10",
                "monitor: 50/100",
                "monitor.2: 1/10",
                "monitor: 55/100",
                "monitor.2: 2/10",
                "monitor: 60/100",
                "monitor.2: 3/10",
                "monitor: 65/100",
                "monitor.2: 4/10",
                "monitor: 70/100",
                "monitor.2: 5/10",
                "monitor: 75/100",
                "monitor.2: 6/10",
                "monitor: 80/100",
                "monitor.2: 7/10",
                "monitor: 85/100",
                "monitor.2: 8/10",
                "monitor: 90/100",
                "monitor.2: 9/10",
                "monitor: 95/100",
                "monitor: 100/100",
            ]);
        });
    });

});
