import { EventEmitter } from "events";

export type TaskNode = Task.State;

function execute<T>(context: Task.Context, work: Task.Work<T>): Promise<T> {
    try {
        const result = work(context);
        return result instanceof Promise ? result : Promise.resolve(result);
    } catch (e) {
        return Promise.reject(e);
    }
}

export interface Task<T, N = Task.State> extends EventEmitter {
    readonly root: N;
    readonly work: Task.Work<T>;

    on(event: "child", listener: (parentNode: N, childNode: N) => void): this;
    on(event: "node-error", listener: (error: any, childNode: N) => void): this;
    on(event: "update", listener: (update: { progress: number, total?: number, message?: string }, childNode: N) => void): this;
    on(event: "finish", listener: (result: any, childNode: N) => void): this;
    on(event: "pause", listener: (node: N) => void): this;
    on(event: "resume", listener: (node: N) => void): this;
    on(event: "cancel", listener: () => void): this;

    once(event: "child", listener: (parentNode: N, childNode: N) => void): this;
    once(event: "node-error", listener: (error: any, childNode: N) => void): this;
    once(event: "update", listener: (update: { progress: number, total?: number, message?: string }, childNode: N) => void): this;
    once(event: "finish", listener: (result: any, childNode: N) => void): this;
    once(event: "pause", listener: (node: N) => void): this;
    once(event: "resume", listener: (node: N) => void): this;
    once(event: "cancel", listener: () => void): this;

    execute(): Promise<T>;

    pause(): void;
    resume(): void;

    cancel(): void;
}

class TaskImpl<T, N extends Task.State> extends EventEmitter implements Task<T, N> {
    readonly root: N;
    // tslint:disable: variable-name
    private _cancelled = false;
    private _promise: Promise<T> = new Promise<T>((resolve, reject) => {
        this._reject = reject;
        this._resolve = resolve;
    });
    private _reject: any;
    private _resolve: any;
    private _paused: boolean = false;
    // tslint:enable: variable-name

    constructor(nameOrObject: string | { name: string, arguments: object }, readonly work: Task.Work<T>, private factory: (state: Task.State) => N) {
        super();
        let args: object | undefined;
        let name;
        if (typeof nameOrObject === "string") { name = nameOrObject; } else {
            name = nameOrObject.name;
            args = nameOrObject.arguments;
        }
        this.root = factory({
            name,
            arguments: args,
            path: name,
            total: -1,
            progress: -1,
            children: [],
            error: undefined,
            status: "ready",
            message: "",
        });
    }

    createContext(node: Task.State): Task.Context {
        const self = this;
        return {
            get task() {
                return self;
            },
            update(progress: number, total?: number, message?: string) {
                node.progress = progress;
                node.total = total || node.total;
                node.message = message || node.message;
                self.emit("update", { progress, total, message }, node);
                if (self._cancelled) {
                    node.status = "cancelled";
                    throw new Task.CancelledError();
                }
            },
            execute<X>(nameOrObject: string | { name: string, arguments: object }, work: Task.Work<X>): Promise<X> {
                let name;
                let args: object | undefined;
                if (typeof nameOrObject === "string") { name = nameOrObject; } else {
                    name = nameOrObject.name;
                    args = nameOrObject.arguments;
                }
                if (node.arguments) {
                    if (args) {
                        args = { ...node.arguments, ...args };
                    } else {
                        args = node.arguments;
                    }
                }

                const nextPath = node.path + "." + name;
                const nextNode: N = self.factory({
                    name,
                    arguments: args,
                    path: nextPath,
                    total: -1,
                    progress: -1,
                    children: [],
                    error: undefined,
                    status: "ready",
                    message: "",
                });
                self.emit("child", node, nextNode);
                const context = self.createContext(nextNode);

                return self.executeOnNode(context, work, nextNode);
            },
        };
    }

    execute(): Promise<T> {
        if (this.root.status !== "ready") { return this._promise; }
        this.executeOnNode(this.createContext(this.root), this.work, this.root)
            .then((r) => this._resolve(r), (e) => this._reject(e));
        return this._promise;
    }

    cancel(): void {
        this._cancelled = true;
        this.emit("cancel");
    }

    pause() {
        this._paused = true;
        this.emit("pause");
    }

    resume() {
        this._paused = false;
        this.emit("resume");
    }

    private async waitIfPause() {
        if (this._paused) {
            await new Promise<void>((resolve, reject) => {
                this.once("resume", () => resolve());
            });
        }
    }

    private async executeOnNode<CT>(context: Task.Context, work: Task.Work<CT>, node: Task.State) {
        if (this._cancelled) {
            node.status = "cancelled";
            throw new Task.CancelledError();
        }

        if (this._paused) {
            node.status = "paused";
        }

        await this.waitIfPause();

        node.status = "running";
        return execute(context, work).then((r) => {
            node.status = "successed";
            this.emit("finish", r, node);
            return r;
        }, (e) => {
            if (e instanceof Task.CancelledError) {
                node.status = "cancelled";
                throw e;
            }
            node.status = "failed";
            node.error = e;
            this.emit("node-error", e, node);
            throw e;
        });
    }
}

export namespace Task {
    export class CancelledError extends Error {
    }

    export type Status = "ready" | "running" | "successed" | "failed" | "cancelled" | "paused";
    export interface Context {
        readonly task: Task<any>;

        update(progres: number, total?: number, message?: string): void;
        execute<T>(name: string, work: Work<T>): Promise<T>;
        execute<T>(object: { name: string, arguments: object }, work: Work<T>): Promise<T>;
    }

    export type Work<T> = (context: Task.Context) => (Promise<T> | T);

    export type StateFactory<X extends Task.State = Task.State> = (node: Task.State) => X;

    export const DEFAULT_STATE_FACTORY: StateFactory = (n) => n;

    let usingStateFactory: StateFactory = DEFAULT_STATE_FACTORY;

    /**
     * Change the default factory of state
     */
    export function useStateFactory<T extends Task.State>(factory: StateFactory<T>) {
        usingStateFactory = factory;
    }

    export function create<T, N extends Task.State = Task.State>(name: string | { name: string, arguments: object }, work: Work<T>, stateFactory: StateFactory<N> = usingStateFactory as StateFactory<N>): Task<T> {
        return new TaskImpl<T, N>(name, work, stateFactory);
    }

    export interface State {
        name: string;
        arguments?: object;
        total: number;
        progress: number;
        status: Status;
        path: string;
        children: State[];
        error: any;
        message: string;
    }
}

export default Task;
