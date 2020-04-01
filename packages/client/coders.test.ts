import { VarInt, VarLong, Long, Short, Float, String, Bool, Byte, UByte, Int, ByteArray, Double, Json, Slot, UUID, UShort } from "./coders";
import ByteBuffer from "bytebuffer";
import long from "long";
import { v4 } from "uuid";

describe("Coders", () => {
    test("UByte", () => {
        let bb = ByteBuffer.allocate(1024);
        let input = 124;
        UByte.encode(bb, input);
        bb.flip();
        let output = UByte.decode(bb);
        expect(output).toEqual(input);
    });
    test("Json", () => {
        let bb = ByteBuffer.allocate(1024);
        let input = { key: 124, b: "x" };
        Json.encode(bb, input);
        bb.flip();
        let output = Json.decode(bb);
        expect(output).toEqual(input);
    });
    test("Slot", () => {
        let bb = ByteBuffer.allocate(1024);
        let input = { blockId: 1 };
        Slot.encode(bb, input);
        bb.flip();
        let output = Slot.decode(bb);
        expect(output).toEqual(input);
    });
    test("UUID", () => {
        let bb = ByteBuffer.allocate(1024);
        let input = v4();
        UUID.encode(bb, input);
        bb.flip();
        let output = UUID.decode(bb);
        expect(output).toEqual(input);
    });
    test("Int", () => {
        let bb = ByteBuffer.allocate(1024);
        let input = 1024;
        Int.encode(bb, input);
        bb.flip();
        let output = Int.decode(bb);
        expect(output).toEqual(input);
    });
    test("VarInt", () => {
        let bb = ByteBuffer.allocate(1024);
        let input = 1024;
        VarInt.encode(bb, input);
        bb.flip();
        let output = VarInt.decode(bb);
        expect(output).toEqual(input);
    });
    test("Short", () => {
        let bb = ByteBuffer.allocate(1024);
        let input = 1024;
        Short.encode(bb, input);
        bb.flip();
        let output = Short.decode(bb);
        expect(output).toEqual(input);
    });
    test("UShort", () => {
        let bb = ByteBuffer.allocate(1024);
        let input = 1024;
        UShort.encode(bb, input);
        bb.flip();
        let output = UShort.decode(bb);
        expect(output).toEqual(input);
    });
    test("Float", () => {
        let bb = ByteBuffer.allocate(1024);
        let input = 1024;
        Float.encode(bb, input);
        bb.flip();
        let output = Float.decode(bb);
        expect(output).toEqual(input);
    });
    test("Double", () => {
        let bb = ByteBuffer.allocate(1024);
        let input = 1024;
        Double.encode(bb, input);
        bb.flip();
        let output = Double.decode(bb);
        expect(output).toEqual(input);
    });
    test("String", () => {
        let bb = ByteBuffer.allocate(1024);
        let input = "1024";
        String.encode(bb, input);
        bb.flip();
        let output = String.decode(bb);
        expect(output).toEqual(input);
    });
    test("Bool", () => {
        let bb = ByteBuffer.allocate(1024);
        let input = false;
        Bool.encode(bb, input);
        bb.flip();
        let output = Bool.decode(bb);
        expect(output).toEqual(input);
    });
    test("ByteArray", () => {
        let bb = ByteBuffer.allocate(1024);
        let input = new Int8Array(10).fill(1);
        ByteArray.encode(bb, input);
        bb.flip();
        let output = ByteArray.decode(bb);
        expect(output).toEqual(input);
    });
    test("Byte", () => {
        let bb = ByteBuffer.allocate(1024);
        let input = 12;
        Byte.encode(bb, input);
        bb.flip();
        let output = Byte.decode(bb);
        expect(output).toEqual(input);
    });
    test("VarLong", () => {
        let bb = ByteBuffer.allocate(1024);
        let input = long.fromInt(1024);
        VarLong.encode(bb, input);
        bb.flip();
        let output = VarLong.decode(bb);
        expect(output).toEqual(input);
    });
    test("Long", () => {
        let bb = ByteBuffer.allocate(1024);
        let input = long.fromInt(1024);
        Long.encode(bb, input);
        bb.flip();
        let output = Long.decode(bb);
        expect(output).toEqual(input);
    });

});
