import ResourcePack from './resourcepacks';
import * as os from 'os';

export interface GameSetting {
    useVBO: boolean,
    fboEnable: boolean,
    enableVsync: boolean,
    fancyGraphics: boolean,
    renderClouds: boolean | 'fast',
    forceUnicodeFont: boolean,
    autoJump: boolean,
    entityShadows: boolean,
    ao: GameSetting.AmbientOcclusion.Off |
    GameSetting.AmbientOcclusion.Minimum |
    GameSetting.AmbientOcclusion.Maximum,
    fov: number,
    mipmapLevels: 0 | 1 | 2 | 3 | 4,
    maxFps: number,
    particles: GameSetting.Particles.All |
    GameSetting.Particles.Decreased |
    GameSetting.Particles.Minimum,
    renderDistance: number,
    resourcePacks: ResourcePack[]
}

export namespace GameSetting {
    export namespace AmbientOcclusion {
        export type Off = 0
        export type Minimum = 1
        export type Maximum = 2
    }
    export namespace Particles {
        export type Minimum = 2
        export type Decreased = 1
        export type All = 0
    }
    export function parse(str: string): GameSetting | undefined {
        let lines = str.split('\n')
        const intPattern = /^\d+$/
        const floatPattern = /[-+]?[0-9]*\.[0-9]+/
        const booleanPattern = /(true)|(false)/
        if (lines) {
            let setting = lines.map(line => line.trim().split(':'))
                .filter(pair => pair[0].length != 0)
                .map(pair => {
                    let value: any = pair[1]
                    if (intPattern.test(value))
                        value = Number.parseInt(value)
                    else if (floatPattern.test(value))
                        value = Number.parseFloat(value)
                    else if (value === 'true') value = true
                    else if (value === 'false') value = false
                    else try {
                        value = JSON.parse(value)
                    } catch (e) { }

                    return { [pair[0]]: value }
                })
                .reduce((prev, current) => Object.assign(prev, current))
            return setting as GameSetting
        }
        return undefined
    }
    export function stringify(setting: GameSetting | any, original?: string): string {
        let model: any;
        if (original) {
            model = parse(original) as any
            for (const key in model) {
                if (model.hasOwnProperty(key) && setting.hasOwnProperty(key)) {
                    model[key] = setting[key]
                }
            }
        } else model = setting
        return Object.keys(model).map(key => {
            const val = model[key];
            if (typeof val !== 'string')
                return `${key}:${JSON.stringify(val)}`
            else return `${key}:${val}`
        }).join(os.EOL)
    }
}

export default GameSetting;
