
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
    export async function parse(data: string | Buffer, type?: string) {
        if (!type)
            for (const type in registry) {
                try {
                    const result = await registry[type](data);
                    if (result instanceof Array)
                        if (result.length !== 0)
                            return result;
                        else throw new Error()
                    if (result) return result;
                    throw new Error()
                }
                catch (e) { }
            }
        else return registry[type](data)
        throw new Error('Cannot parse.')
    }
}
export default Mod;
