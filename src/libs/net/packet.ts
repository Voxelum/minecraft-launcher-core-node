import { State } from "./client";
import { Coder } from "./coders";

const registry: PacketRegistryEntry[] = [];
interface FieldRecord { name: string; type: Coder<any>; }

export type Side = "server" | "client";

export interface PacketRegistryEntry {
    readonly id: number;
    readonly name: string;
    readonly state: State;
    readonly side: Side;
    readonly coder: Coder<any>;
}

export type FieldType<T> = (type: Coder<T>) => (target: any, key: string) => void;
// tslint:disable-next-line: ban-types
export type PacketType = (side: Side, id: number, state: State) => (constructor: Function) => void;

export function Field<T>(type: Coder<T>) {
    return (target: any, key: string) => {
        const prototype = target.constructor;
        if (!prototype.fields) {
            prototype.fields = [];
        }
        prototype.fields.push({ name: key, type });
    };
}

// https://stackoverflow.com/questions/1606797/use-of-apply-with-new-operator-is-this-possible
function newCall(Cls: any) {
    // tslint:disable-next-line: new-parens
    return new (Function.prototype.bind.apply(Cls, arguments as any));
}

export function Packet(side: Side, id: number, state: State) {
    // tslint:disable-next-line: ban-types
    return (constructor: Function) => {
        const fields: FieldRecord[] = (constructor as any).fields || [];
        registry.push({
            id,
            name: constructor.name,
            side,
            state,
            coder: {
                encode(buffer, value) {
                    fields.forEach((cod) => {
                        cod.type.encode(buffer, value[cod.name]);
                    });
                },
                decode(buffer) {
                    const value = newCall(constructor);
                    fields.forEach((cod) => {
                        try {
                            value[cod.name] = cod.type.decode(buffer);
                        } catch (e) {
                            console.error(new Error(`Exception during reciving packet [${id}]${constructor.name}`));
                            console.error(e);
                        }
                    });
                    return value;
                },
            },
        });
    };
}

export function clear() {
    registry.splice(0, registry.length);
}

export function flush() {
    return Array.from(registry);
}


export type Protocol = () => PacketRegistryEntry[];

export class ProtocolManager {
    private mapping: { [key: number]: Protocol } = {};

    register(protocolId: number, protocol: Protocol) {
        this.mapping[protocolId] = protocol;
    }
}
