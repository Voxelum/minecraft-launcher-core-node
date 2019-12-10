import { EventEmitter } from "events";
import { cpus } from "os";

export type TaskNode = Task.State;

function runTask<T>(context: Task.Context, task: TaskOrTaskObject<T>): Promise<T> {
    try {
        const result = typeof task === "function" ? task(context) : task.run(context);
        return result instanceof Promise ? result : Promise.resolve(result);
    } catch (e) {
        return Promise.reject(e);
    }
}

export interface TaskListener<N extends Task.State = Task.State> extends EventEmitter {
    on(event: "execute", listener: (node: N, parent?: N) => void): this;
    on(event: "fail", listener: (error: any, node: N) => void): this;
    on(event: "update", listener: (update: { progress: number, total?: number, message?: string }, node: N) => void): this;
    on(event: "finish", listener: (result: any, node: N) => void): this;
    on(event: "pause", listener: (node: N) => void): this;
    on(event: "resume", listener: (node: N) => void): this;
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

    constructor(readonly factory: Task.StateFactory<N>, readonly maxConcurrentTasks: number = (cpus().length / 2)) {
        super();
        this.bridge = new TaskBridge(this, factory, Task.createScheduler(maxConcurrentTasks));
    }

    on(event: string, listener: (...args: any[]) => void): this {
        return super.on(event, listener);
    }

    once(event: string, listener: (...args: any[]) => void): this {
        return super.once(event, listener);
    }

    submit<T>(task: TaskOrTaskObject<T>): TaskHandle<T, N> {
        return this.bridge.submit(task);
    }
}

export class TaskSignal {
    _paused: boolean = false;
    _cancelled = false;
    _started: boolean = false;

    _resumePauseCallback: null | (() => void) = null;
    _onPause: null | (() => void) = null;
    _onResume: null | (() => void) = null;
}

export class TaskBridge<X extends Task.State = Task.State> {
    constructor(
        readonly emitter: EventEmitter,
        readonly factory: Task.StateFactory<X>,
        readonly scheduler: <N>(r: () => Promise<N>) => Promise<N>) {
    }

    submit<T>(task: TaskOrTaskObject<T>): TaskHandle<T, X> {
        const signal = new TaskSignal();
        const { node, promise } = this.enqueueTask(signal, task);
        const handle: TaskHandle<T, X> = {
            pause() {
                signal._paused = true;
                if (signal._onPause) { signal._onPause(); }
            },
            resume() {
                signal._paused = false;
                if (signal._resumePauseCallback) {
                    signal._resumePauseCallback();
                }
                if (signal._onResume) {
                    signal._onResume();
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

    protected enqueueTask<T>(signal: TaskSignal, task: TaskOrTaskObject<T>, parent?: X): { node: X, promise: Promise<T> } {
        const bridge = this;
        const emitter = bridge.emitter;

        const name = task.name;
        const args: object | undefined = task.parameters;
        const node: X = bridge.factory({
            name,
            arguments: parent ? Object.assign({}, parent.arguments, args || {}) : args,
            path: parent ? parent.path + "." + name : name,
        }, parent);

        const context: Task.Context = {
            pausealbe(onPause, onResume) {
                signal._onPause = onPause || null;
                signal._onResume = onResume || null;
            },
            update(progress: number, total?: number, message?: string) {
                emitter.emit("update", { progress, total, message }, node);
                if (signal._cancelled) {
                    emitter.emit("cancelled", node);
                    throw new Task.CancelledError();
                }
            },
            async execute<Y>(task: Task<Y>): Promise<Y> {
                const { promise } = bridge.enqueueTask(signal, task, node);
                return promise;
            },
        }

        if (signal._cancelled) {
            emitter.emit("cancel", node);
            throw new Task.CancelledError();
        }

        const promise = bridge.scheduler(async () => {
            await new Promise((resolve) => setImmediate(resolve));

            if (signal._paused) {
                emitter.emit("pause", node);
                await new Promise<void>((resolve) => {
                    signal._resumePauseCallback = () => {
                        signal._resumePauseCallback = null;
                        emitter.emit("resume", node);
                        resolve();
                    };
                });
            }

            signal._started = true;

            emitter.emit("execute", node, parent);

            return runTask(context, task).then((r) => {
                emitter.emit("finish", r, node);
                return r;
            }, (e) => {
                if (e instanceof Task.CancelledError) {
                    emitter.emit("cancel", node);
                    throw e;
                }
                emitter.emit("fail", e, node);
                throw e;
            });
        });

        return { node, promise };
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

type TaskOrTaskObject<T> = Task.Function<T> | Task.Object<T>;
export type Task<T> = Task.Function<T>;

export namespace Task {
    export interface Function<T> {
        readonly name: string;
        readonly parameters?: object;
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
    }

    export type Schedualer = <N>(r: () => Promise<N>) => Promise<N>

    export interface Context {
        pausealbe(onPause?: () => void, onResume?: () => void): void;
        update(progres: number, total?: number, message?: string): void;
        execute<T>(task: TaskOrTaskObject<T>): Promise<T>;
    }

    export type StateFactory<X extends Task.State = Task.State> = (node: Task.State, parent?: X) => X;

    export const DEFAULT_STATE_FACTORY: StateFactory = (n) => n;

    /**
     * Run the task immediately
     * @param task The task will be run
     */
    export function execute<T>(task: TaskOrTaskObject<T>): TaskHandle<T, Task.State> & TaskListener {
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
     * @param maxConcurrentTasks The max concurrent tasks number
     */
    export function createRuntime<X extends Task.State = Task.State>(factory: StateFactory<X> = DEFAULT_STATE_FACTORY as any, maxConcurrentTasks: number = cpus().length / 2): TaskRuntime<X> {
        return new TaskRuntime(factory, maxConcurrentTasks);
    }

    /**
     * Create a really simple scheduler to keep track there are no more than `maxConcurrentTasks` running tasks from this schedular.
     * @param maxConcurrentTasks The max number of concurrent tasks
     */
    export function createScheduler(maxConcurrentTasks: number = cpus().length / 2): Schedualer {
        maxConcurrentTasks = Math.max(maxConcurrentTasks, 1);
        let unruned: Array<() => Promise<any>> = [];
        let running = 0;
        function onTaskEnd() {
            running -= 1;
            if (running < maxConcurrentTasks && unruned.length > 0) {
                running += 1;
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                unruned.pop()!();
            }
        }
        return <T>(t: () => Promise<T>) => {
            if (running < maxConcurrentTasks) {
                running += 1;
                return t().finally(onTaskEnd);
            } else {
                let deferredResolve: (value?: any) => void;
                let deferredReject: (reason?: any) => void;
                const deferred = new Promise<any>((resolve, reject) => {
                    deferredResolve = resolve;
                    deferredReject = reject;
                });
                unruned.push(() => t().then(deferredResolve, deferredReject).finally(onTaskEnd));
                return deferred;
            }
        }
    }

    export interface State {
        name: string;
        arguments?: { [key: string]: any };
        path: string;
    }

    export function create<T>(name: string, task: Task.Function<T>, parameters?: any): Task.Object<T> {
        return { name, run: task, parameters };
    }
}

export default Task;
