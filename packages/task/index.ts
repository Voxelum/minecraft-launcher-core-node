import { EventEmitter } from "events";

export type TaskNode = Task.State;

function runTask<T>(context: Task.Context, task: TaskOrTaskObject<T>): Promise<T> {
    try {
        const result = typeof task === "function" ? task(context) : task.run(context);
        return result instanceof Promise ? result : Promise.resolve(result);
    } catch (e) {
        return Promise.reject(e);
    }
}

export interface TaskRuntime<N extends Task.State = Task.State> extends EventEmitter {
    readonly factory: Task.StateFactory<N>;

    on(event: "execute", listener: (node: N, parent?: N) => void): this;
    on(event: "node-error", listener: (error: any, node: N) => void): this;
    on(event: "update", listener: (update: { progress: number, total?: number, message?: string }, node: N) => void): this;
    on(event: "finish", listener: (result: any, node: N) => void): this;
    on(event: "pause", listener: (node: N) => void): this;
    on(event: "resume", listener: (node: N) => void): this;
    on(event: "cancel", listener: (node: N) => void): this;

    once(event: "execute", listener: (node: N, parent?: N) => void): this;
    once(event: "node-error", listener: (error: any, node: N) => void): this;
    once(event: "update", listener: (update: { progress: number, total?: number, message?: string }, node: N) => void): this;
    once(event: "finish", listener: (result: any, node: N) => void): this;
    once(event: "pause", listener: (node: N) => void): this;
    once(event: "resume", listener: (node: N) => void): this;
    once(event: "cancel", listener: (node: N) => void): this;

    /**
     * Submit the task to task runtime. The runtime will decide when to run the task
     * @param task The task will be run
     */
    submit<T>(task: TaskOrTaskObject<T>): TaskHandle<T, N>;
}

class RuntimeImpl<N extends Task.State = Task.State> extends EventEmitter implements TaskRuntime<N>  {
    constructor(readonly factory: Task.StateFactory<N>) { super(); }

    submit<T>(task: TaskOrTaskObject<T>) {
        const handle = new TaskHandle(task, this, this.factory);
        return handle;
    }
}


export class TaskHandle<T, N extends Task.State> {
    // tslint:disable: variable-name
    private _cancelled = false;
    private _promise: Promise<T> = new Promise<T>((resolve, reject) => {
        this._reject = reject;
        this._resolve = resolve;
    });
    private _reject: any;
    private _resolve: any;
    private _paused: boolean = false;

    private _started: boolean = false;
    private _resumeCallback: null | (() => void) = null;
    private _onPause: null | (() => void) = null;
    private _onResume: null | (() => void) = null;

    private root: N;
    // tslint:enable: variable-name

    constructor(
        readonly task: TaskOrTaskObject<T>,
        readonly runtime: EventEmitter,
        private factory: (state: Task.State) => N) {
        this.root = this.factory({
            name: this.task.name,
            arguments: this.task.parameters,
            path: this.task.name,
        });
        this.executeOnNode(
            this.createContext(this.root),
            this.task,
            this.root).then((r) => this._resolve(r), (e) => this._reject(e));
    }

    wait(): Promise<T> {
        return this._promise;
    }

    cancel(): void {
        this._cancelled = true;
    }

    get isCancelled() { return this._cancelled; }

    get isPaused() { return this._paused; }

    pause() {
        this._paused = true;
        if (this._onPause) { this._onPause(); }
    }

    resume() {
        this._paused = false;
        if (this._resumeCallback) {
            this._resumeCallback();
        }
        if (this._onResume) {
            this._onResume();
        }
        this.runtime.emit("resume", this.root);
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
    export function execute<T, N extends Task.State = State>(task: TaskOrTaskObject<T>) {
        return new TaskHandle(task, { emit() { } } as any, DEFAULT_STATE_FACTORY).wait();
    }

    export function createRuntime<X extends Task.State = Task.State>(factory: StateFactory<X> = DEFAULT_STATE_FACTORY as any): TaskRuntime {
        return new RuntimeImpl(factory);
    }

    export interface State {
        name: string;
        arguments?: { [key: string]: any };
        path: string;
    }
}

export default Task;
