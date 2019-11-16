import assert from "assert";
import Long from "long";
import { NBT } from "./index";

describe("NBT", () => {
    function matchBuffer(a: Uint8Array, b: Uint8Array) {
        if (a.length !== b.length) { return false; }
        return a.every((v, i) => v === b[i]);
    }
    const src = {
        name: "ci010",
        type: "author",
        byte: 10,
        short: 10,
        int: 10,
        longArray: [new Long(1, 2)],
        byteArray: [1, 1],
        long: new Long(132),
        float: 0.25,
        double: 0.00001,
        intArray: [12, 3, 4, 512],
        nested: {
            name: "indexyz", type: "author", value: "ilauncher",
        },
    };
    const schema = {
        name: NBT.TagType.String,
        type: NBT.TagType.String,
        short: NBT.TagType.Short,
        int: NBT.TagType.Int,
        value: NBT.TagType.String,
        byte: NBT.TagType.Byte,
        longArray: NBT.TagType.LongArray,
        byteArray: NBT.TagType.ByteArray,
        intArray: NBT.TagType.IntArray,
        long: NBT.TagType.Long,
        float: NBT.TagType.Float,
        double: NBT.TagType.Double,
        nested: "test",
    };
    function serializerFixture() {
        return NBT.createSerializer().register("test", schema);
    }
    describe("#register", () => {
        test("should register the type", () => {
            const type = "test";
            const serializer = NBT.createSerializer().register(type, schema);
            expect(serializer.getType(schema)).toEqual(type);
            expect(serializer.getSchema(type)).toEqual(schema);
        });
        test("should throw error if the input is invalid", () => {
            expect(() => NBT.createSerializer().register("type", undefined!))
                .toThrow();
        });
    })

    describe("#serialize/deserialize", () => {
        function testNBT(compress: "gzip" | "deflate" | undefined | true) {
            test("sync", () => {
                const serializer = serializerFixture();
                const buffer = serializer.serializeSync(src, "test", { compressed: compress });
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
            const serializer = NBT.createSerializer().register("test", inputType);
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
            const serializer = NBT.createSerializer().register("test", inputType);

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
            const serializer = NBT.createSerializer();
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
