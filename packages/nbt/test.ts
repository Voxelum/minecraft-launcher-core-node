import assert from "assert";
import Long from "long";
import * as NBT from "./index";
import { TagType, TagTypeAlias } from "./nbt";

class TestType {
    @TagType(TagType.String)
    name = "ci010";
    @TagType(TagType.String)
    type = "author";
    @TagType(TagType.Byte)
    byte = 10;
    @TagType(TagType.Short)
    short = 10;
    @TagType(TagType.Int)
    int = 10;
    @TagType(TagType.LongArray)
    longArray = [new Long(1, 2)];
    @TagType(TagType.ByteArray)
    byteArray = [1, 1];
    @TagType(TagType.Long)
    long = new Long(132);
    @TagType(TagType.Float)
    float = 0.25;
    @TagType(TagType.Double)
    double = 0.00001;
    @TagType(TagType.IntArray)
    intArray = [12, 3, 4, 512];
    @TagType(TagType.Compound)
    nested = {
        name: "indexyz", type: "author", value: "ilauncher",
    };
}

describe("NBT", () => {
    function matchBuffer(a: Uint8Array, b: Uint8Array) {
        if (a.length !== b.length) { return false; }
        return a.every((v, i) => v === b[i]);
    }
    const src = new TestType();
    function serializerFixture() {
        return new NBT.Serializer().register(TestType);
    }

    // describe("#register", () => {
    //     test("should register the type", () => {
    //         const type = "test";
    //         const serializer = new NBT.Serializer().register(type, schema);
    //         expect(serializer.getType(schema)).toEqual(type);
    //         expect(serializer.getSchema(type)).toEqual(schema);
    //     });
    //     test("should throw error if the input is invalid", () => {
    //         expect(() => new NBT.Serializer().register("type", undefined!))
    //             .toThrow();
    //     });
    // })

    describe("#serialize/deserialize", () => {
        function testNBT(compress: "gzip" | "deflate" | undefined | true) {
            test("sync", () => {
                const serializer = serializerFixture();
                const buffer = serializer.serializeSync(src, { compressed: compress });
                expect(buffer).toBeTruthy();
                const { value, type } = serializer.deserializeSync(buffer, { compressed: compress });
                // expect(type).toStrictEqual(schema);
                // expect(type).toEqual("test");
                expect(value).toStrictEqual(src);
            });
            test("async", async () => {
                const serializer = serializerFixture();
                const buffer = await serializer.serialize(src, "test", { compressed: compress });
                expect(buffer).toBeTruthy();
                const { value, type } = await serializer.deserialize(buffer, { compressed: compress });
                // expect(type).toStrictEqual(schema);
                expect(value).toStrictEqual(src);
            });
        }
        describe("non-compressed", () => {
            testNBT(undefined);
        });
        describe("deflate", () => {
            testNBT("deflate");
        });
        describe("gzip", () => {
            testNBT("gzip");
        });
        describe("default", () => {
            testNBT(true);
        });

        test("should throw if the type is not found", async () => {
            const serializer = serializerFixture();
            expect(() => serializer.serializeSync({}, "noop")).toThrowError(new Error("Unknown type [noop]"))
            await expect(serializer.serialize({}, "noop"))
                .rejects
                .toEqual(new Error("Unknown type [noop]"))
        });

        test("should not serialize the error input", async () => {
            const input = { name: "ci010" };
            const inputType = { name: NBT.TagType.Byte };
            const serializer = new NBT.Serializer().register("test", inputType);
            assert.deepEqual((serializer as any).registry.test, inputType);
            try {
                await serializer.serialize(input, "test");
            } catch (e) {
                expect(e.type).toEqual("IllegalInputType");
                expect(e.message).toEqual("Require Byte but found string");
            }
            try {
                await NBT.serialize({
                    ...input,
                    __nbtPrototype__: inputType,
                });
            } catch (e) {
                expect(e.type).toEqual("IllegalInputType");
                expect(e.message).toEqual("Require Byte but found string");
            }
        });
        test("should ignore the additional field in serialization", async () => {
            const unmatchedInput = { name: "ci010", age: 0 };
            const inputType = { name: NBT.TagType.String };
            const serializer = new NBT.Serializer().register("test", inputType);

            const matchedInput = { name: "ci010" };

            const matched = await serializer.serialize(matchedInput, "test");
            const matchedDirect = await NBT.serialize({
                ...matchedInput,
                __nbtPrototype__: inputType,
            });

            const unmatched = await serializer.serialize(unmatchedInput, "test");
            const unmatchedDirect = await NBT.serialize({
                ...unmatchedInput,
                __nbtPrototype__: inputType,
            });

            expect(matchBuffer(matched, matchedDirect)).toBeTruthy();
            expect(matchBuffer(matched, unmatched)).toBeTruthy();
            expect(matchBuffer(matched, unmatchedDirect)).toBeTruthy();

            const reversed = await serializer.deserialize(unmatched);
            const reversedDirect = await NBT.deserialize(unmatched);

            assert.deepEqual(matchedInput, reversed.value, "reversed");
            assert.deepEqual(matchedInput, reversedDirect, "reversed direct");
        });
    });
    describe("#serialize/deserialize Direct", () => {
        const customSchema: any = { ...schema };
        delete customSchema.nested;
        customSchema.nested = customSchema;
        const typedObject = Object.assign({}, src, { __nbtPrototype__: customSchema });
        function testNBT(compress: "gzip" | "deflate" | undefined | true) {
            test("sync", () => {
                const buffer = NBT.serializeSync(typedObject, { compressed: compress });
                expect(buffer).toBeTruthy();
                const value = NBT.deserializeSync(buffer, { compressed: compress });
                expect(value).toStrictEqual(src);
            });
            test("async", async () => {
                const buffer = await NBT.serialize(typedObject, { compressed: compress });
                expect(buffer).toBeTruthy();
                const value = await NBT.deserialize(buffer, { compressed: compress });
                expect(value).toStrictEqual(src);
            });
        }

        describe("non-compressed", () => {
            testNBT(undefined);
        });
        describe("deflate", () => {
            testNBT("deflate");
        })
        describe("gzip", () => {
            testNBT("gzip");
        });
        describe("default", () => {
            testNBT(true);
        })
        test("should be able to deserialize buffer", async () => {
            const serializer = serializerFixture();
            const buf = await serializer.serialize(src, "test");
            const deserializedDirect = await NBT.deserialize(buf);
            expect(deserializedDirect).toBeTruthy();
        });
        test("should produce the same results across two type of deserializations", async () => {
            const serializer = serializerFixture();
            const buf = await serializer.serialize(src, "test");
            const deserializedDirect = await NBT.deserialize(buf);
            const { value } = await serializer.deserialize(buf);
            expect(deserializedDirect).toEqual(value);
        });
    });

    // describe("TagByteArray", () => {
    //     const object = {
    //         value: new Uint8Array([1, 2, 3]),
    //     };
    //     Object.defineProperty(object, "__nbtPrototype__", {
    //         value: { value: NBT.TagType.ByteArray },
    //     });
    //     test("read", () => {
    //         NBT.serializeSync({} as any);
    //     });
    // });
    describe("NBTTagListIO", () => {
        describe("Primative type", () => {
            let buffer: Uint8Array;
            const object = {
                value: [1, 2, 3],
            };
            Object.defineProperty(object, "__nbtPrototype__", {
                value: { value: [NBT.TagType.Int] },
            });
            test("save", async () => {
                buffer = await NBT.serialize(object as any);
                expect(buffer).toBeTruthy();
                expect(buffer).toBeInstanceOf(Buffer);
            });
            test("load", async () => {
                const result = await NBT.deserialize(buffer);
                expect(result).toStrictEqual(object);
            });
        });
        describe("Object type", () => {
            let buffer: Uint8Array;
            const object = {
                value: [{ x: 1 }, { x: 2 }, { x: 3 }],
            };
            Object.defineProperty(object, "__nbtPrototype__", {
                value: { value: [{ x: NBT.TagType.Int }] },
            });
            test("save", async () => {
                buffer = await NBT.serialize(object as any);
                expect(buffer).toBeTruthy();
                expect(buffer).toBeInstanceOf(Buffer);
            });
            test("load", async () => {
                const result = await NBT.deserialize(buffer);
                expect(result).toStrictEqual(object);
            });
        });
        describe("Custom type", () => {
            let buffer: Uint8Array;
            const object = {
                value: [{ x: 1 }, { x: 2 }, { x: 3 }],
            };
            const serializer = new NBT.Serializer();
            serializer.register("custom", { x: NBT.TagType.Int });
            serializer.register("type", { value: ["custom"] });
            test("save", async () => {
                buffer = await serializer.serialize(object, "type");
                expect(buffer).toBeTruthy();
                expect(buffer).toBeInstanceOf(Buffer);
            });
            test("load", async () => {
                const result = await serializer.deserialize(buffer);
                expect(result.value).toStrictEqual(object);
            });
        });
        describe("Unknown type", () => {
            const object = {
                value: [{ x: 1 }, { x: 2 }, { x: 3 }],
            };
            Object.defineProperty(object, "__nbtPrototype__", {
                value: { value: null },
            });
            test("save", async () => {
                await expect(NBT.serialize(object as any))
                    .rejects
                    .toEqual({
                        message: "Require Compound but found object",
                        type: "IllegalInputType",
                    });
            });
            // test("load", async () => {
            //     const result = await NBT.Persistence.deserialize(buffer, false);
            //     expect(result).not.toStrictEqual(object);
            // });
        });
    });
});
