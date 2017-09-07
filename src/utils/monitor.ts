export class Task extends NodeJS.EventEmitter {
    constructor(readonly id: string, readonly total: number) {
        super();
    }
    error(e: Error) { this.emit('error', e) }
    update(progress: number, state?: string) { this.emit('update', progress, state) }
    finish() { this.emit('finish') }
}

export interface Monitor extends NodeJS.EventEmitter {
    on(event: 'task', handler: (task: Task) => void): this;
}

export const monitor: Monitor = new NodeJS.EventEmitter();
