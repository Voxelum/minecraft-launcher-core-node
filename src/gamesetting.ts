import * as os from 'os';

const defaultFrame: GameSetting.Frame = {
    version: 1139, // for 1.12
    invertYMouse: false,
    mouseSensitivity: 0.5,
    difficulty: 2,

    // critical performance video settings 
    renderDistance: 12,
    particles: 0,
    fboEnable: true,
    fancyGraphics: true,
    ao: 2,
    renderClouds: true,
    enableVsync: true,
    useVbo: true,
    mipmapLevels: 4,
    anaglyph3d: false,

    fov: 0,
    gamma: 0,
    saturation: 0,
    guiScale: 0,
    bobView: true,
    maxFps: 120,
    fullscreen: false,

    resourcePacks: [],
    incompatibleResourcePacks: [],
    lastServer: '',
    lang: 'en_us',
    chatVisibility: 0,
    chatColors: true,
    chatLinks: true,
    chatLinksPrompt: true,
    chatOpacity: 1,
    snooperEnabled: true,

    hideServerAddress: false,
    advancedItemTooltips: false,
    pauseOnLostFocus: true,
    touchscreen: false,
    overrideWidth: 0,
    overrideHeight: 0,
    heldItemTooltips: true,
    chatHeightFocused: 1,
    chatHeightUnfocused: 0.44366196,
    chatScale: 1,
    chatWidth: 1,
    forceUnicodeFont: false,
    reducedDebugInfo: false,
    useNativeTransport: true,
    entityShadows: true,
    mainHand: 'right',
    attackIndicator: 1,
    showSubtitles: false,
    realmsNotifications: true,
    enableWeakAttacks: false,
    autoJump: true,
    narrator: 0,
    tutorialStep: 'movement',
    'key_key.attack': -100,
    'key_key.use': -99,
    'key_key.forward': 17,
    'key_key.left': 30,
    'key_key.back': 31,
    'key_key.right': 32,
    'key_key.jump': 57,
    'key_key.sneak': 42,
    'key_key.sprint': 29,
    'key_key.drop': 16,
    'key_key.inventory': 18,
    'key_key.chat': 20,
    'key_key.playerlist': 15,
    'key_key.pickItem': -98,
    'key_key.command': 53,
    'key_key.screenshot': 60,
    'key_key.togglePerspective': 63,
    'key_key.smoothCamera': 0,
    'key_key.fullscreen': 87,
    'key_key.spectatorOutlines': 0,
    'key_key.swapHands': 33,
    'key_key.saveToolbarActivator': 46,
    'key_key.loadToolbarActivator': 45,
    'key_key.advancements': 38,
    'key_key.hotbar.1': 2,
    'key_key.hotbar.2': 3,
    'key_key.hotbar.3': 4,
    'key_key.hotbar.4': 5,
    'key_key.hotbar.5': 6,
    'key_key.hotbar.6': 7,
    'key_key.hotbar.7': 8,
    'key_key.hotbar.8': 9,
    'key_key.hotbar.9': 10,
    soundCategory_master: 1,
    soundCategory_music: 1,
    soundCategory_record: 1,
    soundCategory_weather: 1,
    soundCategory_block: 1,
    soundCategory_hostile: 1,
    soundCategory_neutral: 1,
    soundCategory_player: 1,
    soundCategory_ambient: 1,
    soundCategory_voice: 1,
    modelPart_cape: true,
    modelPart_jacket: true,
    modelPart_left_sleeve: true,
    modelPart_right_sleeve: true,
    modelPart_left_pants_leg: true,
    modelPart_right_pants_leg: true,
    modelPart_hat: true,
}

export class GameSetting {
    readonly version = 1139 // for 1.12
    public invertYMouse = false
    public mouseSensitivity = 0.5
    public difficulty = 2

    // critical performance video settings 
    public renderDistance = 12
    public particles = 0
    fboEnable = true
    public fancyGraphics = true
    ao = 2
    public renderClouds = true
    public enableVsync = true
    useVbo = true
    public mipmapLevels = 4
    public anaglyph3d = false

    public fov = 0
    public gamma = 0
    public saturation = 0
    public guiScale = 0
    public bobView = true
    public maxFps = 120
    public fullscreen = false

