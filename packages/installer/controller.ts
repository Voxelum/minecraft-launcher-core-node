import { EventEmitter } from "events";

export class TaskController {
    
}

export class Task extends EventEmitter {
    readonly cancelled: boolean
    readonly paused: boolean
    readonly state: TaskState
}

export enum TaskState {
    Idel,
    Running,
    Cancelled,
    Paused,
    Successed,
    Failed
}
