/*
 * ASM: a very small and fast Java bytecode manipulation framework
 * Copyright (c) 2000-2011 INRIA, France Telecom
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 * 3. Neither the name of the copyright holders nor the names of its
 *    contributors may be used to endorse or promote products derived from
 *    this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */
/* Generated from Java with JSweet 1.2.0-SNAPSHOT - http://www.jsweet.org */
/**
 * Defines the JVM opcodes, access flags and array type codes. This interface
 * does not define all the JVM opcodes because some opcodes are automatically
 * handled. For example, the xLOAD and xSTORE opcodes are automatically replaced
 * by xLOAD_n and xSTORE_n opcodes when possible. The xLOAD_n and xSTORE_n
 * opcodes are therefore not defined in this interface. Likewise for LDC,
 * automatically replaced by LDC_W or LDC2_W when necessary, WIDE, GOTO_W and
 * JSR_W.
 *
 * @author Eric Bruneton
 * @author Eugene Kuleshov
 */
export namespace Opcodes {

    export const ASM4 : number = 4 << 16 | 0 << 8 | 0;

    export const ASM5 : number = 5 << 16 | 0 << 8 | 0;

    export const V1_1 : number = 3 << 16 | 45;

    export const V1_2 : number = 0 << 16 | 46;

    export const V1_3 : number = 0 << 16 | 47;

    export const V1_4 : number = 0 << 16 | 48;

    export const V1_5 : number = 0 << 16 | 49;

    export const V1_6 : number = 0 << 16 | 50;

    export const V1_7 : number = 0 << 16 | 51;

    export const V1_8 : number = 0 << 16 | 52;

    export const ACC_PUBLIC : number = 1;

    export const ACC_PRIVATE : number = 2;

    export const ACC_PROTECTED : number = 4;

    export const ACC_STATIC : number = 8;

    export const ACC_FINAL : number = 16;

    export const ACC_SUPER : number = 32;

    export const ACC_SYNCHRONIZED : number = 32;

    export const ACC_VOLATILE : number = 64;

    export const ACC_BRIDGE : number = 64;

    export const ACC_VARARGS : number = 128;

    export const ACC_TRANSIENT : number = 128;

    export const ACC_NATIVE : number = 256;

    export const ACC_INTERFACE : number = 512;

    export const ACC_ABSTRACT : number = 1024;

    export const ACC_STRICT : number = 2048;

    export const ACC_SYNTHETIC : number = 4096;

    export const ACC_ANNOTATION : number = 8192;

    export const ACC_ENUM : number = 16384;

    export const ACC_MANDATED : number = 32768;

    export const ACC_DEPRECATED : number = 131072;

    export const T_BOOLEAN : number = 4;

    export const T_CHAR : number = 5;

    export const T_FLOAT : number = 6;

    export const T_DOUBLE : number = 7;

    export const T_BYTE : number = 8;

    export const T_SHORT : number = 9;

    export const T_INT : number = 10;

    export const T_LONG : number = 11;

    export const H_GETFIELD : number = 1;

    export const H_GETSTATIC : number = 2;

    export const H_PUTFIELD : number = 3;

    export const H_PUTSTATIC : number = 4;

    export const H_INVOKEVIRTUAL : number = 5;

    export const H_INVOKESTATIC : number = 6;

    export const H_INVOKESPECIAL : number = 7;

    export const H_NEWINVOKESPECIAL : number = 8;

    export const H_INVOKEINTERFACE : number = 9;

    /**
     * Represents an expanded frame. See {@link ClassReader#EXPAND_FRAMES}.
     */
    export const F_NEW : number = -1;

    /**
     * Represents a compressed frame with compexport conste frame data.
     */
    export const F_FULL : number = 0;

    /**
     * Represents a compressed frame where locals are the same as the locals in
     * the previous frame, except that additional 1-3 locals are defined, and
     * with an empty stack.
     */
    export const F_APPEND : number = 1;

    /**
     * Represents a compressed frame where locals are the same as the locals in
     * the previous frame, except that the last 1-3 locals are absent and with
     * an empty stack.
     */
    export const F_CHOP : number = 2;

    /**
     * Represents a compressed frame with exactly the same locals as the
     * previous frame and with an empty stack.
     */
    export const F_SAME : number = 3;

    /**
     * Represents a compressed frame with exactly the same locals as the
     * previous frame and with a single value on the stack.
     */
    export const F_SAME1 : number = 4;

    export const TOP : number = <number>new Number(0);

    export const INTEGER : number = <number>new Number(1);

    export const FLOAT : number = <number>new Number(2);

    export const DOUBLE : number = <number>new Number(3);

    export const LONG : number = <number>new Number(4);

    export const NULL : number = <number>new Number(5);

    export const UNINITIALIZED_THIS : number = <number>new Number(6);

    export const NOP : number = 0;

    export const ACONST_NULL : number = 1;

    export const ICONST_M1 : number = 2;

    export const ICONST_0 : number = 3;

    export const ICONST_1 : number = 4;

    export const ICONST_2 : number = 5;

    export const ICONST_3 : number = 6;

    export const ICONST_4 : number = 7;

    export const ICONST_5 : number = 8;

    export const LCONST_0 : number = 9;

    export const LCONST_1 : number = 10;

    export const FCONST_0 : number = 11;

    export const FCONST_1 : number = 12;

    export const FCONST_2 : number = 13;

    export const DCONST_0 : number = 14;

