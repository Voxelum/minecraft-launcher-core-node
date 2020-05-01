import { EventEmitter } from "events";

export type TaskNode = Task.State;

function runTask<T>(context: Task.Context, task: Task<T>): Promise<T> {
    try {
        const result = task.run(context);
        return result instanceof Promise ? result : Promise.resolve(result);
    } catch (e) {
        return Promise.reject(e);
    }
}

export interface TaskListener<N extends Task.State = Task.State> extends EventEmitter {
    /**
     * Emitted when the some task starts to execute. The listener will get both this task state and parent task state.
     *
     * If there is no parent, it will be undefined.
     */
    on(event: "execute", listener: (node: N, parent?: N) => void): this;
    /**
     * Emitted when the some task failed.
     */
    on(event: "fail", listener: (error: any, node: N) => void): this;
    /**
     * Emitted when the task has update.
     *
     * The progress and total are arbitary number which designed by task creator.
     * You might want to convert them to percentage by yourself by directly dividing them.
     *
     * The message is a totally optional and arbitary string for hint.
     */
    on(event: "update", listener: (update: { progress: number, total?: number, message?: string }, node: N) => void): this;
    /**
     * Emitted the when some task is finished
     */
    on(event: "finish", listener: (result: any, node: N) => void): this;
    /**
     * Emitted the pause event after user toggle the `pause` in handle
     */
    on(event: "pause", listener: (node: N) => void): this;
    /**
     * Emitted the resume event after use toggle the `resume` in handle
     */
    on(event: "resume", listener: (node: N) => void): this;
    /**
     * Emitted the cancel event after some task is cancelled.
     */
    on(event: "cancel", listener: (node: N) => void): this;

    once(event: "execute", listener: (node: N, parent?: N) => void): this;
    once(event: "fail", listener: (error: any, node: N) => void): this;
    once(event: "update", listener: (update: { progress: number, total?: number, message?: string }, node: N) => void): this;
    once(event: "finish", listener: (result: any, node: N) => void): this;
    once(event: "pause", listener: (node: N) => void): this;
    once(event: "resume", listener: (node: N) => void): this;
    once(event: "cancel", listener: (node: N) => void): this;
}

/**
 * An intergrated environment to run the task. If you want to manage all your tasks together, you should use this.
 */
export class TaskRuntime<N extends Task.State = Task.State> extends EventEmitter implements TaskListener<N> {
    protected bridge: TaskBridge<N>;

    constructor(readonly factory: Task.StateFactory<N>, schedular: Task.Schedualer) {
        super();
        this.bridge = new TaskBridge(this, factory, schedular);
    }
    /**
     * Emitted when the some task starts to execute. The listener will get both this task state and parent task state.
     *
     * If there is no parent, it will be undefined.
     */
    on(event: "execute", listener: (node: N, parent?: N) => void): this;
    /**
     * Emitted when the task has update.
     *
     * The progress and total are arbitary number which designed by task creator.
     * You might want to convert them to percentage by yourself by directly dividing them.
     *
     * The message is a totally optional and arbitary string for hint.
     */
    on(event: "update", listener: (update: { progress: number, total?: number, message?: string }, node: N) => void): this;
    /**
     * Emitted the when some task is finished
     */
    on(event: "finish", listener: (result: any, node: N) => void): this;
    /**
     * Emitted when the some task failed.
     */
    on(event: "fail", listener: (error: any, node: N) => void): this;
    /**
     * Emitted the pause event after user toggle the `pause` in handle
     */
    on(event: "pause", listener: (node: N) => void): this;
    /**
     * Emitted the resume event after use toggle the `resume` in handle
     */
    on(event: "resume", listener: (node: N) => void): this;
    /**
     * Emitted the cancel event after some task is cancelled.
     */
    on(event: "cancel", listener: (node: N) => void): this;
    on(event: string, listener: (...args: any[]) => void): this {
        return super.on(event, listener);
    }

