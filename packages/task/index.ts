export type TaskNode = Task.Node;

function execute<T>(context: Task.Context, work: Task.Work<T>): Promise<T> {
    try {
        const result = work(context);
        return result instanceof Promise ? result : Promise.resolve(result);
    } catch (e) {
        return Promise.reject(e);
    }
}

export interface Task<T> {
    readonly root: Task.Node;
    readonly work: Task.Work<T>;

    onChild(listener: (parentNode: Task.Node, childNode: Task.Node) => void): this;
    onError(listener: (error: any, childNode: Task.Node) => void): this;
    onUpdate(listener: (update: { progress: number, total?: number, message?: string }, childNode: Task.Node) => void): this;
    onFinish(listener: (result: any, childNode: Task.Node) => void): this;

    execute(): Promise<T>;
    cancel(): void;
}

class TaskImpl<T> implements Task<T> {
    readonly root: Task.Node;
    // tslint:disable: variable-name
    private _child: Array<(parentNode: Task.Node, childNode: Task.Node) => void> = [];
    private _errors: Array<(error: any, childNode: Task.Node) => void> = [];
    private _updates: Array<(update: { progress: number, total?: number, message?: string }, childNode: Task.Node) => void> = [];
    private _finish: Array<(result: any, childNode: Task.Node) => void> = [];
    private _cancelled = false;
    // tslint:enable: variable-name

    constructor(nameOrObject: string | { name: string, arguments: object }, readonly work: Task.Work<T>) {
        let args: object | undefined;
        let name;
        if (typeof nameOrObject === "string") { name = nameOrObject; } else {
            name = nameOrObject.name;
            args = nameOrObject.arguments;
        }
        this.root = {
            name,
            arguments: args,
            path: name,
            total: -1,
            progress: -1,
            tasks: [],
            error: undefined,
            status: "running",
            message: "",
        };
    }

    onChild(listener: (parentNode: Task.Node, childNode: Task.Node) => void): this {
        this._child.push(listener);
        return this;
    }
    onError(listener: (error: any, childNode: Task.Node) => void): this {
        this._errors.push(listener);
        return this;
    }
    onUpdate(listener: (update: { progress: number, total?: number, message?: string }, childNode: Task.Node) => void): this {
        this._updates.push(listener);
        return this;
    }
    onFinish(listener: (result: any, childNode: Task.Node) => void): this {
        this._finish.push(listener);
        return this;
    }

    createContext(node: Task.Node): Task.Context {
        const self = this;
        return {
            update(progress: number, total?: number, message?: string) {
                node.progress = progress;
                node.total = total || node.total;
                node.message = message || node.message;
                self._updates.forEach((u) => u({ progress, total, message }, node));
                if (self._cancelled) {
                    node.status = "cancelled";
                    throw new Error("cancelled");
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
                        args = { ...args, ...node.arguments };
                    } else {
                        args = node.arguments;
                    }
                }

                const nextPath = node.path + "." + name;
                const nextNode: Task.Node = {
                    name,
                    arguments: args,
                    path: nextPath,
                    total: -1,
                    progress: -1,
                    tasks: [],
                    error: undefined,
                    status: "running",
                    message: "",
                };
                node.tasks.push(nextNode);
                self._child.forEach((c) => c(node, nextNode));
                const context = self.createContext(nextNode);

                if (self._cancelled) {
                    nextNode.status = "cancelled";
                    throw new Error("cancelled");
                }

                return self.executeOnNode(context, work, nextNode);
            },
        };
    }

    execute(): Promise<T> {
        return this.executeOnNode(this.createContext(this.root), this.work, this.root);
    }

    cancel(): void {
        this._cancelled = true;
    }

    private executeOnNode<N>(context: Task.Context, work: Task.Work<N>, node: Task.Node) {
        return execute(context, work).then((r) => {
            node.status = "successed";
            this._finish.forEach((func) => func(r, node));
            return r;
        }).catch((e) => {
            if (e === "cancelled") {
                node.status = "cancelled";
                throw e;
            }
            node.status = "failed";
            node.error = e;
            this._errors.forEach((f) => f(e, node));
            throw e;
        });
    }
}

export namespace Task {
    export interface Context {
        update(progres: number, total?: number, message?: string): void;
        execute<T>(name: string, work: Work<T>): Promise<T>;
        execute<T>(object: { name: string, arguments: object }, work: Work<T>): Promise<T>;
    }

    export type Work<T> = (context: Task.Context) => (Promise<T> | T);

    export function create<T>(name: string | { name: string, arguments: object }, work: Work<T>): Task<T> {
        return new TaskImpl<T>(name, work);
    }

    export interface Node {
        name: string;
        arguments?: object;
        total: number;
        progress: number;
        status: "running" | "successed" | "failed" | "cancelled";
        path: string;
        tasks: Node[];
        error: any;
        message: string;
    }
}

export default Task;
