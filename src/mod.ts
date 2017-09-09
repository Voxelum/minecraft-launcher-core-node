
import Forge from "./forge";
import * as Zip from 'jszip'
import * as fs from 'fs-extra'

export class Mod<Meta> {
    constructor(readonly type: string, readonly id: string, readonly meta: Meta) { }
}

export namespace Mod {
    export type Parser = (data: string | Buffer) => Promise<any>;
    const registry: { [type: string]: Parser } = {};
    export function register(type: string, parser: Parser) {
        if (registry[type]) throw new Error(`duplicated type [${type}].`)
        registry[type] = parser;
    }
    export function parse(data: string | Buffer, type?: string) {
        if (!type)
            for (const type in registry) {
                try { return registry[type](data) }
                catch (e) { }
            }
        else return registry[type](data)
    }
}
export default Mod;
