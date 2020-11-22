let int8 = new Int8Array(4);
let int32 = new Int32Array(int8.buffer, 0, 1);
let float32 = new Float32Array(int8.buffer, 0, 1);

export const SHORT_MIN = -32768;
export const SHORT_MAX = 32768

export function intBitsToFloat(bits: number): number {
    int32[0] = bits;
    return float32[0];
}

export function floatToIntBits(bits: number): number {
    float32[0] = bits;
    return int32[0];
}

let int16 = new Int16Array(4);
let int64 = new Int32Array(int16.buffer, 0, 2);
let float64 = new Float64Array(int16.buffer, 0, 1);

import Long from "long"

export function longBitsToDouble(bits: Long): number {
    int64[0] = bits.high;
    int64[1] = bits.low;
    return float64[0];
}

export function doubleToLongBits(double: number): Long {
    float64[0] = double;
    return new Long(int64[1], int64[0]);
}

