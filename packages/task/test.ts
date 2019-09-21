import Task from ".";

function wait(time: number) {
    return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, time);
    });
}

describe("Task", () => {
    describe("#create", () => {
        test("should be able to create task with string", () => {
            const task = Task.create("test", () => { });
            expect(task.root.name).toEqual("test");
            expect(task.root.error).toBeUndefined();
            expect(task.root.message).toEqual("");
            expect(task.root.path).toEqual("test");
            expect(task.root.status).toEqual("ready");
        });
        test("should be able to create task with arguments", () => {
            const task = Task.create({ name: "test", arguments: { x: 1 } }, () => { });
            expect(task.root.name).toEqual("test");
            expect((task.root.arguments as any).x).toBe(1);
            expect(task.root.error).toBeUndefined();
            expect(task.root.message).toEqual("");
            expect(task.root.path).toEqual("test");
            expect(task.root.status).toEqual("ready");
        });
        test("should be able to create child task with arguments", async () => {
            const task = Task.create({ name: "test", arguments: { x: 1 } }, (c) => {
                return c.execute({ name: "c", arguments: { x: 2 } }, () => { });
            });
            const monitor = jest.fn();
            expect(task.root.name).toEqual("test");
            expect(task.root.error).toBeUndefined();
            expect((task.root.arguments as any).x).toEqual(1);
            expect(task.root.message).toEqual("");
            expect(task.root.path).toEqual("test");
            expect(task.root.status).toEqual("ready");
            task.on("child", (p, ch) => {
                expect(ch.name).toEqual("c");
                expect((ch.arguments as any).x).toEqual(2);
                monitor();
            });
            await task.execute();
            expect(monitor).toBeCalled();
            expect(task.root.status).toEqual("successed");
        });
        test("should extends parent argument", async () => {
            const task = Task.create({ name: "test", arguments: { x: 1 } }, (c) => {
                return c.execute("c", () => { });
            });
            const monitor = jest.fn();
            expect(task.root.name).toEqual("test");
            expect(task.root.error).toBeUndefined();
            expect((task.root.arguments as any).x).toEqual(1);
            expect(task.root.message).toEqual("");
            expect(task.root.path).toEqual("test");
            expect(task.root.status).toEqual("ready");
            task.on("child", (p, ch) => {
                expect(ch.name).toEqual("c");
                expect((ch.arguments as any).x).toEqual(1);
                monitor();
            });
            await task.execute();
            expect(monitor).toBeCalled();
            expect(task.root.status).toEqual("successed");
        });
    });
    describe("#execute", () => {
        test("should be able to catch error", async () => {
            const task = Task.create("test", () => {
                throw new Error("Fail");
            });
            const monitor = jest.fn();
            task.on("error", monitor);
            await expect(task.execute())
                .rejects
                .toEqual(new Error("Fail"));
            expect(monitor).toBeCalled();
            expect(task.root.error).toEqual(new Error("Fail"));
            expect(task.root.status).toEqual("failed");
        });
    });
    describe("#update", () => {
        test("should be able to update status", async () => {
            const task = Task.create("test", (c) => {
                c.update(2, 10, "hello");
            });
            await task.execute();
            expect(task.root.progress).toEqual(2);
            expect(task.root.total).toEqual(10);
            expect(task.root.message).toEqual("hello");
        });
    });

    describe("#cancel", () => {
        test("should be able to cancel the task before it execute", async () => {
            const task = Task.create("test", () => { });
            task.cancel();
            await expect(task.execute())
                .rejects
                .toEqual(new Task.CancelledError());
        });
        test("should be able to cancel the task after execution", async () => {
            const task = Task.create("test", async (c) => {
                await c.execute("A", () => wait(1000));
                c.task.cancel();
                await c.execute("B", () => wait(1000));
            });
            task.once("child", (parent, child) => {
                expect(child.name).toEqual("A");
            });
            const monitor = jest.fn();
            task.on("cancel", monitor);
            await expect(task.execute())
                .rejects
                .toEqual(new Task.CancelledError());

            expect(monitor).toBeCalled();
        });
    });
    describe("#pause", () => {
        test("should be paused the task before it execute", async () => {
            const monitor = jest.fn();
            const task = Task.create("test", monitor);
            task.pause();
            task.execute();
            await wait(100);
            expect(monitor).not.toBeCalled();
        });
        test("should be paused after the task execute", async () => {
            const aFunc = jest.fn();
            const bFunc = jest.fn();
            const task = Task.create("test", async (c) => {
                await c.execute("A", aFunc);
                c.task.pause();
                await c.execute("B", bFunc);
            });
            task.execute();
            await wait(100);
            expect(aFunc).toBeCalled();
            expect(bFunc).not.toBeCalled();
        });
    });
    describe("#resume", () => {
        test("should be able to resume task", async () => {
            const monitor = jest.fn();
            const task = Task.create("test", monitor);
            task.pause();
            task.execute();
            await wait(10);
            expect(monitor).not.toBeCalled();
            task.resume();
            await wait(0);
            expect(monitor).toBeCalled();
        });
    });
});
