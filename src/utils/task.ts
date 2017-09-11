import { EventEmitter } from 'events';

export interface Task<T> extends EventEmitter {
    readonly id: string;
    on(event: 'error', listener: (error: Error) => void): this;
    on(event: 'update', listener: (progres: number, total?: number, status?: string) => void): this;
    on(event: 'finish', listener: (result: T) => void): this;
    execute(context: Task.Context): Promise<T>
}

export class SimpleTask<T> extends EventEmitter implements Task<T> {
    constructor(readonly id: string, readonly promise: (() => Promise<T>) | Promise<T>) { super(); }
    execute(context: Task.Context): Promise<T> {
        if (this.promise instanceof Promise) {
            return this.promise;
        } else {
            return this.promise();
        }
    }
}

export abstract class AbstractTask<T> extends EventEmitter implements Task<T> {
    readonly id: string;
    constructor(id?: string) {
        super();
        this.id = id || this.constructor.name;
    }
    abstract execute(context: Task.Context): Promise<T>;
}

export namespace Task {
    export interface Context {
        execute<T>(task: Task<T>): Promise<T>;
        wrap<T>(id: string, promise: (() => Promise<T>) | Promise<T>): Promise<T>;
    }

    export function wrap<T>(id: string, promise: (() => Promise<T>) | Promise<T>): Task<T> {
        return new SimpleTask(id, promise);
    }

    export function execute<T>(task: Task<T>) {
        return dummyContext.execute(task);
    }
    class DummyContext implements Context {
        execute<T>(task: Task<T>): Promise<T> {
            return task.execute(this).then((r) => {
                task.emit('finish', r);
                return r;
            }, (e) => {
                task.emit('error', e);
                throw e;
            })
        }
        wrap<T>(id: string, promise: Promise<T> | (() => Promise<T>)): Promise<T> {
            return Task.wrap(id, promise).execute(this);
        }
    }
    const dummyContext = new DummyContext()
}

export default Task;