    once(event: "execute", listener: (node: N, parent?: N) => void): this;
    once(event: "fail", listener: (error: any, node: N) => void): this;
    once(event: "update", listener: (update: { progress: number, total?: number, message?: string }, node: N) => void): this;
    once(event: "finish", listener: (result: any, node: N) => void): this;
    once(event: "pause", listener: (node: N) => void): this;
    once(event: "resume", listener: (node: N) => void): this;
    once(event: "cancel", listener: (node: N) => void): this;
    once(event: string, listener: (...args: any[]) => void): this {
        return super.once(event, listener);
    }

    submit<T>(task: Task<T>): TaskHandle<T, N> {
        return this.bridge.submit(task);
    }
}

export class TaskSignal {
    _paused: boolean = false;
    _cancelled = false;
    _started: boolean = false;

    _onPause: Array<() => void> = [];
    _onResume: Array<() => void> = [];
}

export class TaskBridge<X extends Task.State = Task.State> {
    constructor(
        readonly emitter: EventEmitter,
        readonly factory: Task.StateFactory<X>,
        readonly scheduler: <N>(r: () => Promise<N>) => Promise<N>) {
    }

    submit<T>(task: Task<T>): TaskHandle<T, X> {
        const signal = new TaskSignal();
        const { node, promise } = this.enqueueTask(signal, task);
        const handle: TaskHandle<T, X> = {
            pause() {
                if (!signal._paused) {
                    signal._paused = true;
                    signal._onPause.forEach((f) => f());
                }
            },
            resume() {
                if (signal._paused) {
                    signal._paused = false;
                    signal._onResume.forEach((f) => f());
                }
            },
            cancel() { signal._cancelled = true; },
            get isCancelled() { return signal._cancelled; },
            get isPaused() { return signal._paused; },
            get isStarted() { return signal._started; },

            wait() { return promise; },
            get root() { return node },
        }
        return handle;
    }

    protected enqueueTask<T>(signal: TaskSignal, task: Task<T>, parent?: { node: X; progressUpdate: (progress: number, total: number, message?: string) => void }): { node: X, promise: Promise<T> } {
        const bridge = this;
        const emitter = bridge.emitter;

        const name = task.name;
        const args: object | undefined = task.parameters;
        const node: X = bridge.factory({
            name,
            arguments: parent ? Object.assign({}, parent.node.arguments, args || {}) : args,
            path: parent ? parent.node.path + "." + name : name,
        }, parent?.node);

        let knownTotal = -1;
        let subTotals: number[] = [];
        let subProgress: number[] = [];
        let pauseFunc: (() => void) | undefined;
        let resumeFunc: (() => void) | undefined;
        let resumeCb = () => { };

        const pause = () => {
            if (pauseFunc) {
                pauseFunc();
                emitter.emit("pause", node);
            }
        };
        const resume = () => {
            if (resumeFunc) {
                resumeFunc();
                emitter.emit("resume", node);
            }
            resumeCb();
        };
        const checkCancel = () => {
            if (signal._cancelled) {
                emitter.emit("cancel", node);
                throw new Task.CancelledError();
            }
        };
        const waitPause = async () => {
            if (signal._paused) {
                emitter.emit("pause", node);
                await new Promise<void>((resolve) => {
                    resumeCb = () => {
                        resumeCb = () => { };
                        emitter.emit("resume", node);
                        resolve();
                    }
                });
            }
        };
        const pausealbe = (onPause: (() => void) | undefined, onResume: (() => void) | undefined) => {
            if (pauseFunc !== onPause) {
                pauseFunc = onPause;
            }
            if (resumeFunc !== onResume) {
                resumeFunc = onResume;
            }
        };
        const update = (progress: number, total: number, message?: string) => {
            knownTotal = total || knownTotal;

            emitter.emit("update", { progress, total, message }, node);

            parent?.progressUpdate(progress, total, message);

            checkCancel();
        };
        const subUpdate = (message?: string) => {
            let progress = subProgress.reduce((a, b) => a + b);
            let total = knownTotal === -1 ? subTotals.reduce((a, b) => a + b, 0) : knownTotal;
            emitter.emit("update", { progress, total, message }, node);
            parent?.progressUpdate(progress, total, message);
        };
        const execute = <Y>(task: Task<Y>, total?: number) => {
            let index = subProgress.length;
            subProgress.push(0);
            let { promise } = bridge.enqueueTask(signal, task, {
                node,
                progressUpdate(progress: number, subTotal, message) {
                    if (total) {
                        subTotals[index] = total;
                        subProgress[index] = total * (progress / subTotal);
                        subUpdate(message);
                    }
                }
            });
            promise = promise.then((r) => {
                subProgress[index] = total || 0;
                subUpdate();
                return r;
            });
            return promise;
        }
        const run = async () => {
            await new Promise((resolve) => setImmediate(resolve));

            checkCancel();
            await waitPause();

            signal._started = true;

            emitter.emit("execute", node, parent?.node);

            try {
                let result = await runTask({ update, execute, pausealbe, waitPause }, task);
                emitter.emit("finish", result, node);
                return result;
            } catch (e) {
                if (e instanceof Task.CancelledError) {
                    emitter.emit("cancel", node);
                    throw e;
                }
                emitter.emit("fail", e, node);
                throw e;
            } finally {
                signal._onPause.splice(signal._onPause.indexOf(pause));
                signal._onResume.splice(signal._onResume.indexOf(resume));
            }
        };

        signal._onPause.push(pause);
        signal._onResume.push(resume);
        checkCancel();
        return { node, promise: bridge.scheduler(run) };
    }
}

