import { Forge, TextComponentFrame } from "./game";

export enum ResourceMode {
    ENABLED,
    DISABLED,
    PROMPT,
}

/**
 * The servers.dat format server information, contains known host displayed in "Multipler" page.
 */
export interface ServerInfoFrame {
    name?: string;
    host: string;
    port?: number;
    icon?: string;
    isLanServer?: boolean;
    resourceMode?: ResourceMode;
}

export interface ServerStatusFrame {
    version: {
        name: string,
        protocol: number,
    };
    players: {
        max: number,
        online: number,
        sample?: Array<{ id: string, name: string }>,
    };
    /**
     * The motd of server, which might be the raw TextComponent string or structurelized TextComponent JSON
     */
    description: TextComponentFrame | string;
    favicon: string | "";
    modinfo?: {
        type: string | "FML",
        modList: Forge.ModIndentity[],
    };
    ping: number;
}