    export const DCONST_1 : number = 15;

    export const BIPUSH : number = 16;

    export const SIPUSH : number = 17;

    export const LDC : number = 18;

    export const ILOAD : number = 21;

    export const LLOAD : number = 22;

    export const FLOAD : number = 23;

    export const DLOAD : number = 24;

    export const ALOAD : number = 25;

    export const IALOAD : number = 46;

    export const LALOAD : number = 47;

    export const FALOAD : number = 48;

    export const DALOAD : number = 49;

    export const AALOAD : number = 50;

    export const BALOAD : number = 51;

    export const CALOAD : number = 52;

    export const SALOAD : number = 53;

    export const ISTORE : number = 54;

    export const LSTORE : number = 55;

    export const FSTORE : number = 56;

    export const DSTORE : number = 57;

    export const ASTORE : number = 58;

    export const IASTORE : number = 79;

    export const LASTORE : number = 80;

    export const FASTORE : number = 81;

    export const DASTORE : number = 82;

    export const AASTORE : number = 83;

    export const BASTORE : number = 84;

    export const CASTORE : number = 85;

    export const SASTORE : number = 86;

    export const POP : number = 87;

    export const POP2 : number = 88;

    export const DUP : number = 89;

    export const DUP_X1 : number = 90;

    export const DUP_X2 : number = 91;

    export const DUP2 : number = 92;

    export const DUP2_X1 : number = 93;

    export const DUP2_X2 : number = 94;

    export const SWAP : number = 95;

    export const IADD : number = 96;

    export const LADD : number = 97;

    export const FADD : number = 98;

    export const DADD : number = 99;

    export const ISUB : number = 100;

    export const LSUB : number = 101;

    export const FSUB : number = 102;

    export const DSUB : number = 103;

    export const IMUL : number = 104;

    export const LMUL : number = 105;

    export const FMUL : number = 106;

    export const DMUL : number = 107;

    export const IDIV : number = 108;

    export const LDIV : number = 109;

    export const FDIV : number = 110;

    export const DDIV : number = 111;

    export const IREM : number = 112;

    export const LREM : number = 113;

    export const FREM : number = 114;

    export const DREM : number = 115;

    export const INEG : number = 116;

    export const LNEG : number = 117;

    export const FNEG : number = 118;

    export const DNEG : number = 119;

    export const ISHL : number = 120;

    export const LSHL : number = 121;

    export const ISHR : number = 122;

    export const LSHR : number = 123;

    export const IUSHR : number = 124;

    export const LUSHR : number = 125;

    export const IAND : number = 126;

    export const LAND : number = 127;

    export const IOR : number = 128;

    export const LOR : number = 129;

    export const IXOR : number = 130;

    export const LXOR : number = 131;

    export const IINC : number = 132;

    export const I2L : number = 133;

    export const I2F : number = 134;

    export const I2D : number = 135;

    export const L2I : number = 136;

    export const L2F : number = 137;

    export const L2D : number = 138;

    export const F2I : number = 139;

    export const F2L : number = 140;

    export const F2D : number = 141;

    export const D2I : number = 142;

    export const D2L : number = 143;

    export const D2F : number = 144;

    export const I2B : number = 145;

    export const I2C : number = 146;

    export const I2S : number = 147;

    export const LCMP : number = 148;

    export const FCMPL : number = 149;

    export const FCMPG : number = 150;

    export const DCMPL : number = 151;

    export const DCMPG : number = 152;

    export const IFEQ : number = 153;

    export const IFNE : number = 154;

    export const IFLT : number = 155;

    export const IFGE : number = 156;

    export const IFGT : number = 157;

    export const IFLE : number = 158;

    export const IF_ICMPEQ : number = 159;

    export const IF_ICMPNE : number = 160;

    export const IF_ICMPLT : number = 161;

    export const IF_ICMPGE : number = 162;

    export const IF_ICMPGT : number = 163;

    export const IF_ICMPLE : number = 164;

    export const IF_ACMPEQ : number = 165;

    export const IF_ACMPNE : number = 166;

    export const GOTO : number = 167;

    export const JSR : number = 168;

    export const RET : number = 169;

    export const TABLESWITCH : number = 170;

    export const LOOKUPSWITCH : number = 171;

    export const IRETURN : number = 172;

    export const LRETURN : number = 173;

    export const FRETURN : number = 174;

    export const DRETURN : number = 175;

    export const ARETURN : number = 176;

    export const RETURN : number = 177;

    export const GETSTATIC : number = 178;

    export const PUTSTATIC : number = 179;

    export const GETFIELD : number = 180;

    export const PUTFIELD : number = 181;

    export const INVOKEVIRTUAL : number = 182;

    export const INVOKESPECIAL : number = 183;

    export const INVOKESTATIC : number = 184;

    export const INVOKEINTERFACE : number = 185;

    export const INVOKEDYNAMIC : number = 186;

    export const NEW : number = 187;

    export const NEWARRAY : number = 188;

    export const ANEWARRAY : number = 189;

    export const ARRAYLENGTH : number = 190;

    export const ATHROW : number = 191;

    export const CHECKCAST : number = 192;

    export const INSTANCEOF : number = 193;

    export const MONITORENTER : number = 194;

    export const MONITOREXIT : number = 195;

    export const MULTIANEWARRAY : number = 197;

    export const IFNULL : number = 198;

    export const IFNONNULL : number = 199;
}



