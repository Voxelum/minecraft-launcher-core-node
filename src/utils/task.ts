import { EventEmitter } from 'events';
import * as os from 'os';

export interface Task<T> extends EventEmitter {
    readonly id: string;
    on(event: 'error', listener: (error: Error) => void): this;
    on(event: 'update', listener: (progres: number, total?: number, status?: string) => void): this;
    on(event: 'finish', listener: (result: T) => void): this;
    execute(context: Task.Context): Promise<T>
}

export class SimpleTask<T> extends EventEmitter implements Task<T> {
    constructor(readonly id: string, readonly promise: (() => Promise<T>) | Promise<T>, readonly retry: number = 0) { super(); }
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
        wrapAndExecute<T>(id: string, promise: () => Promise<T>): Promise<T>;
        executeAll<T>(task: Task<T>[]): Promise<T[]>;
    }

    export function wrap<T>(id: string, promise: () => Promise<T>): Task<T> {
        return new SimpleTask(id, promise);
    }

    export function execute<T>(task: Task<T>) {
        return dummyContext.execute(task);
    }

    export class ParallelContext implements Context {
        constructor(readonly parallelNumber: number = os.cpus.length == 0 ? 5 : os.cpus.length) {
        }
        execute<T>(task: Task<T>): Promise<T> {
            return task.execute(this).then((r) => {
                task.emit('finish', r);
                return r;
            }, (e) => {
                task.emit('error', e);
                throw e;
            })
        }
        wrapAndExecute<T>(id: string, promise: () => Promise<T>): Promise<T> {
            return Task.wrap(id, promise).execute(this);
        }

        async executeAll<T>(task: Task<T>[]): Promise<T[]> {
            const result: T[] = []
            for (let i = 0; i < task.length; i += this.parallelNumber) {
                let promises: Promise<T>[] = []
                for (let j = 0; j < this.parallelNumber; ++j) {
                    if (task[j + i]) {
                        promises.push(task[j + i].execute(this))
                    }
                }
                result.push(...(await Promise.all(promises)))
            }
            return result;
        }
    }
    const dummyContext = new ParallelContext()
}

export default Task;