    public resourcePacks = []
    incompatibleResourcePacks = []
    lastServer = ''
    lang = 'en_us'
    chatVisibility = 0
    chatColors = true
    chatLinks = true
    chatLinksPrompt = true
    chatOpacity = 1
    snooperEnabled = true

    hideServerAddress = false
    advancedItemTooltips = false
    pauseOnLostFocus = true
    touchscreen = false
    overrideWidth = 0
    overrideHeight = 0
    heldItemTooltips = true
    chatHeightFocused = 1
    chatHeightUnfocused = 0.44366196
    chatScale = 1
    chatWidth = 1
    forceUnicodeFont = false
    reducedDebugInfo = false
    useNativeTransport = true
    entityShadows = true
    mainHand = 'right'
    attackIndicator = 1
    showSubtitles = false
    realmsNotifications = true
    enableWeakAttacks = false
    autoJump = true
    narrator = 0
    tutorialStep = 'movement'

    constructor(frame?: GameSetting.Frame) {
        if (frame) {
            Object.keys(frame)
                .filter(k => ((this as any)[k] !== undefined))
                .forEach((k) => { (this as any)[k] = (frame as any)[k] })
        }
    }

    get language() { return this.lang }
    set language(lang: string) { this.lang = lang }

    get vbo() { return this.useVbo }
    set vbo(useVbo) { this.useVbo = useVbo }

    get fbo() { return this.fboEnable }
    set fbo(fbo) { this.useVbo = fbo }

    get ambientOcclusion() { return this.ao }
    set ambientOcclusion(ao) { this.ao = ao }

    setHotKey(keyName: GameSetting.HotKeys, key: number) {
        const realKey = `key_key.${keyName}`;
        if ((this as any)[realKey]) {
            (this as any)[realKey] = key;
        }
    }
    getHotKey(keyName: GameSetting.HotKeys): number {
        const realKey = `key_key.${keyName}`;
        if ((this as any)[realKey]) {
            return (this as any)[realKey];
        }
        return 0;
    }

    setModelDisplay(model: GameSetting.ModelPart, enabled: boolean) {
        const realKey = `modelPart_${model}`;
        if ((this as any)[realKey]) {
            (this as any)[realKey] = enabled;
        }
    }
    isModelDisplay(model: GameSetting.ModelPart): boolean {
        const realKey = `modelPart_${model}`;
        if ((this as any)[realKey]) {
            return (this as any)[realKey];
        }
        return false;
    }

    setVolumn(category: GameSetting.SoundCategories, volumn: number) {
        const realKey = `soundCategory_${category}`;
        if ((this as any)[realKey]) {
            (this as any)[realKey] = volumn;
        }
    }
    getVolumn(category: GameSetting.SoundCategories): number {
        const realKey = `soundCategory_${category}`;
        if ((this as any)[realKey]) {
            return (this as any)[realKey];
        }
        return 0;
    }

    private 'key_key.attack' = -100
    private 'key_key.use' = -99
    private 'key_key.forward' = 17
    private 'key_key.left' = 30
    private 'key_key.back' = 31
    private 'key_key.right' = 32
    private 'key_key.jump' = 57
    private 'key_key.sneak' = 42
    private 'key_key.sprint' = 29
    private 'key_key.drop' = 16
    private 'key_key.inventory' = 18
    private 'key_key.chat' = 20
    private 'key_key.playerlist' = 15
    private 'key_key.pickItem' = -98
    private 'key_key.command' = 53
    private 'key_key.screenshot' = 60
    private 'key_key.togglePerspective' = 63
    private 'key_key.smoothCamera' = 0
    private 'key_key.fullscreen' = 87
    private 'key_key.spectatorOutlines' = 0
    private 'key_key.swapHands' = 33
    private 'key_key.saveToolbarActivator' = 46
    private 'key_key.loadToolbarActivator' = 45
    private 'key_key.advancements' = 38
    private 'key_key.hotbar.1' = 2
    private 'key_key.hotbar.2' = 3
    private 'key_key.hotbar.3' = 4
    private 'key_key.hotbar.4' = 5
    private 'key_key.hotbar.5' = 6
    private 'key_key.hotbar.6' = 7
    private 'key_key.hotbar.7' = 8
    private 'key_key.hotbar.8' = 9
    private 'key_key.hotbar.9' = 10
    private soundCategory_master = 1
    private soundCategory_music = 1
    private soundCategory_record = 1
    private soundCategory_weather = 1
    private soundCategory_block = 1
    private soundCategory_hostile = 1
    private soundCategory_neutral = 1
    private soundCategory_player = 1
    private soundCategory_ambient = 1
    private soundCategory_voice = 1
    private modelPart_cape = true
    private modelPart_jacket = true
    private modelPart_left_sleeve = true
    private modelPart_right_sleeve = true
    private modelPart_left_pants_leg = true
    private modelPart_right_pants_leg = true
    private modelPart_hat = true
}

