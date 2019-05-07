import { Coder } from "./coders";

const registry: RegistryEntry[] = [];
interface FieldRecord { name: string; type: Coder<any>; }

export type Side = "server" | "client";

export interface RegistryEntry {
    readonly id: number;
    readonly name: string;
    readonly side: Side;
    readonly coder: Coder<any>;
}

export function Field<T>(type: Coder<T>) {
    return (target: any, key: string) => {
        if (!Reflect.hasMetadata("packet:fields", target)) {
            Reflect.defineMetadata("packet:fields", [], target);
        }
        Reflect.getMetadata("packet:fields", target).push({ name: key, type });
    };
}

export function Packet(side: Side, id: number, namespace: string) {
    // tslint:disable-next-line: ban-types
    return (constructor: Function) => {
        const fields: FieldRecord[] = Reflect.getMetadata("packet:fields", constructor.prototype) || [];
        registry.push({
            id,
            name: constructor.name,
            side,
            coder: {
                encode(buffer, value) {
                    fields.forEach((cod) => {
                        cod.type.encode(buffer, value[cod.name]);
                    });
                },
                decode(buffer) {
                    const value = constructor();
                    fields.forEach((cod) => {
                        try {
                            value[cod.name] = cod.type.decode(buffer);
                        } catch (e) {
                            console.error(new Error(`Exception during reciving packet [${id}]${constructor.name}`));
                            console.error(e);
                        }
                    });
                },
            },
        });
    };
}

export function allEntries() {
    return Array.from(registry);
}

export abstract class PacketBase {
}
