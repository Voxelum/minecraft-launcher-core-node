import { EventEmitter } from 'events'
export class TaskImpl extends EventEmitter {
    constructor(readonly id: string, readonly total: number) {
        super();
    }
    error(e: Error) { this.emit('error', e) }
    update(progress: number, state?: string) { this.emit('update', progress, state) }
    finish() { this.emit('finish') }
}

export interface Task extends EventEmitter {
    readonly id: string,
    readonly total: number,
    on(event: 'error', listener: (err: Error) => void): this;
    on(event: 'update', listener: (progress: number, state?: string) => void): this;
    on(event: 'finish', listener: () => void): this;
}

export interface Monitor extends EventEmitter {
    on(event: 'task', handler: (task: Task) => void): this;
}

export const monitor: Monitor = new EventEmitter();
