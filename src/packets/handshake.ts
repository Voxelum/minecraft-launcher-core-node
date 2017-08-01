export interface Handshake {
    protocol: number,
    host: string,
    port: number,
    nextState: Handshake.State,
}

export namespace Handshake {
    export enum State {
        Status = 1, Loign = 2
    }
}

