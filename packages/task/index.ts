export class CancelledError<T> extends Error {
    constructor(readonly partialResult: T | undefined) {
        super("Cancelled");
    }
}

export enum TaskState {
    Idel,
    Running,
    Cancelled,
    Paused,
    Successed,
    Failed
}

export interface Task<T = any> {
    readonly name: string;
    readonly param: Record<string, any>;
    readonly progress: number;
    readonly total: number;
    readonly from: string | undefined;
    readonly to: string | undefined;

    readonly path: string;
    readonly id: number;
    readonly isCancelled: boolean;
    readonly isPaused: boolean;
    readonly isDone: boolean;
    readonly isRunning: boolean;
    readonly state: TaskState;

    readonly context: TaskContext | undefined;
    readonly parent: Task<any> | undefined;

    pause(): Promise<void>;
    resume(): void;
    cancel(): Promise<void>;
    start(context?: TaskContext, parent?: Task<any>): void;
    wait(): Promise<T>;
    startAndWait(context?: TaskContext, parent?: Task<any>): Promise<T>;

    onChildUpdate(chunkSize: number): void;

    map<N>(transform: Transform<this, N>): Task<N>;

    setName(name: string, param?: Record<string, any>): this;
}

export interface Transform<T, N> {
    (this: T, value: T): N
}

export interface TaskContext {
    fork?(task: Task<any>): number;
    onStart?(task: Task<any>): void;
    onUpdate?(task: Task<any>, chunkSize: number): void;
    onFailed?(task: Task<any>, error: any): void;
    onSuccessed?(task: Task<any>, result: any): void;
    onPaused?(task: Task<any>): void;
    onResumed?(task: Task<any>): void;
    onCancelled?(task: Task<any>): void;
}

export function createFork(): TaskContext["fork"] {
    let id = 0;
    return () => id++;
}

export abstract class TaskBase<T> implements Task<T> {
    protected _state: TaskState = TaskState.Idel;
    protected _promise: Promise<T> = new Promise((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
    });

    protected resolve!: (value: T) => void;
    protected reject!: (err: any) => void;

    protected _from: string | undefined;
    protected _to: string | undefined;
    protected _progress = 0;
    protected _total = -1;
    protected _path: string = "";
    protected _id: number = 0;

    parent: Task<any> | undefined;
    context: TaskContext = {};

    name: string = "";
    param: object = {};

    setName(name: string, param?: object) {
        this.name = name;
        this.param = param || this.param;
        return this;
    }

    get id() { return this._id }
    get path() { return this._path }
    get progress() { return this._progress }
    get total() { return this._total }
    get to() { return this._to }
    get from() { return this._from }
    get state() { return this._state }

    get isCancelled() { return this._state === TaskState.Cancelled; }
    get isPaused() { return this._state === TaskState.Paused; }
    get isDone() { return this._state === TaskState.Successed; }
    get isRunning() { return this._state === TaskState.Running; }

    async pause() {
        if (this._state !== TaskState.Running) { return; }
        this._state = TaskState.Paused;
        await this.performPause();
        this.context.onPaused?.(this);
    }
    resume() {
        if (this._state !== TaskState.Paused) { return; }
        this._state = TaskState.Running;
        this.performResume();
        this.context.onResumed?.(this);
    }
    async cancel() {
        if (this.state !== TaskState.Running && this.state !== TaskState.Idel) { return; }
        this._state = TaskState.Cancelled;
        await this.performCancel();
        this.context.onCancelled?.(this);
    }
    wait() {
        return this._promise;
    }
    start(context?: TaskContext, parent?: Task<any>) {
        if (this._state === TaskState.Cancelled) {
            throw new CancelledError(undefined);
        }
        if (this._state !== TaskState.Idel) {
            return;
        }
        Object.assign(this.context, context);
        if (!this.context.fork) { this.context.fork = createFork(); }
        this.parent = parent;
        this._state = TaskState.Running;
        this._id = this.context.fork!(this);
        this._path = parent ? `${parent.path}.${this.name}` : this.name;
        this.context.onStart?.(this);
        this.run().then((value) => {
            this.resolve(value);
            this._state = TaskState.Successed;
            this.context.onSuccessed?.(this, value);
        }, (error) => {
            this.reject(error);
            this._state = TaskState.Failed;
            this.context.onFailed?.(this, error);
        });
    }

