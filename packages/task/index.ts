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

export class TaskRuntime<N extends Task.State = Task.State> extends EventEmitter {
    constructor(readonly factory: Task.StateFactory<N>, readonly maxConcurrentTasks: number = (cpus().length / 2)) {
        super();
        this.on("execute", () => {
            this.running += 1;
        });
        const onFinish = () => {
            this.running -= 1;
            this.unruned.pop()?.start();
        };
        this.on("fail", onFinish);
        this.on("finish", onFinish);
    }

    protected unruned: { start(): unknown }[] = [];
    protected running: number = 0;

    on(event: "execute", listener: (node: N, parent?: N) => void): this;
    on(event: "fail", listener: (error: any, node: N) => void): this;
    on(event: "update", listener: (update: { progress: number, total?: number, message?: string }, node: N) => void): this;
    on(event: "finish", listener: (result: any, node: N) => void): this;
    on(event: "pause", listener: (node: N) => void): this;
    on(event: "resume", listener: (node: N) => void): this;
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

    submit<T>(task: TaskOrTaskObject<T>): TaskHandle<T, N> {
        const context = new TaskRunContext(task, this, this.factory);
        if (this.running < this.maxConcurrentTasks) {
            context.start();
        } else {
            this.unruned.push(context);
        }
        return context.handle();
    }
}

class TaskRunContext<T, N extends Task.State> {
    _promise: Promise<T> = new Promise<T>((resolve, reject) => {
        this._reject = reject;
        this._resolve = resolve;
    });
    private _reject: any;
    private _resolve: any;

    private _paused: boolean = false;
    private _cancelled = false;
    private _started: boolean = false;

    private _resumeCallback: null | (() => void) = null;
    private _onPause: null | (() => void) = null;
    private _onResume: null | (() => void) = null;

    private root!: N;

    constructor(
        readonly task: TaskOrTaskObject<T>,
        readonly runtime: EventEmitter,
        private factory: (state: Task.State) => N) {
    }

    handle(): TaskHandle<T, N> {
        const _promise = this._promise;
        const self = this;
        return {
            wait() { return _promise; },
            pause() {
                self._paused = true;
                if (self._onPause) { self._onPause(); }
            },
            resume() {
                self._paused = false;
                if (self._resumeCallback) {
                    self._resumeCallback();
                }
                if (self._onResume) {
                    self._onResume();
                }
                self.runtime.emit("resume", self.root);
            },
            cancel() { self._cancelled = true; },
            get root() { return self.root },
            get isCancelled() { return self._cancelled; },
            get isPaused() { return self._paused; },
            get isStarted() { return self._started; }
        }
    }

    start(): any {
        this._started = true;
        this.root = this.factory({
            name: this.task.name,
            arguments: this.task.parameters,
            path: this.task.name,
        });
        this.executeOnNode(
            this.createContext(this.root),
            this.task,
            this.root).then((r) => this._resolve(r), (e) => this._reject(e));
        return this._promise;
    }

    private createContext(node: Task.State): Task.Context {
        const self = this;
        const runtime = this.runtime;
        return {
            pausealbe(onPause, onResume) {
                self._onPause = onPause || null;
                self._onResume = onResume || null;
            },
            update(progress: number, total?: number, message?: string) {
                runtime.emit("update", { progress, total, message }, node);
                if (self._cancelled) {
                    runtime.emit("cancelled", node);
                    throw new Task.CancelledError();
                }
            },
            execute<X>(task: Task<X>): Promise<X> {
                const name = task.name;
                const args: object | undefined = task.parameters;

                const nextPath = node.path + "." + name;
                const nextNode: N = self.factory({
                    name,
                    arguments: Object.assign({}, node.arguments, args || {}),
                    path: nextPath,
                });
                const context = self.createContext(nextNode);

                return self.executeOnNode(context, task, nextNode, node);
            },
        };
    }

    private async waitIfPause() {
        if (this._paused) {
            await new Promise<void>((resolve) => {
                this._resumeCallback = () => {
                    this._resumeCallback = null;
                    resolve();
                };
            });
        }
    }

    private async executeOnNode<CT>(context: Task.Context, work: TaskOrTaskObject<CT>, node: Task.State, parent?: Task.State) {
        await new Promise((resolve) => setImmediate(() => resolve()));
        if (this._cancelled) {
            this.runtime.emit("cancel", node);
            throw new Task.CancelledError();
        }

        if (this._paused) {
            this.runtime.emit("pause", node);
        }

        await this.waitIfPause();

        this._started = true;

        this.runtime.emit("execute", node, parent);
        return runTask(context, work).then((r) => {
            this.runtime.emit("finish", r, node);
            return r;
        }, (e) => {
            if (e instanceof Task.CancelledError) {
                this.runtime.emit("cancel", node);
                throw e;
            }
            this.runtime.emit("node-error", e, node);
            throw e;
        });
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
    readonly isCancelled: boolean;
    readonly isPaused: boolean;
    readonly isStarted: boolean;
    readonly root: N | undefined;
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
    export class CancelledError extends Error {
    }

    export interface Context {
        pausealbe(onPause?: () => void, onResume?: () => void): void;
        update(progres: number, total?: number, message?: string): void;
        execute<T>(task: TaskOrTaskObject<T>): Promise<T>;
    }

    export type StateFactory<X extends Task.State = Task.State> = (node: Task.State) => X;

    export const DEFAULT_STATE_FACTORY: StateFactory = (n) => n;

    /**
     * Run the task immediately (next tick)
     * @param task The task will be run
     */
    export function execute<T>(task: TaskOrTaskObject<T>): Promise<T> {
        return new TaskRunContext(task, { emit() { } } as any, DEFAULT_STATE_FACTORY).start();
    }

    export function createRuntime<X extends Task.State = Task.State>(factory: StateFactory<X> = DEFAULT_STATE_FACTORY as any, maxConcurrentTasks: number = cpus().length / 2): TaskRuntime {
        return new TaskRuntime(factory, maxConcurrentTasks);
    }

    export interface State {
        name: string;
        arguments?: { [key: string]: any };
        path: string;
    }
}

export default Task;
