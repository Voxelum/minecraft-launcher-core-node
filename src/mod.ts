
import Forge from "./forge";
import * as Zip from 'jszip'
import * as fs from 'fs-extra'

export class Mod<Meta> {
    constructor(readonly type: string, readonly id: string, readonly meta: Meta) { }
}

export namespace Mod {
    export type Parser = (option: ParseOption) => Promise<any>;
    export type ParseOption = {
        type?: string,
        data: string | Buffer,
    };
    const registry: { [type: string]: Parser } = {};
    export function register(type: string, parser: Parser) {
        if (registry[type]) throw new Error(`duplicated type [${type}].`)
        registry[type] = parser;
    }
    export function parse(option: ParseOption) {
        if (!option.type)
            for (const type in registry) {
                try { return registry[type](option) }
                catch (e) { }
            }
        else return registry[option.type](option)
    }
}
export default Mod;