export namespace GameSetting {

    export interface Frame {
        version?: number, // for number.12
        invertYMouse?: boolean,
        mouseSensitivity?: number,
        difficulty?: number,

        // critical performance video settings 
        renderDistance?: number,
        particles?: number,
        fboEnable?: boolean,
        fancyGraphics?: boolean,
        ao?: number,
        renderClouds?: boolean,
        enableVsync?: boolean,
        useVbo?: boolean,
        mipmapLevels?: number,
        anaglyph3d?: boolean,

        fov?: number,
        gamma?: number,
        saturation?: number,
        guiScale?: number,
        bobView?: boolean,
        maxFps?: number,
        fullscreen?: boolean,

        resourcePacks?: string[],
        incompatibleResourcePacks?: string[],
        lastServer?: string,
        lang?: string,
        chatVisibility?: number,
        chatColors?: boolean,
        chatLinks?: boolean,
        chatLinksPrompt?: boolean,
        chatOpacity?: number,
        snooperEnabled?: boolean,

        hideServerAddress?: boolean,
        advancedItemTooltips?: boolean,
        pauseOnLostFocus?: boolean,
        touchscreen?: boolean,
        overrideWidth?: number,
        overrideHeight?: number,
        heldItemTooltips?: boolean,
        chatHeightFocused?: number,
        chatHeightUnfocused?: number,
        chatScale?: number,
        chatWidth?: number,
        forceUnicodeFont?: boolean,
        reducedDebugInfo?: boolean,
        useNativeTransport?: boolean,
        entityShadows?: boolean,
        mainHand?: 'left' | 'right',
        attackIndicator?: number,
        showSubtitles?: boolean,
        realmsNotifications?: boolean,
        enableWeakAttacks?: boolean,
        autoJump?: boolean,
        narrator?: number,
        tutorialStep?: 'movement',
        'key_key.attack'?: number,
        'key_key.use'?: number,
        'key_key.forward'?: number,
        'key_key.left'?: number,
        'key_key.back'?: number,
        'key_key.right'?: number,
        'key_key.jump'?: number,
        'key_key.sneak'?: number,
        'key_key.sprint'?: number,
        'key_key.drop'?: number,
        'key_key.inventory'?: number,
        'key_key.chat'?: number,
        'key_key.playerlist'?: number,
        'key_key.pickItem'?: number,
        'key_key.command'?: number,
        'key_key.screenshot'?: number,
        'key_key.togglePerspective'?: number,
        'key_key.smoothCamera'?: number,
        'key_key.fullscreen'?: number,
        'key_key.spectatorOutlines'?: number,
        'key_key.swapHands'?: number,
        'key_key.saveToolbarActivator'?: number,
        'key_key.loadToolbarActivator'?: number,
        'key_key.advancements'?: number,
        'key_key.hotbar.1'?: number,
        'key_key.hotbar.2'?: number,
        'key_key.hotbar.3'?: number,
        'key_key.hotbar.4'?: number,
        'key_key.hotbar.5'?: number,
        'key_key.hotbar.6'?: number,
        'key_key.hotbar.7'?: number,
        'key_key.hotbar.8'?: number,
        'key_key.hotbar.9'?: number,
        soundCategory_master?: number,
        soundCategory_music?: number,
        soundCategory_record?: number,
        soundCategory_weather?: number,
        soundCategory_block?: number,
        soundCategory_hostile?: number,
        soundCategory_neutral?: number,
        soundCategory_player?: number,
        soundCategory_ambient?: number,
        soundCategory_voice?: number,
        modelPart_cape?: boolean,
        modelPart_jacket?: boolean,
        modelPart_left_sleeve?: boolean,
        modelPart_right_sleeve?: boolean,
        modelPart_left_pants_leg?: boolean,
        modelPart_right_pants_leg?: boolean,
        modelPart_hat?: boolean,
    }


