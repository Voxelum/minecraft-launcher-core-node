import * as assert from "assert";
import * as Long from "long";
import { NBT } from "./index";

describe("NBT", () => {
    let ser: NBT.Persistence.Serializer;
    let buf: Buffer;
    const src = {
        name: "ci010", type: "author", byte: 10, short: 10, int: 10, nested: {
            name: "indexyz", type: "author", value: "ilauncher",
        },
    };
    let deserializedDirect: any;
    let deserialized: any;
    it("should be able to register serializer", () => {
        ser = NBT.Persistence.createSerializer().register("test", {
            name: NBT.TagType.String,
            type: NBT.TagType.String,
            short: NBT.TagType.Short,
            int: NBT.TagType.Int,
            value: NBT.TagType.String,
            byte: NBT.TagType.Byte,
            nested: "test",
        });
    });
    it("should be able to serialize object", async () => {
        buf = await ser.serialize(src, "test");
        assert(buf);
    });
    it("should be able to deserialize buffer", async () => {
        deserialized = await ser.deserialize(buf).value;
        assert(deserialized);
    });
    it("should be able to deserialize buffer directly", async () => {
        deserializedDirect = await NBT.Persistence.deserialize(buf);
        assert(deserializedDirect);
    });
    it("should produce the same results across two type of deserializations", () => {
        assert.deepEqual(deserializedDirect, deserialized);
    });
    it("should produce the same result as the input", () => {
        assert.deepEqual(src, deserialized);
    });
    it("should not serialize the error input", async () => {
        const input = { name: "ci010" };
        const inputType = { name: NBT.TagType.Byte };
        const serializer = NBT.Persistence.createSerializer().register("test", inputType);
        assert.deepEqual((serializer as any).registry.test, inputType);
        try {
            await serializer.serialize(input, "test", false);
        } catch (e) {
            assert.equal(e.type, "IllegalInputType");
            assert.equal(e.message, "Require Byte but found string");
        }
        try {
            await NBT.Persistence.serialize({
                ...input,
                __nbtPrototype__: inputType,
            });
        } catch (e) {
            assert.equal(e.type, "IllegalInputType");
            assert.equal(e.message, "Require Byte but found string");
        }
    });
    it("should ignore the additional field in serialization", async () => {
        const unmatchedInput = { name: "ci010", age: 0 };
        const inputType = { name: NBT.TagType.String };
        const serializer = NBT.Persistence.createSerializer().register("test", inputType);

        const matchedInput = { name: "ci010" };

        const matched = await serializer.serialize(matchedInput, "test", false);
        const matchedDirect = await NBT.Persistence.serialize({
            ...matchedInput,
            __nbtPrototype__: inputType,
        }, false);

        const unmatched = await serializer.serialize(unmatchedInput, "test", false);
        const unmatchedDirect = await NBT.Persistence.serialize({
            ...unmatchedInput,
            __nbtPrototype__: inputType,
        });

        assert.equal(0, matched.compare(matchedDirect), "matched direct");
        assert.equal(0, matched.compare(unmatched), "umatched");
        assert.equal(0, matched.compare(unmatchedDirect), "unmatched direct");

        const reversed = await serializer.deserialize(unmatched);
        const reversedDirect = await NBT.Persistence.deserialize(unmatched);

        assert.deepEqual(matchedInput, reversed.value, "reversed");
        assert.deepEqual(matchedInput, reversedDirect, "reversed direct");
    });


    // describe("Test", () => {
    //     it("just test", () => {
    //         const list: NBT.TagList<NBT.TagByte> = NBT.TagList.newByteList();
    //         list[0] = NBT.TagScalar.newByte(0);
    //         list[1] = NBT.TagScalar.newByte(1);
    //         const compound: NBT.TagCompound = NBT.TagCompound.newCompound();
    //         compound.set("foo", NBT.TagScalar.newString("bar"));
    //         compound.set("abc", NBT.TagScalar.newInt(12450));
    //         compound.accessor["123"] = NBT.TagScalar.newString("456");
    //     });
    // });
    // describe("TestEmpty", () => {
    //     it("empty nbt reading and writing", () => {
    //         const nbtData: Buffer = Buffer.from
    //             ([0x0A, 0x00, 0x00,                                                     // '': Compound
    //                 0x00]);                                                             //    '': End
    //         const rootTag: NBT.TagCompound = NBT.Persistence.readRoot(nbtData);
    //         const testTag: NBT.TagCompound = NBT.TagCompound.newCompound();
    //         assert.deepEqual(rootTag, testTag);
    //         assert.deepEqual(NBT.Persistence.writeRoot(rootTag), nbtData);
    //     });
    // });
    // describe("TestSignleValue", () => {
    //     it("single nbt reading and writing", () => {
    //         const nbtData: Buffer = Buffer.from
    //             ([0x0A, 0x00, 0x00,                                                     // '': Compound
    //                 0x03, 0x00, 0x03, 0x62, 0x61, 0x72, 0x00, 0x00, 0x00, 0x01,         //    'bar': Int = 1
    //                 0x00]);                                                             //    '': End
    //         const rootTag: NBT.TagCompound = NBT.Persistence.readRoot(nbtData);
    //         const testTag: NBT.TagCompound = NBT.TagCompound.newCompound();
    //         testTag.set("bar", NBT.TagScalar.newInt(1));
    //         assert.deepEqual(rootTag, testTag);
    //         assert.deepEqual(NBT.Persistence.writeRoot(rootTag), nbtData);
    //     });
    // });
    // describe("TestAllTags", () => {
    //     it("all tags reading and writing", () => {
    //         const nbtData: Buffer = Buffer.from
    //             ([0x0A, 0x00, 0x00,                                                     // '': Compound
    //                 0x01, 0x00, 0x04, 0x62, 0x61, 0x72, 0x31, 0x01,                     //    'bar1': Byte = 1
    //                 0x02, 0x00, 0x04, 0x62, 0x61, 0x72, 0x32, 0x00, 0x01,               //    'bar2': Short = 1
    //                 0x03, 0x00, 0x04, 0x62, 0x61, 0x72, 0x33, 0x00, 0x00, 0x00, 0x01,   //    'bar3': Int = 1
    //                 0x04, 0x00, 0x04, 0x62, 0x61, 0x72, 0x34, 0x00, 0x00, 0x00, 0x00,   //    'bar4': Long = 1
    //                 0x00, 0x00, 0x00, 0x01,                                       //
    //                 0x05, 0x00, 0x04, 0x62, 0x61, 0x72, 0x35, 0x3F, 0x80, 0x00, 0x00,   //    'bar5': Float = 1
    //                 0x06, 0x00, 0x04, 0x62, 0x61, 0x72, 0x36, 0x3F, 0xF0, 0x00, 0x00,   //    'bar6': Double = 1
    //                 0x00, 0x00, 0x00, 0x00,                                       //
    //                 0x07, 0x00, 0x04, 0x62, 0x61, 0x72, 0x37, 0x00, 0x00, 0x00, 0x02,   //    'bar7': ByteArray = [ 0x01, 0x02 ]
    //                 0x01, 0x02,                                                   //
    //                 0x08, 0x00, 0x04, 0x62, 0x61, 0x72, 0x38, 0x00, 0x03, 0x66, 0x6F,   //    'bar8': String = 'foo'
    //                 0x6F,                                                         //
    //                 0x09, 0x00, 0x04, 0x62, 0x61, 0x72, 0x39, 0x08, 0x00, 0x00, 0x00,   //    'bar9': List<String>[2]
    //                 0x02,                                                         //
    //                 0x00, 0x03, 0x66, 0x6F, 0x6F,                                 //        0: String = 'foo'
    //                 0x00, 0x03, 0x62, 0x61, 0x72,                                 //        1: String = 'bar'
    //                 0x0A, 0x00, 0x04, 0x62, 0x61, 0x72, 0x41,                           //    'barA': Compound
    //                 0x01, 0x00, 0x04, 0x62, 0x61, 0x72, 0x31, 0x01,               //        'bar1': Byte = 1
    //                 0x02, 0x00, 0x04, 0x62, 0x61, 0x72, 0x32, 0x00, 0x01,         //        'bar2': Short = 1
    //                 0x00,                                                         //        '': End
    //                 0x0B, 0x00, 0x04, 0x62, 0x61, 0x72, 0x42, 0x00, 0x00, 0x00, 0x02,   //    'barB': IntArray = [ 0x00000001, 0x00000002 ]
    //                 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x02,               //
    //                 0x0C, 0x00, 0x04, 0x62, 0x61, 0x72, 0x43, 0x00, 0x00, 0x00, 0x02,   //    'barC': LongArray = [ 0x0000000000000001, 0x0000000000000002 ]
    //                 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00,   //
    //                 0x00, 0x00, 0x00, 0x00, 0x00, 0x02,                           //
    //                 0x00]);                                                             //    '': End
    //         const rootTag: NBT.TagCompound = NBT.Persistence.readRoot(nbtData);
    //         const testTag: NBT.TagCompound = NBT.TagCompound.newCompound();
    //         testTag.set("bar1", NBT.TagScalar.newByte(1));
    //         testTag.set("bar2", NBT.TagScalar.newShort(1));
    //         testTag.set("bar3", NBT.TagScalar.newInt(1));
    //         testTag.set("bar4", NBT.TagScalar.newLong(Long.fromInt(1)));
    //         testTag.set("bar5", NBT.TagScalar.newFloat(1));
    //         testTag.set("bar6", NBT.TagScalar.newDouble(1));
    //         testTag.set("bar7", NBT.TagScalar.newByteArray(Buffer.from([0x01, 0x02])));
    //         testTag.set("bar8", NBT.TagScalar.newString("foo"));
    //         const listTag: NBT.TagList<NBT.TagString> = NBT.TagList.newStringList();
    //         listTag.push(NBT.TagScalar.newString("foo"));
    //         listTag.push(NBT.TagScalar.newString("bar"));
    //         testTag.set("bar9", listTag);
    //         const compoundTag: NBT.TagCompound = NBT.TagCompound.newCompound();
    //         compoundTag.set("bar1", NBT.TagScalar.newByte(1));
    //         compoundTag.set("bar2", NBT.TagScalar.newShort(1));
    //         testTag.set("barA", compoundTag);
    //         testTag.set("barB", NBT.TagScalar.newIntArray(Buffer.from([0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x02])));
    //         testTag.set("barC", NBT.TagScalar.newLongArray(Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x02])));
    //         assert.deepEqual(rootTag, testTag);
    //         assert.deepEqual(NBT.Persistence.writeRoot(rootTag), nbtData);
    //     });
    // });
    // describe("TestIllegalTags", () => {
    //     it("illegal tag error throwing", () => {
    //         assert.throws(() => {
    //             const compoundTag: NBT.TagCompound = NBT.TagCompound.newCompound();
    //             compoundTag.set("bar", null as any);
    //         });
    //         assert.throws(() => {
    //             const compoundTag: NBT.TagCompound = NBT.TagCompound.newCompound();
    //             compoundTag.set("bar", undefined as any);
    //         });
    //         assert.throws(() => {
    //             const compoundTag: NBT.TagCompound = NBT.TagCompound.newCompound();
    //             compoundTag.set("bar", NBT.TagEnd.newEnd() as any);
    //         });
    //         assert.throws(() => {
    //             const listTag: NBT.TagList<NBT.TagString> = NBT.TagList.newStringList();
    //             listTag.push(null as any);
    //         });
    //         assert.throws(() => {
    //             const listTag: NBT.TagList<NBT.TagString> = NBT.TagList.newStringList();
    //             listTag.push(undefined as any);
    //         });
    //         assert.throws(() => {
    //             const listTag: NBT.TagList<NBT.TagString> = NBT.TagList.newStringList();
    //             listTag.push(NBT.TagEnd.newEnd() as any);
    //         });
    //         assert.throws(() => {
    //             const listTag: NBT.TagList<NBT.TagString> = NBT.TagList.newStringList();
    //             listTag[0] = null as any;
    //         });
    //         assert.throws(() => {
    //             const listTag: NBT.TagList<NBT.TagString> = NBT.TagList.newStringList();
    //             listTag[0] = undefined as any;
    //         });
    //         assert.throws(() => {
    //             const listTag: NBT.TagList<NBT.TagString> = NBT.TagList.newStringList();
    //             listTag[0] = NBT.TagEnd.newEnd() as any;
    //         });
    //     });
    // });
    // describe("TestNestedCompound", () => {
    //     it("nested compound reading and writing", () => {
    //         const nbtData: Buffer = Buffer.from
    //             ([0x0A, 0x00, 0x00,                                                     // '': Compound
    //                 0x0A, 0x00, 0x01, 0x41,                                             //    'A': Compound
    //                 0x0A, 0x00, 0x01, 0x42,                                         //        'B': Compound
    //                 0x00,                                                       //            '': End
    //                 0x00,                                                           //        '': End
    //                 0x0A, 0x00, 0x01, 0x43,                                             //    'C': Compound
    //                 0x0A, 0x00, 0x01, 0x44,                                         //        'D': Compound
    //                 0x00,                                                       //            '': End
    //                 0x00,                                                           //        '': End
    //                 0x00]);                                                             //    '': End
    //         const rootTag: NBT.TagCompound = NBT.Persistence.readRoot(nbtData);
    //         const testTag: NBT.TagCompound = NBT.TagCompound.newCompound();
    //         const ATag: NBT.TagCompound = NBT.TagCompound.newCompound();
    //         const BTag: NBT.TagCompound = NBT.TagCompound.newCompound();
    //         const CTag: NBT.TagCompound = NBT.TagCompound.newCompound();
    //         const DTag: NBT.TagCompound = NBT.TagCompound.newCompound();
    //         testTag.set("A", ATag);
    //         ATag.set("B", BTag);
    //         testTag.set("C", CTag);
    //         CTag.set("D", DTag);
    //         assert.deepEqual(rootTag, testTag);
    //         assert.deepEqual(NBT.Persistence.writeRoot(rootTag), nbtData);
    //     });
    // });
    // describe("TestNestedList", () => {
    //     it("nested list reading and writing", () => {
    //         const nbtData: Buffer = Buffer.from
    //             ([0x0A, 0x00, 0x00,                                                     // '': Compound
    //                 0x09, 0x00, 0x01, 0x41, 0x09, 0x00, 0x00, 0x00, 0x02,               //    'A': List<List>[2]
    //                 0x09, 0x00, 0x00, 0x00, 0x01,                                   //        0: List<List>[1]
    //                 0x09, 0x00, 0x00, 0x00, 0x00,                               //            0: List<List>[0]
    //                 0x09, 0x00, 0x00, 0x00, 0x01,                                   //        1: List<List>[1]
    //                 0x09, 0x00, 0x00, 0x00, 0x00,                               //            0: List<List>[0]
    //                 0x00]);                                                             //    '': End
    //         const rootTag: NBT.TagCompound = NBT.Persistence.readRoot(nbtData);
    //         const testTag: NBT.TagCompound = NBT.TagCompound.newCompound();
    //         const listATag: NBT.TagList<NBT.TagAnyList> = NBT.TagList.newListList();
    //         const list0Tag: NBT.TagList<NBT.TagAnyList> = NBT.TagList.newListList();
    //         const list00Tag: NBT.TagList<NBT.TagAnyList> = NBT.TagList.newListList();
    //         const list1Tag: NBT.TagList<NBT.TagAnyList> = NBT.TagList.newListList();
    //         const list10Tag: NBT.TagList<NBT.TagAnyList> = NBT.TagList.newListList();
    //         testTag.set("A", listATag);
    //         listATag[0] = list0Tag;
    //         list0Tag[0] = list00Tag;
    //         listATag[1] = list1Tag;
    //         list1Tag[0] = list10Tag;
    //         assert.deepEqual(rootTag, testTag);
    //         assert.deepEqual(NBT.Persistence.writeRoot(rootTag), nbtData);
    //     });
    // });
    // describe("TypedNBTDocs", () => {
    //     it("typed nbt documenting", () => {
    //         // First create NBT tag like this.
    //         const rootTag: NBT.TagCompound = NBT.TagCompound.newCompound();
    //         rootTag.set("TheEnd", NBT.TagScalar.newString("That's all"));
    //         rootTag.set("key1", NBT.TagScalar.newString("value1"));
    //         // Checks if key exists. Then cast it to string tag.
    //         const key1Tag: NBT.TagString = checkExists(rootTag.get("key1")).asTagString();
    //         function checkExists<T>(t: T | undefined): T {
    //             if (t === undefined) {
    //                 throw new Error("key not exists");
    //             }
    //             return t;
    //         }
    //         // console.log(key1Tag.value); // print value1
    //         // If list contains list. list those inside forget there element type.
    //         const listTag: NBT.TagList<NBT.TagAnyList> = NBT.TagList.newListList();
    //         rootTag.set("testList", listTag);
    //         const stringListTag: NBT.TagList<NBT.TagString> = NBT.TagList.newStringList();
    //         stringListTag.push(NBT.TagScalar.newString("hello"), NBT.TagScalar.newString("world"));
    //         const doubleListTag: NBT.TagList<NBT.TagDouble> = NBT.TagList.newDoubleList();
    //         // This gives you a way to add different list in.
    //         listTag.push(stringListTag, doubleListTag);
    //         // And still prevent you add other things in it.
    //         // listTag.push(NBT.TagCompound.newCompound()); // Illegal
    //         // You can cast list to whatever list you want after you got a list without element type.
    //         // console.log(listTag[0].asTagListString()[0].asTagString().value); // print hello
    //         // You can iterate values in list.
    //         // for (let stringTag of stringListTag) {
    //         //     console.log(stringTag.value); // print hello then print world
    //         // }
    //         // And also entries in compound.
    //         for (const [key, value] of rootTag) {
    //             // if (value.tagType === NBT.TagType.String)
    //             //     console.log('[' + key + ' = ' + value.asTagString().value + ']');
    //         }
    //         // Finally you can write root tags to buffer and read root tags from buffer.
    //         const buffer: Buffer = NBT.Persistence.writeRoot(rootTag, { compressed: true });
    //         const ourTag: NBT.TagCompound = NBT.Persistence.readRoot(buffer, { compressed: true });
    //         // console.log(checkExists(ourTag.get('TheEnd')).asTagString().value); // print That's all
    //     });
    // });
});