    startAndWait(context?: TaskContext, parent?: Task<any>) {
        this.start(context, parent);
        return this.wait();
    }

    protected update(chunkSize: number) {
        this.context.onUpdate?.(this, chunkSize);
        this.parent?.onChildUpdate(chunkSize);
    }

    onChildUpdate(chunkSize: number) { }

    protected abstract run(): Promise<T>;
    protected abstract performCancel(): Promise<void>;
    protected abstract performPause(): Promise<void>;
    protected abstract performResume(): void;

    map<N>(transform: Transform<this, N>): Task<N> {
        const copy = Object.create(this);
        const wait = copy.wait;
        const startAndWait = copy.startAndWait;
        copy.wait = function (this: typeof copy) {
            // @ts-expect-error
            return wait.bind(this)().then((r) => transform.bind(this)(r));
        };
        copy.startAndWait = function (this: typeof copy) {
            // @ts-expect-error
            return startAndWait.bind(this)().then((r) => transform.bind(this)(r));
        };
        return copy;
    }
}


export abstract class TaskLooped<T> extends TaskBase<T> {
    protected _pausing: Promise<void> = Promise.resolve();
    protected _unpause = () => { };

    protected abstract process(): Promise<[boolean, T | undefined]>;
    protected abstract validate(): Promise<void>;
    protected abstract shouldTolerant(e: any): boolean;
    protected abstract abort(isCancelled: boolean): Promise<void>;
    protected abstract reset(): void;

    protected performCancel(): Promise<void> {
        return this.abort(true);
    }
    protected performPause(): Promise<void> {
        this._pausing = new Promise((resolve) => {
            this._unpause = resolve;
        })
        return this.abort(false);
    }
    protected performResume(): void {
        this._unpause();
    }

    protected async run() {
        let result: T | undefined;
        let isDone = false;
        while (!isDone) {
            try {
                [isDone, result] = await this.process();
                if (this.state === TaskState.Cancelled) {
                    throw new CancelledError<T>(result);
                }
                await this._pausing;
                if (!isDone) {
                    continue;
                }
                await this.validate();
            } catch (e) {
                if (!this.shouldTolerant(e)) {
                    throw e;
                }
                // if not throw, reset the state and retry
                isDone = false;
                this.reset();
            }
        }
        return result!;
    }
}

export type TaskExecutor<T> = (this: TaskRoutine<any>) => Promise<T> | T;

export abstract class TaskGroup<T> extends TaskBase<T> {
    protected children: Task<any>[] = [];

    onChildUpdate(chunkSize: number) {
        let total = 0;
        let progress = 0;
        for (const task of this.children) {
            progress += task.progress;
            total += task.total;
        }
        this._total = total;
        this._progress = progress;
        this.update(chunkSize);
    };

    protected async performCancel(): Promise<void> {
        await Promise.all(this.children.map((task) => task.cancel()));
    }
    protected async performPause(): Promise<void> {
        await Promise.all(this.children.map((task) => task.pause()));
    }
    protected performResume(): void {
        this.children.forEach((task) => task.resume());
    }
}

export class TaskRoutine<T> extends TaskGroup<T> {
    constructor(readonly name: string, readonly executor: TaskExecutor<T>, readonly param: object = {}) {
        super();
    }

    concat<T>(task: TaskRoutine<T>): Promise<T> {
        try {
            const result = task.executor.bind(this)();
            if (result instanceof Promise) {
                return result;
            }
            return Promise.resolve(result);
        } catch (e) {
            return Promise.reject(e);
        }
    }

    /**
     * Yield a new child task to this routine
     */
    yield<T>(task: Task<T>): Promise<T> {
        if (this.state !== TaskState.Running) {
            throw new Error("IllegalState")
        }
        this.children.push(task);
        return task.startAndWait(this.context, this);
    }

    protected run(): Promise<T> {
        try {
            const result = this.executor.bind(this)();
            if (result instanceof Promise) {
                return result;
            }
            return Promise.resolve(result);
        } catch (e) {
            return Promise.reject(e);
        }
    }
}

export function task<T>(name: string, executor: TaskExecutor<T>, param: object = {}): TaskRoutine<T> {
    return new TaskRoutine<T>(name, executor, param);
}
