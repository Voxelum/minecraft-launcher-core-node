import Task from "./index";

function wait(time: number) {
    return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, time);
    });
}

describe("Task", () => {
    describe("#create", () => {
        test("should be able to create task with string", async () => {
            function test() { }
            const runtime = Task.createRuntime();
            runtime.once("execute", (n) => {
                expect(n.path).toEqual("test");
                expect(n.name).toEqual("test");
            });
            await runtime.submit(test).wait();
        });
        test("should be able to create task with arguments", async () => {
            function test() { }
            test.parameters = { x: 1 };
            const runtime = Task.createRuntime();
            runtime.once("execute", (n) => {
                expect((n.arguments as any).x).toBe(1);
                expect(n.path).toEqual("test");
                expect(n.name).toEqual("test");
            });
            await runtime.submit(test).wait();
        });
        test("should be able to create child task with arguments", async () => {
            function c() { }
            c.parameters = { x: 2 };
            function test(ctx: Task.Context) {
                return ctx.execute(c);
            }
            test.parameters = { x: 1 };

            const runtime = Task.createRuntime();
            const onExec = jest.fn();
            const onSuccess = jest.fn();
            runtime.on("execute", (ch) => {
                onExec();
                expect((ch.arguments as any).x).toEqual(ch.name === "c" ? 2 : 1);
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
            function c() { }
            function test(ctx: Task.Context) {
                return ctx.execute(c);
            }
            test.parameters = { x: 1 };
            const onSuccess = jest.fn();
            const onExec = jest.fn();

            const runtime = Task.createRuntime();
            runtime.on("execute", (ch) => {
                onExec();
                expect((ch.arguments as any).x).toEqual(1);
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
            await expect(runtime.submit(function test() { return 1; })
                .wait())
                .resolves
                .toEqual(1);
            expect(monitor).toBeCalledTimes(1);
        });
        test("should be able to catch error", async () => {
            const runtime = Task.createRuntime();
            const monitor = jest.fn();
            runtime.on("node-error", (e) => {
                expect(e).toEqual(new Error("Fail"));
                monitor();
            });
            await expect(runtime.submit(function test() { throw new Error("Fail"); })
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
            const handle = runtime.submit(function test(c) {
                c.update(2, 10, "hello");
            });
            await expect(handle.wait()).resolves.toBeUndefined();
            expect(monitor).toBeCalled();
        });
    });

    describe("#cancel", () => {
        test("should be able to cancel the task after execution", async () => {
            const runtime = Task.createRuntime();
            runtime.on("execute", (child, parent) => {
                if (child.path === "") {
                    expect(child.name).toEqual("");
                } else {
                    expect(child.name).toEqual("A");
                }
            });
            const monitor = jest.fn();
            runtime.on("cancel", monitor);
            const handle = runtime.submit(async (c) => {
                await c.execute(function A() { return wait(1000); });
                handle.cancel();
                await c.execute(() => wait(1000));
            });
            await expect(handle.wait())
                .rejects
                .toEqual(new Task.CancelledError());

            expect(monitor).toBeCalled();
        });
    });
    describe("#pause", () => {
        test("should be paused the task before it execute", async () => {
            const runtime = Task.createRuntime();
            const monitor = jest.fn();
            const task = runtime.submit(monitor);
            task.pause();
            await wait(100);
            expect(monitor).not.toBeCalled();
        });
        test("should be paused after the task execute", async () => {
            const aFunc = jest.fn();
            const bFunc = jest.fn();

            const runtime = Task.createRuntime();
            const task = runtime.submit(async function test(c) {
                await c.execute(aFunc);
                task.pause();
                await c.execute(bFunc);
            });
            await wait(100);
            expect(aFunc).toBeCalled();
            expect(bFunc).not.toBeCalled();
        });
    });
    describe("#resume", () => {
        test("should be able to resume task", async () => {
            const monitor = jest.fn();
            const runtime = Task.createRuntime();
            const task = runtime.submit(monitor);
            task.pause();
            await wait(10);
            expect(monitor).not.toBeCalled();
            task.resume();
            await wait(0);
            expect(monitor).toBeCalled();
        });
    });
});
