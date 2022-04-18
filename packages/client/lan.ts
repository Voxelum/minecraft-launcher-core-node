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
    private sock: Socket

    constructor() {
        super()
        const sock = createSocket({ type: "udp4", reuseAddr: true })

        sock.on("listening", () => {
            const address = sock.address()
            sock.addMembership(LAN_MULTICAST_ADDR, address.address)
            sock.setMulticastTTL(128);
            sock.setBroadcast(true)
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

        this.sock = sock
    }

    bind(): Promise<void> {
        return new Promise((resolve) => {
            this.sock.bind(LAN_MULTICAST_PORT, "0.0.0.0", () => {
                resolve()
            })
        })
    }

    destroy(): Promise<void> {
        return new Promise((resolve) => {
            this.sock.close(resolve)
        })
    }
}

export interface LanServerInfo {
    motd: string
    port: number
}

export class MinecraftLanBroadcaster {
    private sock: Socket

    constructor() {
        const sock = createSocket({ type: "udp4", reuseAddr: true })
        sock.addMembership(LAN_MULTICAST_ADDR)
        sock.setMulticastTTL(120)
        this.sock = sock
    }

    broadcast(inf: LanServerInfo) {
        this.sock.send(`[MOTD]${inf.motd}[/MOTD][AD]${inf.port}[/AD]`, LAN_MULTICAST_PORT, LAN_MULTICAST_ADDR, (err, bytes) => {
            // todo handle this
        })
    }

    bind() {
        this.sock.bind();
    }

    destroy() {
        return new Promise<void>((resolve) => {
            this.sock.close(resolve)
        })
    }
}
