import { Socket, createSocket, RemoteInfo } from "dgram"
import { EventEmitter } from "events"

export const LAN_MULTICAST_ADDR = "224.0.2.60"
export const LAN_MULTICAST_PORT = 4445

export interface MinecraftLanDiscover {
    on(channel: "discover", listener: (event: LanServerInfo & { remote: RemoteInfo }) => void): this
    once(channel: "discover", listener: (event: LanServerInfo & { remote: RemoteInfo }) => void): this
    addListener(channel: "discover", listener: (event: LanServerInfo & { remote: RemoteInfo }) => void): this
    removeListener(channel: "discover", listener: (event: LanServerInfo & { remote: RemoteInfo }) => void): this
}

export class MinecraftLanDiscover extends EventEmitter {
    readonly socket: Socket

    #ready = false

    get isReady() {
        return this.#ready
    }

    constructor() {
        super()
        const sock = createSocket({ type: "udp4", reuseAddr: true })

        sock.on("listening", () => {
            const address = sock.address()
            sock.addMembership(LAN_MULTICAST_ADDR, address.address)
            sock.setMulticastTTL(128);
            sock.setBroadcast(true)
            this.#ready = true
        })

        sock.on("message", (buf, remote) => {
            const content = buf.toString("utf-8")

            const motdRegx = /\[MOTD\](.+)\[\/MOTD\]/g
            const portRegx = /\[AD\](.+)\[\/AD\]/g

            const portResult = portRegx.exec(content)
            if (!portResult || !portResult[1]) {
                // emit error
            } else {
                const motd = motdRegx.exec(content)?.[1] ?? ""
                const port = Number.parseInt(portResult[1])
                this.emit("discover", { motd, port, remote })
            }
        })

        this.socket = sock
    }

    broadcast(inf: LanServerInfo) {
        return new Promise<number>((resolve, reject) => {
            this.socket.send(`[MOTD]${inf.motd}[/MOTD][AD]${inf.port}[/AD]`, LAN_MULTICAST_PORT, LAN_MULTICAST_ADDR, (err, bytes) => {
                if (err) reject(err)
                else resolve(bytes)
            })
        })
    }

    bind(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.socket.bind(LAN_MULTICAST_PORT, () => {
                resolve()
            }).once('error', (e) => {
                reject(e)
            })
        })
    }

    destroy(): Promise<void> {
        return new Promise((resolve) => {
            this.socket.close(resolve)
        })
    }
}

export interface LanServerInfo {
    motd: string
    port: number
}