export interface TaskHandle<T, N extends Task.State> {
    /**
     * Wait the task to complete
     */
    wait(): Promise<T>;
    /**
     * Cancel the task.
     */
    cancel(): void;
    /**
     * Pause the task if possible.
     */
    pause(): void;
    resume(): void;
    readonly root: N;
    readonly isCancelled: boolean;
    readonly isPaused: boolean;
    readonly isStarted: boolean;
}

export class Task<T> {
    constructor(readonly name: string,
        readonly parameters: object | undefined,
        readonly run: (context: Task.Context) => (Promise<T> | T)) {
    }

    /**
     * Execute this task immediately (not in runtime).
     * This will have the same behavior like `Task.execute`.
     *
     * @see Task.execute
     */
    execute() { return Task.execute<T>(this); }
}

export namespace Task {
    export interface Function<T> {
        (context: Task.Context): (Promise<T> | T);
    }
    export interface Object<T> {
        readonly name: string;
        readonly parameters?: object;
        readonly run: (context: Task.Context) => (Promise<T> | T);
    }

    /**
     * You'll recive this if the task is cancelled.
     */
    export class CancelledError extends Error {
        constructor() { super("Cancelled"); }
    }

    export type Schedualer = <N>(r: () => Promise<N>) => Promise<N>

    export interface Context {
        pausealbe(onPause?: () => void, onResume?: () => void): void;
        update(progres: number, total?: number, message?: string): void | boolean;
        execute<T>(task: Task<T>, pushProgress?: number): Promise<T>;

        waitPause(): Promise<void>;
    }

    export type StateFactory<X extends Task.State = Task.State> = (node: Task.State, parent?: X) => X;

    export const DEFAULT_STATE_FACTORY: StateFactory = (n) => n;

    /**
     * Run the task immediately without a integrated runtime
     * @param task The task will be run
     */
    export function execute<T>(task: Task<T>): TaskHandle<T, Task.State> & TaskListener {
        const listener = new EventEmitter();
        const handle = new TaskBridge(listener, DEFAULT_STATE_FACTORY, (r) => r()).submit(task);
        for (const [k, v] of Object.entries(handle)) {
            (listener as any)[k] = v;
        }
        return listener as any;
    }

    /**
     * Create a central managed runtime for task execution. You can listen the tasks status at one place.
     * @param factory The state factory. It's used to customize your task state.
     * @param schedular The task schedular provided
     */
    export function createRuntime<X extends Task.State = Task.State>(factory: StateFactory<X> = DEFAULT_STATE_FACTORY as any, schedular: Schedualer = (t) => t()): TaskRuntime<X> {
        return new TaskRuntime(factory, schedular);
    }

    export interface State {
        name: string;
        arguments?: { [key: string]: any };
        path: string;
    }

    export function create<T>(name: string, task: Task.Function<T>, parameters?: any): Task<T> {
        return new Task(name, parameters, task);
    }
}

/**
 * Create new task
 */
export function task<T>(name: string, task: Task.Function<T>, parameters?: any): Task<T> {
    return new Task(name, parameters, task);
}
