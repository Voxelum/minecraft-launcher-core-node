export interface Pos2 {
    x: number; z: number;
}

export interface Pos3 extends Pos2 {
    y: number;
}

export enum ResourceMode {
    ENABLED,
    DISABLED,
    PROMPT,
}

export interface ResourcePack {
    readonly description: string;
    readonly pack_format: number;
}

/**
 * @see https://minecraft.gamepedia.com/Commands#Raw_JSON_text
 */
export interface TextComponentFrame {
    text: string;
    translate?: string;
    with?: string[];
    score?: {
        name: string,
        objective: string,
        value: string,
    };
    selector?: string;
    keybind?: string;
    extra?: TextComponentFrame[];
    color?: string;
    bold?: boolean;
    italic?: boolean;
    underlined?: boolean;
    strikethrough?: boolean;
    obfuscated?: boolean;
    insertion?: string;
    clickEvent?: {
        action: "open_file" | "open_url" | "run_command" | "suggest_command",
        value: string,
    };
    hoverEvent?: {
        action: "show_text" | "show_item" | "show_entity",
        value: string,
    };
}

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

export namespace Forge {
    export interface ModIndentity {
        readonly modid: string;
        readonly version: string;
    }
}
