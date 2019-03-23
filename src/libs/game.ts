// tslint:disable:variable-name
export interface Pos2 {
    x: number; z: number;
}

export interface Pos3 extends Pos2 {
    y: number;
}

export enum GameType {
    NON = -1,
    SURVIVAL = 0,
    CREATIVE = 1,
    ADVENTURE = 2,
    SPECTATOR = 3,
}

export namespace GameType {
    const _internal_map: { [key: number]: GameType } = {};
    _internal_map[-1] = GameType.NON;
    _internal_map[1] = GameType.SURVIVAL;
    _internal_map[2] = GameType.CREATIVE;
    _internal_map[3] = GameType.ADVENTURE;
    _internal_map[4] = GameType.SPECTATOR;

    export function getByID(id: number): GameType {
        return _internal_map[id];
    }
}

export interface GameRule {
    doTileDrops: boolean;
    doFireTick: boolean;
    reducedDebugInfo: boolean;
    naturalRegeneration: boolean;
    disableElytraMovementCheck: boolean;
    doMobLoot: boolean;
    keepInventory: boolean;
    doEntityDrops: boolean;
    mobGriefing: boolean;
    randomTickSpeed: number;
    commandBlockOutput: boolean;
    spawnRadius: number;
    doMobSpawning: boolean;
    logAdminCommands: boolean;
    spectatorsGenerateChunks: boolean;
    sendCommandFeedback: boolean;
    doDaylightCycle: boolean;
    showDeathMessages: boolean;
}

export enum ResourceMode {
    ENABLED,
    DISABLED,
    PROMPT,
}