    export type ModelPart =
        'cape' |
        'jacket' |
        'left_sleeve' |
        'right_sleeve' |
        'left_pants_leg' |
        'right_pants_leg' |
        'hat'

    export type SoundCategories =
        'master' |
        'music' |
        'record' |
        'weather' |
        'block' |
        'hostile' |
        'neutral' |
        'player' |
        'ambient' |
        'voice'

    export type HotKeys = 'attack' |
        'use' |
        'forward' |
        'left' |
        'back' |
        'right' |
        'jump' |
        'sneak' |
        'sprint' |
        'drop' |
        'inventory' |
        'chat' |
        'playerlist' |
        'pickItem' |
        'command' |
        'screenshot' |
        'togglePerspective' |
        'smoothCamera' |
        'fullscreen' |
        'spectatorOutlines' |
        'swapHands' |
        'saveToolbarActivator' |
        'loadToolbarActivator' |
        'advancements' |
        'hotbar.1' |
        'hotbar.2' |
        'hotbar.3' |
        'hotbar.4' |
        'hotbar.5' |
        'hotbar.6' |
        'hotbar.7' |
        'hotbar.8' |
        'hotbar.9'

    export enum AmbientOcclusion {
        Off = 0,
        Minimum = 1,
        Maximum = 2
    };
    export enum Particles {
        Minimum = 2,
        Decreased = 1,
        All = 0
    };

    export function parseFrame(str: string, strict?: boolean): GameSetting.Frame | undefined {
        const lines = str.split('\n');
        const intPattern = /^\d+$/;
        const floatPattern = /^[-+]?[0-9]*\.[0-9]+$/;
        const booleanPattern = /(true)|(false)/;
        if (!lines) return undefined;
        const setting = lines.map(line => line.trim().split(':'))
            .filter(pair => pair[0].length != 0)
            .map(pair => {
                let value: any = pair[1];
                if (intPattern.test(value))
                    value = Number.parseInt(value);
                else if (floatPattern.test(value))
                    value = Number.parseFloat(value);
                else if (value === 'true') value = true;
                else if (value === 'false') value = false;
                else try {
                    value = JSON.parse(value);
                } catch (e) { }

                return { [pair[0]]: value };
            })
            .reduce((prev, current) => Object.assign(prev, current));
        if (!strict) return setting as GameSetting.Frame;
        const source: any = defaultFrame;
        const target: any = {};
        Object.keys(defaultFrame).forEach(key => {
            target[key] = typeof setting[key] === typeof source[key] ? setting[key] : source[key];
            delete setting.key;
        });
        return target as GameSetting.Frame;
    }

    /**
     * Parse the game settings from string representation. The input game setting string should comes from .minecraft/options.txt 
     *  
     * @param str 
     */
    export function parse(str: string): GameSetting {
        return new GameSetting(parseFrame(str));
    }

    /**
     * Generate text format game setting for options.txt file.
     * 
     * @param setting The game setting object
     * @param original 
     */
    export function stringify(setting: GameSetting | GameSetting.Frame | any, original?: string): string {
        let model: any;
        if (original) {
            model = parse(original) as any;
            for (const key in model) {
                if (model.hasOwnProperty(key) && setting.hasOwnProperty(key)) {
                    model[key] = setting[key]
                }
            }
        } else model = setting;
        return Object.keys(model)
            .filter(key => key !== undefined && key !== 'undefined')
            .map(key => {
                const val = model[key];
                if (typeof val !== 'string')
                    return `${key}:${JSON.stringify(val)}`
                else return `${key}:${val}`
            }).join(os.EOL)
    }
}

export default GameSetting;
