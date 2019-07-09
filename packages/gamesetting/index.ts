import { GameSetting } from "@xmcl/common";

declare module "@xmcl/common/gamesetting" {
    namespace GameSetting {
        export function parse(str: string, strict?: boolean): GameSetting.Frame | undefined;
        export function stringify(setting: GameSetting | GameSetting.Frame | any, original?: string, eol?: string): string;
    }
}

GameSetting.parse = parse;
GameSetting.stringify = stringify;

/**
 * Parse raw game setting options.txt content
 *
 * @param str the options.txt content
 * @param strict strictly follow the current version of options format (outdate version might cause problem. If your options.txt is new one with new fields, don't turn on this)
 */
function parse(str: string, strict?: boolean): GameSetting.Frame | undefined {
    const lines = str.split("\n");
    const intPattern = /^\d+$/;
    const floatPattern = /^[-+]?[0-9]*\.[0-9]+$/;
    const booleanPattern = /(true)|(false)/;
    if (!lines || lines.length === 0) { return undefined; }
    const setting = lines.map((line) => line.trim().split(":"))
        .filter((pair) => pair[0].length !== 0)
        .map((pair) => {
            let value: any = pair[1];
            if (intPattern.test(value)) {
                value = Number.parseInt(value, 10);
            } else if (floatPattern.test(value)) {
                value = Number.parseFloat(value);
            } else if (value === "true") { value = true; } else if (value === "false") { value = false; } else {
                try {
                    value = JSON.parse(value);
                } catch (e) { }
            }

            return { [pair[0]]: value };
        })
        .reduce((prev, current) => Object.assign(prev, current), {});
    if (!strict) { return setting as GameSetting.Frame; }
    const source: any = GameSetting.getDefaultFrame();
    const target: any = {};
    Object.keys(source).forEach((key) => {
        target[key] = typeof setting[key] === typeof source[key] ? setting[key] : source[key];
        delete setting.key;
    });
    return target as GameSetting.Frame;
}

/**
 * Generate text format game setting for options.txt file.
 *
 * @param setting The game setting object
 * @param original
 * @param eol The end of line character, default is `\n`
 */
function stringify(setting: GameSetting | GameSetting.Frame | any, original?: string, eol: string = "\n"): string {
    let model: any;
    if (original) {
        model = parse(original) as any;
        for (const key in model) {
            if (model.hasOwnProperty(key) && setting.hasOwnProperty(key)) {
                model[key] = setting[key];
            }
        }
    } else { model = setting; }
    return Object.keys(model)
        .filter((key) => key !== undefined && key !== "undefined")
        .map((key) => {
            const val = model[key];
            return typeof val !== "string" ? `${key}:${JSON.stringify(val)}` : `${key}:${val}`;
        }).join(eol);
}

export * from "@xmcl/common/gamesetting";
