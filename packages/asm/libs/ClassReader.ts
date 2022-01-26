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
 * A Java class parser to make a {@link ClassVisitor} visit an existing class.
 * This class parses a byte array conforming to the Java class file format and
 * calls the appropriate visit methods of a given class visitor for each field,
 * method and bytecode instruction encountered.
 *
 * @author Eric Bruneton
 * @author Eugene Kuleshov
 */
import { AnnotationVisitor } from "./AnnotationVisitor"
import { Attribute } from "./Attribute"
import { ClassVisitor } from "./ClassVisitor"
import { ClassWriter } from "./ClassWriter"
import { Context } from "./Context"
import { FieldVisitor } from "./FieldVisitor"
import { Handle } from "./Handle"
import { Label } from "./Label"
import { MethodVisitor } from "./MethodVisitor"
import { MethodWriter } from "./MethodWriter"
import { Opcodes } from "./Opcodes"
import { Type } from "./Type"
import { TypePath } from "./TypePath"

import Long from "long"
import { intBitsToFloat, longBitsToDouble } from "./bits"
import { assert, notnull } from "./utils"

export class ClassReader {
    /**
    * True to enable signatures support.
    */
    static SIGNATURES: boolean = true;

    /**
     * True to enable annotations support.
     */
    static ANNOTATIONS: boolean = true;

    /**
     * True to enable stack map frames support.
     */
    static FRAMES: boolean = true;

    /**
     * True to enable bytecode writing support.
     */
    static WRITER: boolean = true;

    /**
     * True to enable JSR_W and GOTO_W support.
     */
    static RESIZE: boolean = true;

    /**
     * Flag to skip method code. If this class is set <code>CODE</code>
     * attribute won't be visited. This can be used, for example, to retrieve
     * annotations for methods and method parameters.
     */
    public static SKIP_CODE: number = 1;

    /**
     * Flag to skip the debug information in the class. If this flag is set the
     * debug information of the class is not visited, i.e. the
     * {@link MethodVisitor#visitLocalVariable visitLocalVariable} and
     * {@link MethodVisitor#visitLineNumber visitLineNumber} methods will not be
     * called.
     */
    public static SKIP_DEBUG: number = 2;

    /**
     * Flag to skip the stack map frames in the class. If this flag is set the
     * stack map frames of the class is not visited, i.e. the
     * {@link MethodVisitor#visitFrame visitFrame} method will not be called.
     * This flag is useful when the {@link ClassWriter#COMPUTE_FRAMES} option is
     * used: it avoids visiting frames that will be ignored and recomputed from
     * scratch in the class writer.
     */
    public static SKIP_FRAMES: number = 4;

    /**
     * Flag to expand the stack map frames. By default stack map frames are
     * visited in their original format (i.e. "expanded" for classes whose
     * version is less than V1_6, and "compressed" for the other classes). If
     * this flag is set, stack map frames are always visited in expanded format
     * (this option adds a decompression/recompression step in ClassReader and
     * ClassWriter which degrades performances quite a lot).
     */
    public static EXPAND_FRAMES: number = 8;

    /**
     * Flag to expand the ASM pseudo instructions into an equivalent sequence of
     * standard bytecode instructions. When resolving a forward jump it may
     * happen that the signed 2 bytes offset reserved for it is not sufficient
     * to store the bytecode offset. In this case the jump instruction is
     * replaced with a temporary ASM pseudo instruction using an unsigned 2
     * bytes offset (see Label#resolve). This internal flag is used to re-read
     * classes containing such instructions, in order to replace them with
     * standard instructions. In addition, when this flag is used, GOTO_W and
     * JSR_W are <i>not</i> converted into GOTO and JSR, to make sure that
     * infinite loops where a GOTO_W is replaced with a GOTO in ClassReader and
     * converted back to a GOTO_W in ClassWriter cannot occur.
     */
    static EXPAND_ASM_INSNS: number = 256;

    /**
     * The class to be parsed. <i>The content of this array must not be
     * modified. This field is intended for {@link Attribute} sub classes, and
     * is normally not needed by class generators or adapters.</i>
     */
    public buf: Uint8Array;

    /**
     * The start index of each constant pool item in {@link #b b}, plus one. The
     * one byte offset skips the constant pool item tag that indicates its type.
     */
    private items: number[];

    /**
     * The String objects corresponding to the CONSTANT_Utf8 items. This cache
     * avoids multiple parsing of a given CONSTANT_Utf8 constant pool item,
     * which GREATLY improves performances (by a factor 2 to 3). This caching
     * strategy could be extended to all constant pool items, but its benefit
     * would not be so great for these items (because they are much less
     * expensive to parse than CONSTANT_Utf8 items).
     */
    private strings: string[];

    /**
     * Maximum length of the strings contained in the constant pool of the
     * class.
     */
    private maxStringLength: number;

    /**
     * Start index of the class header information (access, name...) in
     * {@link #b b}.
     */
    public header: number;

    /**
     * Constructs a new {@link ClassReader} object.
     *
     * @param b   the bytecode of the class to be read.
     * @param off the start offset of the class data.
     * @param len the length of the class data.
     */
    public constructor(buffer: Uint8Array, classFileOffset: number = 0, len: number = buffer.length) {
        this.maxStringLength = 0;
        this.header = 0;
        this.buf = buffer;
        // if (this.readShort(classFileOffset + 6) > Opcodes.V1_8) { throw new Error(); }
        this.items = new Array(this.readUnsignedShort(classFileOffset + 8));
        let n: number = this.items.length;
        this.strings = new Array(n);
        let max: number = 0;
        let index: number = classFileOffset + 10;
        for (let i: number = 1; i < n; ++i) {
            this.items[i] = index + 1;
            let size: number;
            switch ((buffer[index])) {
                case ClassWriter.FIELD:
                case ClassWriter.METH:
                case ClassWriter.IMETH:
                case ClassWriter.INT:
                case ClassWriter.FLOAT:
                case ClassWriter.NAME_TYPE:
                case ClassWriter.INDY:
                    size = 5;
                    break;
                case ClassWriter.LONG:
                case ClassWriter.DOUBLE:
                    size = 9;
                    ++i;
                    break;
                case ClassWriter.UTF8:
                    size = 3 + this.readUnsignedShort(index + 1);
                    if (size > max) {
                        max = size;
                    }
                    break;
                case ClassWriter.HANDLE:
                    size = 4;
                    break;
                default:
                    size = 3;
                    break;
            }
            index += size;
        }
        this.maxStringLength = max;
        this.header = index;
    }

    /**
     * Returns the class's access flags (see {@link Opcodes}). This value may
     * not reflect Deprecated and Synthetic flags when bytecode is before 1.5
     * and those flags are represented by attributes.
     *
     * @return the class access flags
     * @see ClassVisitor#visit(int, int, String, String, String, String[])
     */
    public getAccess(): number {
        return this.readUnsignedShort(this.header);
    }

    /**
     * Returns the internal name of the class (see
     * {@link Type#getInternalName() getInternalName}).
     *
     * @return the internal class name
     * @see ClassVisitor#visit(int, int, String, String, String, String[])
     */
    public getClassName(): string {
        return this.readClass(this.header + 2, new Array(this.maxStringLength));
    }

    /**
     * Returns the internal of name of the super class (see
     * {@link Type#getInternalName() getInternalName}). For interfaces, the
     * super class is {@link Object}.
     *
     * @return the internal name of super class, or <tt>null</tt> for
     * {@link Object} class.
     * @see ClassVisitor#visit(int, int, String, String, String, String[])
     */
    public getSuperName(): string {
        return this.readClass(this.header + 4, new Array(this.maxStringLength));
    }

    /**
     * Returns the internal names of the class's interfaces (see
     * {@link Type#getInternalName() getInternalName}).
     *
     * @return the array of internal names for all implemented interfaces or
     * <tt>null</tt>.
     * @see ClassVisitor#visit(int, int, String, String, String, String[])
     */
    public getInterfaces(): string[] {
        let index: number = this.header + 6;
        let n: number = this.readUnsignedShort(index);
        let interfaces: string[] = new Array(n);
        if (n > 0) {
            let buf: number[] = new Array(this.maxStringLength);
            for (let i: number = 0; i < n; ++i) {
                index += 2;
                interfaces[i] = this.readClass(index, buf);
            }
        }
        return interfaces;
    }

    /**
     * Makes the given visitor visit the Java class of this {@link ClassReader}.
     * This class is the one specified in the constructor (see
     * {@link #ClassReader(byte[]) ClassReader}).
     *
     * @param classVisitor the visitor that must visit this class.
     * @param attrs        prototypes of the attributes that must be parsed during the
     * visit of the class. Any attribute whose type is not equal to
     * the type of one the prototypes will not be parsed: its byte
     * array value will be passed unchanged to the ClassWriter.
     * <i>This may corrupt it if this value contains references to
     * the constant pool, or has syntactic or semantic links with a
     * class element that has been transformed by a class adapter
     * between the reader and the writer</i>.
     * @param flags        option flags that can be used to modify the default behavior
     * of this class. See {@link #SKIP_DEBUG}, {@link #EXPAND_FRAMES}
     * , {@link #SKIP_FRAMES}, {@link #SKIP_CODE}.
     */
    public accept(classVisitor: ClassVisitor, attrs: Attribute[] = [], flags: number = 0): void {
        let u: number = this.header;
        let c: number[] = new Array(this.maxStringLength);
        let context: Context = new Context(attrs, flags, c);
        let access: number = this.readUnsignedShort(u);
        let name: string = this.readClass(u + 2, c);
        let superClass: string = this.readClass(u + 4, c);
        let interfaces: string[] = new Array(this.readUnsignedShort(u + 6));
        u += 8;
        for (let i: number = 0; i < interfaces.length; ++i) {
            interfaces[i] = this.readClass(u, c);
            u += 2;
        }
        let signature: string | null = null;
        let sourceFile: string | null = null;
        let sourceDebug: string | null = null;
        let enclosingOwner: string | null = null;
        let enclosingName: string | null = null;
        let enclosingDesc: string | null = null;
        let anns: number = 0;
        let ianns: number = 0;
        let tanns: number = 0;
        let itanns: number = 0;
        let innerClasses: number = 0;
        let attributes: Attribute | null = null;
        u = this.getAttributes();
        for (let i: number = this.readUnsignedShort(u); i > 0; --i) {
            let attrName: string | null = this.readUTF8(u + 2, c);
            if (("SourceFile" === attrName)) {
                sourceFile = this.readUTF8(u + 8, c);
            } else if (("InnerClasses" === attrName)) {
                innerClasses = u + 8;
            } else if (("EnclosingMethod" === attrName)) {
                enclosingOwner = this.readClass(u + 8, c);
                let item: number = this.readUnsignedShort(u + 10);
                if (item !== 0) {
                    enclosingName = this.readUTF8(this.items[item], c);
                    enclosingDesc = this.readUTF8(this.items[item] + 2, c);
                }
            } else if (ClassReader.SIGNATURES && ("Signature" === attrName)) {
                signature = this.readUTF8(u + 8, c);
            } else if (ClassReader.ANNOTATIONS && ("RuntimeVisibleAnnotations" === attrName)) {
                anns = u + 8;
            } else if (ClassReader.ANNOTATIONS && ("RuntimeVisibleTypeAnnotations" === attrName)) {
                tanns = u + 8;
            } else if (("Deprecated" === attrName)) {
                access |= Opcodes.ACC_DEPRECATED;
            } else if (("Synthetic" === attrName)) {
                access |= Opcodes.ACC_SYNTHETIC | ClassWriter.ACC_SYNTHETIC_ATTRIBUTE;
            } else if (("SourceDebugExtension" === attrName)) {
                let len: number = this.readInt(u + 4);
                sourceDebug = this.readUTF(u + 8, len, new Array(len));
            } else if (ClassReader.ANNOTATIONS && ("RuntimeInvisibleAnnotations" === attrName)) {
                ianns = u + 8;
            } else if (ClassReader.ANNOTATIONS && ("RuntimeInvisibleTypeAnnotations" === attrName)) {
                itanns = u + 8;
            } else if (("BootstrapMethods" === attrName)) {
                let bootstrapMethods: number[] = new Array(this.readUnsignedShort(u + 8));
                for (let j: number = 0, v: number = u + 10; j < bootstrapMethods.length; j++) {
                    bootstrapMethods[j] = v;
                    v += 2 + this.readUnsignedShort(v + 2) << 1;
                }
                context.bootstrapMethods = bootstrapMethods;
            } else {
                let attr: Attribute = this.readAttribute(attrs, attrName, u + 8, this.readInt(u + 4), c, -1, null);
                if (attr != null) {
                    attr.next = attributes;
                    attributes = attr;
                }
            }
            u += 6 + this.readInt(u + 4);
        }
        classVisitor.visit(this.readInt(this.items[1] - 7), access, name, signature, superClass, interfaces);
        if ((flags & ClassReader.SKIP_DEBUG) === 0 && (sourceFile != null || sourceDebug != null)) {
            classVisitor.visitSource(sourceFile, sourceDebug);
        }
        if (enclosingOwner != null) {
            classVisitor.visitOuterClass(enclosingOwner, enclosingName, enclosingDesc);
        }
        if (ClassReader.ANNOTATIONS && anns !== 0) {
            for (let i: number = this.readUnsignedShort(anns), v: number = anns + 2; i > 0; --i) {
                v = this.readAnnotationValues(v + 2, c, true, classVisitor.visitAnnotation(this.readUTF8(v, c), true));
            }
        }
        if (ClassReader.ANNOTATIONS && ianns !== 0) {
            for (let i: number = this.readUnsignedShort(ianns), v: number = ianns + 2; i > 0; --i) {
                v = this.readAnnotationValues(v + 2, c, true, classVisitor.visitAnnotation(this.readUTF8(v, c), false));
            }
        }
        if (ClassReader.ANNOTATIONS && tanns !== 0) {
            for (let i: number = this.readUnsignedShort(tanns), v: number = tanns + 2; i > 0; --i) {
                v = this.readAnnotationTarget(context, v);
                v = this.readAnnotationValues(v + 2, c, true, classVisitor.visitTypeAnnotation(context.typeRef, context.typePath, this.readUTF8(v, c), true));
            }
        }
        if (ClassReader.ANNOTATIONS && itanns !== 0) {
            for (let i: number = this.readUnsignedShort(itanns), v: number = itanns + 2; i > 0; --i) {
                v = this.readAnnotationTarget(context, v);
                v = this.readAnnotationValues(v + 2, c, true, classVisitor.visitTypeAnnotation(context.typeRef, context.typePath, this.readUTF8(v, c), false));
            }
        }
        while ((attributes != null)) {
            let attr: Attribute | null = attributes.next;
            attributes.next = null;
            classVisitor.visitAttribute(attributes);
            attributes = attr;
        };
        if (innerClasses !== 0) {
            let v: number = innerClasses + 2;
            for (let i: number = this.readUnsignedShort(innerClasses); i > 0; --i) {
                classVisitor.visitInnerClass(this.readClass(v, c), this.readClass(v + 2, c), this.readUTF8(v + 4, c), this.readUnsignedShort(v + 6));
                v += 8;
            }
        }
        u = this.header + 10 + 2 * interfaces.length;
        for (let i: number = this.readUnsignedShort(u - 2); i > 0; --i) {
            u = this.readField(classVisitor, context, u);
        }
        u += 2;
        for (let i: number = this.readUnsignedShort(u - 2); i > 0; --i) {
            u = this.readMethod(classVisitor, context, u);
        }
        classVisitor.visitEnd();
    }

    /**
     * Reads a field and makes the given visitor visit it.
     *
     * @param classVisitor the visitor that must visit the field.
     * @param context      information about the class being parsed.
     * @param u            the start offset of the field in the class file.
     * @return the offset of the first byte following the field in the class.
     */
    private readField(classVisitor: ClassVisitor, context: Context, u: number): number {
        let c: number[] = context.buffer;
        let access: number = this.readUnsignedShort(u);
        let name: string | null = this.readUTF8(u + 2, c);
        let desc: string | null = this.readUTF8(u + 4, c);
        u += 6;
        let signature: string | null = null;
        let anns: number = 0;
        let ianns: number = 0;
        let tanns: number = 0;
        let itanns: number = 0;
        let value: any = null;
        let attributes: Attribute | null = null;
        for (let i: number = this.readUnsignedShort(u); i > 0; --i) {
            let attrName: string | null = this.readUTF8(u + 2, c);
            if (("ConstantValue" === attrName)) {
                let item: number = this.readUnsignedShort(u + 8);
                value = item === 0 ? null : this.readConst(item, c);
            } else if (ClassReader.SIGNATURES && ("Signature" === attrName)) {
                signature = this.readUTF8(u + 8, c);
            } else if (("Deprecated" === attrName)) {
                access |= Opcodes.ACC_DEPRECATED;
            } else if (("Synthetic" === attrName)) {
                access |= Opcodes.ACC_SYNTHETIC | ClassWriter.ACC_SYNTHETIC_ATTRIBUTE;
            } else if (ClassReader.ANNOTATIONS && ("RuntimeVisibleAnnotations" === attrName)) {
                anns = u + 8;
            } else if (ClassReader.ANNOTATIONS && ("RuntimeVisibleTypeAnnotations" === attrName)) {
                tanns = u + 8;
            } else if (ClassReader.ANNOTATIONS && ("RuntimeInvisibleAnnotations" === attrName)) {
                ianns = u + 8;
            } else if (ClassReader.ANNOTATIONS && ("RuntimeInvisibleTypeAnnotations" === attrName)) {
                itanns = u + 8;
            } else {
                let attr: Attribute = this.readAttribute(context.attrs, attrName, u + 8, this.readInt(u + 4), c, -1, null);
                if (attr != null) {
                    attr.next = attributes;
                    attributes = attr;
                }
            }
            u += 6 + this.readInt(u + 4);
        }
        u += 2;
        assert(name);
        let fv: FieldVisitor | null = classVisitor.visitField(access, name, desc, signature, value);
        if (fv == null) {
            return u;
        }
        if (ClassReader.ANNOTATIONS && anns !== 0) {
            for (let i: number = this.readUnsignedShort(anns), v: number = anns + 2; i > 0; --i) {
                v = this.readAnnotationValues(v + 2, c, true, fv.visitAnnotation(this.readUTF8(v, c), true));
            }
        }
        if (ClassReader.ANNOTATIONS && ianns !== 0) {
            for (let i: number = this.readUnsignedShort(ianns), v: number = ianns + 2; i > 0; --i) {
                v = this.readAnnotationValues(v + 2, c, true, fv.visitAnnotation(this.readUTF8(v, c), false));
            }
        }
        if (ClassReader.ANNOTATIONS && tanns !== 0) {
            for (let i: number = this.readUnsignedShort(tanns), v: number = tanns + 2; i > 0; --i) {
                v = this.readAnnotationTarget(context, v);
                v = this.readAnnotationValues(v + 2, c, true, fv.visitTypeAnnotation(context.typeRef, context.typePath, this.readUTF8(v, c), true));
            }
        }
        if (ClassReader.ANNOTATIONS && itanns !== 0) {
            for (let i: number = this.readUnsignedShort(itanns), v: number = itanns + 2; i > 0; --i) {
                v = this.readAnnotationTarget(context, v);
                v = this.readAnnotationValues(v + 2, c, true, fv.visitTypeAnnotation(context.typeRef, context.typePath, this.readUTF8(v, c), false));
            }
        }
        while ((attributes != null)) {
            let attr: Attribute | null = attributes.next;
            attributes.next = null;
            fv.visitAttribute(attributes);
            attributes = attr;
        };
        fv.visitEnd();
        return u;
    }

    /**
     * Reads a method and makes the given visitor visit it.
     *
     * @param classVisitor the visitor that must visit the method.
     * @param context      information about the class being parsed.
     * @param u            the start offset of the method in the class file.
     * @return the offset of the first byte following the method in the class.
     */
    private readMethod(classVisitor: ClassVisitor, context: Context, u: number): number {
        let c: number[] = context.buffer;
        context.access = this.readUnsignedShort(u);
        context.name = this.readUTF8(u + 2, c);
        context.desc = this.readUTF8(u + 4, c);
        u += 6;
        let code: number = 0;
        let exception: number = 0;
        let exceptions: string[] | null = null;
        let signature: string | null = null;
        let methodParameters: number = 0;
        let anns: number = 0;
        let ianns: number = 0;
        let tanns: number = 0;
        let itanns: number = 0;
        let dann: number = 0;
        let mpanns: number = 0;
        let impanns: number = 0;
        let firstAttribute: number = u;
        let attributes: Attribute | null = null;
        for (let i: number = this.readUnsignedShort(u); i > 0; --i) {
            let attrName: string | null = this.readUTF8(u + 2, c);
            if (("Code" === attrName)) {
                if ((context.flags & ClassReader.SKIP_CODE) === 0) {
                    code = u + 8;
                }
            } else if (("Exceptions" === attrName)) {
                exceptions = new Array(this.readUnsignedShort(u + 8));
                exception = u + 10;
                for (let j: number = 0; j < exceptions.length; ++j) {
                    exceptions[j] = this.readClass(exception, c);
                    exception += 2;
                }
            } else if (ClassReader.SIGNATURES && ("Signature" === attrName)) {
                signature = this.readUTF8(u + 8, c);
            } else if (("Deprecated" === attrName)) {
                context.access |= Opcodes.ACC_DEPRECATED;
            } else if (ClassReader.ANNOTATIONS && ("RuntimeVisibleAnnotations" === attrName)) {
                anns = u + 8;
            } else if (ClassReader.ANNOTATIONS && ("RuntimeVisibleTypeAnnotations" === attrName)) {
                tanns = u + 8;
            } else if (ClassReader.ANNOTATIONS && ("AnnotationDefault" === attrName)) {
                dann = u + 8;
            } else if (("Synthetic" === attrName)) {
                context.access |= Opcodes.ACC_SYNTHETIC | ClassWriter.ACC_SYNTHETIC_ATTRIBUTE;
            } else if (ClassReader.ANNOTATIONS && ("RuntimeInvisibleAnnotations" === attrName)) {
                ianns = u + 8;
            } else if (ClassReader.ANNOTATIONS && ("RuntimeInvisibleTypeAnnotations" === attrName)) {
                itanns = u + 8;
            } else if (ClassReader.ANNOTATIONS && ("RuntimeVisibleParameterAnnotations" === attrName)) {
                mpanns = u + 8;
            } else if (ClassReader.ANNOTATIONS && ("RuntimeInvisibleParameterAnnotations" === attrName)) {
                impanns = u + 8;
            } else if (("MethodParameters" === attrName)) {
                methodParameters = u + 8;
            } else {
                let attr: Attribute = this.readAttribute(context.attrs, attrName, u + 8, this.readInt(u + 4), c, -1, null);
                if (attr != null) {
                    attr.next = attributes;
                    attributes = attr;
                }
            }
            u += 6 + this.readInt(u + 4);
        }
        u += 2;
        let mv: MethodVisitor | null = classVisitor.visitMethod(context.access, context.name, context.desc, signature, exceptions);
        if (mv == null) {
            return u;
        }
        if (ClassReader.WRITER && (mv != null && mv instanceof MethodWriter)) {
            let mw: MethodWriter = mv;
            if (mw.cw.cr === this && signature === mw.signature) {
                let sameExceptions: boolean = false;
                if (exceptions == null) {
                    sameExceptions = mw.exceptionCount === 0;
                } else if (exceptions.length === mw.exceptionCount) {
                    sameExceptions = true;
                    for (let j: number = exceptions.length - 1; j >= 0; --j) {
                        exception -= 2;
                        if (mw.exceptions?.[j] !== this.readUnsignedShort(exception)) {
                            sameExceptions = false;
                            break;
                        }
                    }
                }
                if (sameExceptions) {
                    mw.classReaderOffset = firstAttribute;
                    mw.classReaderLength = u - firstAttribute;
                    return u;
                }
            }
        }
        if (methodParameters !== 0) {
            for (let i: number = this.buf[methodParameters] & 255, v: number = methodParameters + 1; i > 0; --i, v = v + 4) {
                mv.visitParameter(this.readUTF8(v, c), this.readUnsignedShort(v + 2));
            }
        }
        if (ClassReader.ANNOTATIONS && dann !== 0) {
            let dv: AnnotationVisitor | null = mv.visitAnnotationDefault();
            this.readAnnotationValue(dann, c, null, dv);
            if (dv != null) {
                dv.visitEnd();
            }
        }
        if (ClassReader.ANNOTATIONS && anns !== 0) {
            for (let i: number = this.readUnsignedShort(anns), v: number = anns + 2; i > 0; --i) {
                v = this.readAnnotationValues(v + 2, c, true, mv.visitAnnotation(this.readUTF8(v, c), true));
            }
        }
        if (ClassReader.ANNOTATIONS && ianns !== 0) {
            for (let i: number = this.readUnsignedShort(ianns), v: number = ianns + 2; i > 0; --i) {
                v = this.readAnnotationValues(v + 2, c, true, mv.visitAnnotation(this.readUTF8(v, c), false));
            }
        }
        if (ClassReader.ANNOTATIONS && tanns !== 0) {
            for (let i: number = this.readUnsignedShort(tanns), v: number = tanns + 2; i > 0; --i) {
                v = this.readAnnotationTarget(context, v);
                v = this.readAnnotationValues(v + 2, c, true, mv.visitTypeAnnotation(context.typeRef, context.typePath, this.readUTF8(v, c), true));
            }
        }
        if (ClassReader.ANNOTATIONS && itanns !== 0) {
            for (let i: number = this.readUnsignedShort(itanns), v: number = itanns + 2; i > 0; --i) {
                v = this.readAnnotationTarget(context, v);
                v = this.readAnnotationValues(v + 2, c, true, mv.visitTypeAnnotation(context.typeRef, context.typePath, this.readUTF8(v, c), false));
            }
        }
        if (ClassReader.ANNOTATIONS && mpanns !== 0) {
            this.readParameterAnnotations(mv, context, mpanns, true);
        }
        if (ClassReader.ANNOTATIONS && impanns !== 0) {
            this.readParameterAnnotations(mv, context, impanns, false);
        }
        while ((attributes != null)) {
            let attr: Attribute | null = attributes.next;
            attributes.next = null;
            mv.visitAttribute(attributes);
            attributes = attr;
        };
        if (code !== 0) {
            mv.visitCode();
            this.readCode(mv, context, code);
        }
        mv.visitEnd();
        return u;
    }

    /**
     * Reads the bytecode of a method and makes the given visitor visit it.
     *
     * @param mv      the visitor that must visit the method's code.
     * @param context information about the class being parsed.
     * @param u       the start offset of the code attribute in the class file.
     */
    private readCode(mv: MethodVisitor, context: Context, u: number) {
        let b: Uint8Array = this.buf;
        let c: number[] = context.buffer;
        let maxStack: number = this.readUnsignedShort(u);
        let maxLocals: number = this.readUnsignedShort(u + 2);
        let codeLength: number = this.readInt(u + 4);
        u += 8;
        let codeStart: number = u;
        let codeEnd: number = u + codeLength;
        let labels: Label[] = context.labels = new Array(codeLength + 2);
        this.readLabel(codeLength + 1, labels);
        while ((u < codeEnd)) {
            let offset: number = u - codeStart;
            let opcode: number = b[u] & 255;
            switch ((ClassWriter.TYPE[opcode])) {
                case ClassWriter.NOARG_INSN:
                case ClassWriter.IMPLVAR_INSN:
                    u += 1;
                    break;
                case ClassWriter.LABEL_INSN:
                    this.readLabel(offset + this.readShort(u + 1), labels);
                    u += 3;
                    break;
                case ClassWriter.ASM_LABEL_INSN:
                    this.readLabel(offset + this.readUnsignedShort(u + 1), labels);
                    u += 3;
                    break;
                case ClassWriter.LABELW_INSN:
                    this.readLabel(offset + this.readInt(u + 1), labels);
                    u += 5;
                    break;
                case ClassWriter.WIDE_INSN:
                    opcode = b[u + 1] & 255;
                    if (opcode === Opcodes.IINC) {
                        u += 6;
                    } else {
                        u += 4;
                    }
                    break;
                case ClassWriter.TABL_INSN:
                    u = u + 4 - (offset & 3);
                    this.readLabel(offset + this.readInt(u), labels);
                    for (let i: number = this.readInt(u + 8) - this.readInt(u + 4) + 1; i > 0; --i) {
                        this.readLabel(offset + this.readInt(u + 12), labels);
                        u += 4;
                    }
                    u += 12;
                    break;
                case ClassWriter.LOOK_INSN:
                    u = u + 4 - (offset & 3);
                    this.readLabel(offset + this.readInt(u), labels);
                    for (let i: number = this.readInt(u + 4); i > 0; --i) {
                        this.readLabel(offset + this.readInt(u + 12), labels);
                        u += 8;
                    }
                    u += 8;
                    break;
                case ClassWriter.VAR_INSN:
                case ClassWriter.SBYTE_INSN:
                case ClassWriter.LDC_INSN:
                    u += 2;
                    break;
                case ClassWriter.SHORT_INSN:
                case ClassWriter.LDCW_INSN:
                case ClassWriter.FIELDORMETH_INSN:
                case ClassWriter.TYPE_INSN:
                case ClassWriter.IINC_INSN:
                    u += 3;
                    break;
                case ClassWriter.ITFMETH_INSN:
                case ClassWriter.INDYMETH_INSN:
                    u += 5;
                    break;
                default:
                    u += 4;
                    break;
            }
        };
        for (let i: number = this.readUnsignedShort(u); i > 0; --i) {
            let start: Label = this.readLabel(this.readUnsignedShort(u + 2), labels);
            let end: Label = this.readLabel(this.readUnsignedShort(u + 4), labels);
            let handler: Label = this.readLabel(this.readUnsignedShort(u + 6), labels);
            let type: string | null = this.readUTF8(this.items[this.readUnsignedShort(u + 8)], c);
            mv.visitTryCatchBlock(start, end, handler, type);
            u += 8;
        }
        u += 2;
        let tanns: number[] | null = null;
        let itanns: number[] | null = null;
        let tann: number = 0;
        let itann: number = 0;
        let ntoff: number = -1;
        let nitoff: number = -1;
        let varTable: number = 0;
        let varTypeTable: number = 0;
        let zip: boolean = true;
        let unzip: boolean = (context.flags & ClassReader.EXPAND_FRAMES) !== 0;
        let stackMap: number = 0;
        let stackMapSize: number = 0;
        let frameCount: number = 0;
        let frame: Context | null = null;
        let attributes: Attribute | null = null;
        for (let i: number = this.readUnsignedShort(u); i > 0; --i) {
            let attrName: string | null = this.readUTF8(u + 2, c);
            if (("LocalVariableTable" === attrName)) {
                if ((context.flags & ClassReader.SKIP_DEBUG) === 0) {
                    varTable = u + 8;
                    for (let j: number = this.readUnsignedShort(u + 8), v: number = u; j > 0; --j) {
                        let label: number = this.readUnsignedShort(v + 10);
                        if (labels[label] == null) {
                            this.readLabel(label, labels).status |= Label.DEBUG;
                        }
                        label += this.readUnsignedShort(v + 12);
                        if (labels[label] == null) {
                            this.readLabel(label, labels).status |= Label.DEBUG;
                        }
                        v += 10;
                    }
                }
            } else if (("LocalVariableTypeTable" === attrName)) {
                varTypeTable = u + 8;
            } else if (("LineNumberTable" === attrName)) {
                if ((context.flags & ClassReader.SKIP_DEBUG) === 0) {
                    for (let j: number = this.readUnsignedShort(u + 8), v: number = u; j > 0; --j) {
                        let label: number = this.readUnsignedShort(v + 10);
                        if (labels[label] == null) {
                            this.readLabel(label, labels).status |= Label.DEBUG;
                        }
                        let l: Label = labels[label];
                        while ((l.line > 0)) {
                            if (l.next == null) {
                                l.next = new Label();
                            }
                            l = l.next;
                        };
                        l.line = this.readUnsignedShort(v + 12);
                        v += 4;
                    }
                }
            } else if (ClassReader.ANNOTATIONS && ("RuntimeVisibleTypeAnnotations" === attrName)) {
                tanns = this.readTypeAnnotations(mv, context, u + 8, true);
                ntoff = tanns.length === 0 || this.readByte(tanns[0]) < 67 ? -1 : this.readUnsignedShort(tanns[0] + 1);
            } else if (ClassReader.ANNOTATIONS && ("RuntimeInvisibleTypeAnnotations" === attrName)) {
                itanns = this.readTypeAnnotations(mv, context, u + 8, false);
                nitoff = itanns.length === 0 || this.readByte(itanns[0]) < 67 ? -1 : this.readUnsignedShort(itanns[0] + 1);
            } else if (ClassReader.FRAMES && ("StackMapTable" === attrName)) {
                if ((context.flags & ClassReader.SKIP_FRAMES) === 0) {
                    stackMap = u + 10;
                    stackMapSize = this.readInt(u + 4);
                    frameCount = this.readUnsignedShort(u + 8);
                }
            } else if (ClassReader.FRAMES && ("StackMap" === attrName)) {
                if ((context.flags & ClassReader.SKIP_FRAMES) === 0) {
                    zip = false;
                    stackMap = u + 10;
                    stackMapSize = this.readInt(u + 4);
                    frameCount = this.readUnsignedShort(u + 8);
                }
            } else {
                for (let j: number = 0; j < context.attrs.length; ++j) {
                    if ((context.attrs[j].type === attrName)) {
                        let attr: Attribute = context.attrs[j].read(this, u + 8, this.readInt(u + 4), c, codeStart - 8, labels);
                        if (attr != null) {
                            attr.next = attributes;
                            attributes = attr;
                        }
                    }
                }
            }
            u += 6 + this.readInt(u + 4);
        }
        u += 2;
        if (ClassReader.FRAMES && stackMap !== 0) {
            frame = context;
            frame.offset = -1;
            frame.mode = 0;
            frame.localCount = 0;
            frame.localDiff = 0;
            frame.stackCount = 0;
            frame.local = new Array(maxLocals);
            frame.stack = new Array(maxStack);
            if (unzip) {
                this.getImplicitFrame(context);
            }
            for (let i: number = stackMap; i < stackMap + stackMapSize - 2; ++i) {
                if (b[i] === 8) {
                    let v: number = this.readUnsignedShort(i + 1);
                    if (v >= 0 && v < codeLength) {
                        if ((b[codeStart + v] & 255) === Opcodes.NEW) {
                            this.readLabel(v, labels);
                        }
                    }
                }
            }
        }
        if ((context.flags & ClassReader.EXPAND_ASM_INSNS) !== 0) {
            mv.visitFrame(Opcodes.F_NEW, maxLocals, null, 0, null);
        }
        let opcodeDelta: number = (context.flags & ClassReader.EXPAND_ASM_INSNS) === 0 ? -33 : 0;
        u = codeStart;
        while ((u < codeEnd)) {
            let offset: number = u - codeStart;
            let l: Label = labels[offset];
            if (l != null) {
                let next: Label | null = l.next;
                l.next = null;
                mv.visitLabel(l);
                if ((context.flags & ClassReader.SKIP_DEBUG) === 0 && l.line > 0) {
                    mv.visitLineNumber(l.line, l);
                    while ((next != null)) {
                        mv.visitLineNumber(next.line, l);
                        next = next.next;
                    };
                }
            }
            while ((ClassReader.FRAMES && frame != null && (frame.offset === offset || frame.offset === -1))) {
                if (frame.offset !== -1) {
                    if (!zip || unzip) {
                        mv.visitFrame(Opcodes.F_NEW, frame.localCount, frame.local, frame.stackCount, frame.stack);
                    } else {
                        mv.visitFrame(frame.mode, frame.localDiff, frame.local, frame.stackCount, frame.stack);
                    }
                }
                if (frameCount > 0) {
                    stackMap = this.readFrame(stackMap, zip, unzip, frame);
                    --frameCount;
                } else {
                    frame = null;
                }
            };
            let opcode: number = b[u] & 255;
            switch ((ClassWriter.TYPE[opcode])) {
                case ClassWriter.NOARG_INSN:
                    mv.visitInsn(opcode);
                    u += 1;
                    break;
                case ClassWriter.IMPLVAR_INSN:
                    if (opcode > Opcodes.ISTORE) {
                        opcode -= 59;
                        mv.visitVarInsn(Opcodes.ISTORE + (opcode >> 2), opcode & 3);
                    } else {
                        opcode -= 26;
                        mv.visitVarInsn(Opcodes.ILOAD + (opcode >> 2), opcode & 3);
                    }
                    u += 1;
                    break;
                case ClassWriter.LABEL_INSN:
                    mv.visitJumpInsn(opcode, labels[offset + this.readShort(u + 1)]);
                    u += 3;
                    break;
                case ClassWriter.LABELW_INSN:
                    mv.visitJumpInsn(opcode + opcodeDelta, labels[offset + this.readInt(u + 1)]);
                    u += 5;
                    break;
                case ClassWriter.ASM_LABEL_INSN:
                    {
                        opcode = opcode < 218 ? opcode - 49 : opcode - 20;
                        let target: Label = labels[offset + this.readUnsignedShort(u + 1)];
                        if (opcode === Opcodes.GOTO || opcode === Opcodes.JSR) {
                            mv.visitJumpInsn(opcode + 33, target);
                        } else {
                            opcode = opcode <= 166 ? ((opcode + 1) ^ 1) - 1 : opcode ^ 1;
                            let endif: Label = new Label();
                            mv.visitJumpInsn(opcode, endif);
                            mv.visitJumpInsn(200, target);
                            mv.visitLabel(endif);
                            if (ClassReader.FRAMES && stackMap !== 0 && (frame == null || frame.offset !== offset + 3)) {
                                mv.visitFrame(ClassWriter.F_INSERT, 0, null, 0, null);
                            }
                        }
                        u += 3;
                        break;
                    };
                case ClassWriter.WIDE_INSN:
                    opcode = b[u + 1] & 255;
                    if (opcode === Opcodes.IINC) {
                        mv.visitIincInsn(this.readUnsignedShort(u + 2), this.readShort(u + 4));
                        u += 6;
                    } else {
                        mv.visitVarInsn(opcode, this.readUnsignedShort(u + 2));
                        u += 4;
                    }
                    break;
                case ClassWriter.TABL_INSN:
                    {
                        u = u + 4 - (offset & 3);
                        let label: number = offset + this.readInt(u);
                        let min: number = this.readInt(u + 4);
                        let max: number = this.readInt(u + 8);
                        let table: Label[] = new Array(max - min + 1);
                        u += 12;
                        for (let i: number = 0; i < table.length; ++i) {
                            table[i] = labels[offset + this.readInt(u)];
                            u += 4;
                        }
                        mv.visitTableSwitchInsn(min, max, labels[label], ...table);
                        break;
                    };
                case ClassWriter.LOOK_INSN:
                    {
                        u = u + 4 - (offset & 3);
                        let label: number = offset + this.readInt(u);
                        let len: number = this.readInt(u + 4);
                        let keys: number[] = new Array(len);
                        let values: Label[] = new Array(len);
                        u += 8;
                        for (let i: number = 0; i < len; ++i) {
                            keys[i] = this.readInt(u);
                            values[i] = labels[offset + this.readInt(u + 4)];
                            u += 8;
                        }
                        mv.visitLookupSwitchInsn(labels[label], keys, values);
                        break;
                    };
                case ClassWriter.VAR_INSN:
                    mv.visitVarInsn(opcode, b[u + 1] & 255);
                    u += 2;
                    break;
                case ClassWriter.SBYTE_INSN:
                    mv.visitIntInsn(opcode, b[u + 1]);
                    u += 2;
                    break;
                case ClassWriter.SHORT_INSN:
                    mv.visitIntInsn(opcode, this.readShort(u + 1));
                    u += 3;
                    break;
                case ClassWriter.LDC_INSN:
                    mv.visitLdcInsn(this.readConst(b[u + 1] & 255, c));
                    u += 2;
                    break;
                case ClassWriter.LDCW_INSN:
                    mv.visitLdcInsn(this.readConst(this.readUnsignedShort(u + 1), c));
                    u += 3;
                    break;
                case ClassWriter.FIELDORMETH_INSN:
                case ClassWriter.ITFMETH_INSN:
                    {
                        let cpIndex: number = this.items[this.readUnsignedShort(u + 1)];
                        let itf: boolean = b[cpIndex - 1] === ClassWriter.IMETH;
                        let iowner: string = this.readClass(cpIndex, c);
                        cpIndex = this.items[this.readUnsignedShort(cpIndex + 2)];
                        let iname: string | null = this.readUTF8(cpIndex, c);
                        let idesc: string | null = this.readUTF8(cpIndex + 2, c);
                        if (opcode < Opcodes.INVOKEVIRTUAL) {
                            mv.visitFieldInsn(opcode, iowner, iname, idesc);
                        } else {
                            mv.visitMethodInsn(opcode, iowner, iname, idesc, itf);
                        }
                        if (opcode === Opcodes.INVOKEINTERFACE) {
                            u += 5;
                        } else {
                            u += 3;
                        }
                        break;
                    };
                case ClassWriter.INDYMETH_INSN:
                    {
                        let cpIndex: number = this.items[this.readUnsignedShort(u + 1)];
                        let bsmIndex: number = context.bootstrapMethods[this.readUnsignedShort(cpIndex)];
                        let bsm: Handle = <Handle>this.readConst(this.readUnsignedShort(bsmIndex), c);
                        let bsmArgCount: number = this.readUnsignedShort(bsmIndex + 2);
                        let bsmArgs: any[] = new Array(bsmArgCount);
                        bsmIndex += 4;
                        for (let i: number = 0; i < bsmArgCount; i++) {
                            bsmArgs[i] = this.readConst(this.readUnsignedShort(bsmIndex), c);
                            bsmIndex += 2;
                        }
                        cpIndex = this.items[this.readUnsignedShort(cpIndex + 2)];
                        let iname: string | null = this.readUTF8(cpIndex, c);
                        let idesc: string | null = this.readUTF8(cpIndex + 2, c);
                        mv.visitInvokeDynamicInsn(iname, idesc, bsm, ...bsmArgs);
                        u += 5;
                        break;
                    };
                case ClassWriter.TYPE_INSN:
                    mv.visitTypeInsn(opcode, this.readClass(u + 1, c));
                    u += 3;
                    break;
                case ClassWriter.IINC_INSN:
                    mv.visitIincInsn(b[u + 1] & 255, b[u + 2]);
                    u += 3;
                    break;
                default:
                    mv.visitMultiANewArrayInsn(this.readClass(u + 1, c), b[u + 3] & 255);
                    u += 4;
                    break;
            }
            while ((tanns != null && tann < tanns.length && ntoff <= offset)) {
                if (ntoff === offset) {
                    let v: number = this.readAnnotationTarget(context, tanns[tann]);
                    this.readAnnotationValues(v + 2, c, true, mv.visitInsnAnnotation(context.typeRef, context.typePath, this.readUTF8(v, c), true));
                }
                ntoff = ++tann >= tanns.length || this.readByte(tanns[tann]) < 67 ? -1 : this.readUnsignedShort(tanns[tann] + 1);
            };
            while ((itanns != null && itann < itanns.length && nitoff <= offset)) {
                if (nitoff === offset) {
                    let v: number = this.readAnnotationTarget(context, itanns[itann]);
                    this.readAnnotationValues(v + 2, c, true, mv.visitInsnAnnotation(context.typeRef, context.typePath, this.readUTF8(v, c), false));
                }
                nitoff = ++itann >= itanns.length || this.readByte(itanns[itann]) < 67 ? -1 : this.readUnsignedShort(itanns[itann] + 1);
            };
        };
        if (labels[codeLength] != null) {
            mv.visitLabel(labels[codeLength]);
        }
        if ((context.flags & ClassReader.SKIP_DEBUG) === 0 && varTable !== 0) {
            let typeTable: number[] | null = null;
            if (varTypeTable !== 0) {
                u = varTypeTable + 2;
                typeTable = new Array(this.readUnsignedShort(varTypeTable) * 3);
                for (let i: number = typeTable.length; i > 0;) {
                    typeTable[--i] = u + 6;
                    typeTable[--i] = this.readUnsignedShort(u + 8);
                    typeTable[--i] = this.readUnsignedShort(u);
                    u += 10;
                }
            }
            u = varTable + 2;
            for (let i: number = this.readUnsignedShort(varTable); i > 0; --i) {
                let start: number = this.readUnsignedShort(u);
                let length: number = this.readUnsignedShort(u + 2);
                let index: number = this.readUnsignedShort(u + 8);
                let vsignature: string | null = null;
                if (typeTable != null) {
                    for (let j: number = 0; j < typeTable.length; j += 3) {
                        if (typeTable[j] === start && typeTable[j + 1] === index) {
                            vsignature = this.readUTF8(typeTable[j + 2], c);
                            break;
                        }
                    }
                }
                mv.visitLocalVariable(this.readUTF8(u + 4, c), this.readUTF8(u + 6, c), vsignature, labels[start], labels[start + length], index);
                u += 10;
            }
        }
        if (tanns != null) {
            for (let i: number = 0; i < tanns.length; ++i) {
                if ((this.readByte(tanns[i]) >> 1) === (64 >> 1)) {
                    let v: number = this.readAnnotationTarget(context, tanns[i]);
                    v = this.readAnnotationValues(v + 2, c, true, mv.visitLocalVariableAnnotation(context.typeRef, context.typePath, context.start, context.end, context.index, this.readUTF8(v, c), true));
                }
            }
        }
        if (itanns != null) {
            for (let i: number = 0; i < itanns.length; ++i) {
                if ((this.readByte(itanns[i]) >> 1) === (64 >> 1)) {
                    let v: number = this.readAnnotationTarget(context, itanns[i]);
                    v = this.readAnnotationValues(v + 2, c, true, mv.visitLocalVariableAnnotation(context.typeRef, context.typePath, context.start, context.end, context.index, this.readUTF8(v, c), false));
                }
            }
        }
        while ((attributes != null)) {
            let attr: Attribute | null = attributes.next;
            attributes.next = null;
            mv.visitAttribute(attributes);
            attributes = attr;
        };
        mv.visitMaxs(maxStack, maxLocals);
    }

    /**
     * Parses a type annotation table to find the labels, and to visit the try
     * catch block annotations.
     *
     * @param u       the start offset of a type annotation table.
     * @param mv      the method visitor to be used to visit the try catch block
     * annotations.
     * @param context information about the class being parsed.
     * @param visible if the type annotation table to parse contains runtime visible
     * annotations.
     * @return the start offset of each type annotation in the parsed table.
     */
    private readTypeAnnotations(mv: MethodVisitor, context: Context, u: number, visible: boolean): number[] {
        let c: number[] = context.buffer;
        let offsets: number[] = new Array(this.readUnsignedShort(u));
        u += 2;
        for (let i: number = 0; i < offsets.length; ++i) {
            offsets[i] = u;
            let target: number = this.readInt(u);
            switch ((target >>> 24)) {
                case 0:
                case 1:
                case 22:
                    u += 2;
                    break;
                case 19:
                case 20:
                case 21:
                    u += 1;
                    break;
                case 64:
                case 65:
                    for (let j: number = this.readUnsignedShort(u + 1); j > 0; --j) {
                        let start: number = this.readUnsignedShort(u + 3);
                        let length: number = this.readUnsignedShort(u + 5);
                        this.readLabel(start, context.labels);
                        this.readLabel(start + length, context.labels);
                        u += 6;
                    }
                    u += 3;
                    break;
                case 71:
                case 72:
                case 73:
                case 74:
                case 75:
                    u += 4;
                    break;
                default:
                    u += 3;
                    break;
            }
            let pathLength: number = this.readByte(u);
            if ((target >>> 24) === 66) {
                let path: TypePath | null = pathLength === 0 ? null : new TypePath(this.buf, u);
                u += 1 + 2 * pathLength;
                u = this.readAnnotationValues(u + 2, c, true, mv.visitTryCatchAnnotation(target, path, this.readUTF8(u, c), visible));
            } else {
                u = this.readAnnotationValues(u + 3 + 2 * pathLength, c, true, null);
            }
        }
        return offsets;
    }

    /**
     * Parses the header of a type annotation to extract its target_type and
     * target_path (the result is stored in the given context), and returns the
     * start offset of the rest of the type_annotation structure (i.e. the
     * offset to the type_index field, which is followed by
     * num_element_value_pairs and then the name,value pairs).
     *
     * @param context information about the class being parsed. This is where the
     * extracted target_type and target_path must be stored.
     * @param u       the start offset of a type_annotation structure.
     * @return the start offset of the rest of the type_annotation structure.
     */
    private readAnnotationTarget(context: Context, u: number): number {
        let target: number = this.readInt(u);
        switch ((target >>> 24)) {
            case 0:
            case 1:
            case 22:
                target &= -65536;
                u += 2;
                break;
            case 19:
            case 20:
            case 21:
                target &= -16777216;
                u += 1;
                break;
            case 64:
            case 65:
                {
                    target &= -16777216;
                    let n: number = this.readUnsignedShort(u + 1);
                    context.start = new Array(n);
                    context.end = new Array(n);
                    context.index = new Array(n);
                    u += 3;
                    for (let i: number = 0; i < n; ++i) {
                        let start: number = this.readUnsignedShort(u);
                        let length: number = this.readUnsignedShort(u + 2);
                        context.start[i] = this.readLabel(start, context.labels);
                        context.end[i] = this.readLabel(start + length, context.labels);
                        context.index[i] = this.readUnsignedShort(u + 4);
                        u += 6;
                    }
                    break;
                };
            case 71:
            case 72:
            case 73:
            case 74:
            case 75:
                target &= -16776961;
                u += 4;
                break;
            default:
                target &= (target >>> 24) < 67 ? -256 : -16777216;
                u += 3;
                break;
        }
        let pathLength: number = this.readByte(u);
        context.typeRef = target;
        context.typePath = pathLength === 0 ? null : new TypePath(this.buf, u);
        return u + 1 + 2 * pathLength;
    }

    /**
     * Reads parameter annotations and makes the given visitor visit them.
     *
     * @param mv      the visitor that must visit the annotations.
     * @param context information about the class being parsed.
     * @param v       start offset in {@link #b b} of the annotations to be read.
     * @param visible <tt>true</tt> if the annotations to be read are visible at
     * runtime.
     */
    private readParameterAnnotations(mv: MethodVisitor, context: Context, v: number, visible: boolean) {
        let i: number;
        let n: number = this.buf[v++] & 255;
        let synthetics: number = Type.getArgumentTypes(context.desc).length - n;
        let av: AnnotationVisitor | null = null;
        for (i = 0; i < synthetics; ++i) {
            av = mv.visitParameterAnnotation(i, "Ljava/lang/Synthetic;", false);
            if (av != null) {
                av.visitEnd();
            }
        }
        let c: number[] = context.buffer;
        for (; i < n + synthetics; ++i) {
            let j: number = this.readUnsignedShort(v);
            v += 2;
            for (; j > 0; --j) {
                av = mv.visitParameterAnnotation(i, this.readUTF8(v, c), visible);
                v = this.readAnnotationValues(v + 2, c, true, av);
            }
        }
    }

    /**
     * Reads the values of an annotation and makes the given visitor visit them.
     *
     * @param v     the start offset in {@link #b b} of the values to be read
     * (including the unsigned short that gives the number of
     * values).
     * @param buf   buffer to be used to call {@link #readUTF8 readUTF8},
     * {@link #readClass(int, int[]) readClass} or {@link #readConst
     * readConst}.
     * @param named if the annotation values are named or not.
     * @param av    the visitor that must visit the values.
     * @return the end offset of the annotation values.
     */
    private readAnnotationValues(v: number, buf: number[], named: boolean, av: AnnotationVisitor | null): number {
        let i: number = this.readUnsignedShort(v);
        v += 2;
        if (named) {
            for (; i > 0; --i) {
                v = this.readAnnotationValue(v + 2, buf, this.readUTF8(v, buf), av);
            }
        } else {
            for (; i > 0; --i) {
                v = this.readAnnotationValue(v, buf, null, av);
            }
        }
        if (av != null) {
            av.visitEnd();
        }
        return v;
    }

    /**
     * Reads a value of an annotation and makes the given visitor visit it.
     *
     * @param v    the start offset in {@link #b b} of the value to be read
     * (<i>not including the value name constant pool index</i>).
     * @param buf  buffer to be used to call {@link #readUTF8 readUTF8},
     * {@link #readClass(int, int[]) readClass} or {@link #readConst
     * readConst}.
     * @param name the name of the value to be read.
     * @param av   the visitor that must visit the value.
     * @return the end offset of the annotation value.
     */
    private readAnnotationValue(v: number, buf: number[], name: string | null, av: AnnotationVisitor | null): number {
        name = name ?? "";
        let i: number;
        if (av == null) {
            switch ((this.buf[v] & 255)) {
                case ("e").charCodeAt(0):
                    return v + 5;
                case ("@").charCodeAt(0):
                    return this.readAnnotationValues(v + 3, buf, true, null);
                case ("[").charCodeAt(0):
                    return this.readAnnotationValues(v + 1, buf, false, null);
                default:
                    return v + 3;
            }
        }
        switch ((this.buf[v++] & 255)) {
            case ("I").charCodeAt(0):
            case ("J").charCodeAt(0):
            case ("F").charCodeAt(0):
            case ("D").charCodeAt(0):
                av.visit(name, this.readConst(this.readUnsignedShort(v), buf));
                v += 2;
                break;
            case ("B").charCodeAt(0):
                av.visit(name, (this.readInt(this.items[this.readUnsignedShort(v)]) | 0));
                v += 2;
                break;
            case ("Z").charCodeAt(0):
                av.visit(name, this.readInt(this.items[this.readUnsignedShort(v)]) === 0 ? false : true);
                v += 2;
                break;
            case ("S").charCodeAt(0):
                av.visit(name, (this.readInt(this.items[this.readUnsignedShort(v)]) | 0));
                v += 2;
                break;
            case ("C").charCodeAt(0):
                av.visit(name, String.fromCharCode(this.readInt(this.items[this.readUnsignedShort(v)])));
                v += 2;
                break;
            case ("s").charCodeAt(0):
                av.visit(name, this.readUTF8(v, buf));
                v += 2;
                break;
            case ("e").charCodeAt(0):
                av.visitEnum(name, this.readUTF8(v, buf), this.readUTF8(v + 2, buf));
                v += 4;
                break;
            case ("c").charCodeAt(0):
                av.visit(name, Type.getType(this.readUTF8(v, buf)));
                v += 2;
                break;
            case ("@").charCodeAt(0):
                v = this.readAnnotationValues(v + 2, buf, true, av.visitAnnotation(name, this.readUTF8(v, buf)));
                break;
            case ("[").charCodeAt(0):
                let size: number = this.readUnsignedShort(v);
                v += 2;
                if (size === 0) {
                    return this.readAnnotationValues(v - 2, buf, false, av.visitArray(name));
                }
                switch ((this.buf[v++] & 255)) {
                    case ("B").charCodeAt(0):
                        let bv: number[] = new Array(size);
                        for (i = 0; i < size; i++) {
                            bv[i] = (this.readInt(this.items[this.readUnsignedShort(v)]) | 0);
                            v += 3;
                        }
                        av.visit(name, bv);
                        --v;
                        break;
                    case ("Z").charCodeAt(0):
                        let zv: boolean[] = new Array(size);
                        for (i = 0; i < size; i++) {
                            zv[i] = this.readInt(this.items[this.readUnsignedShort(v)]) !== 0;
                            v += 3;
                        }
                        av.visit(name, zv);
                        --v;
                        break;
                    case ("S").charCodeAt(0):
                        let sv: number[] = new Array(size);
                        for (i = 0; i < size; i++) {
                            sv[i] = (this.readInt(this.items[this.readUnsignedShort(v)]) | 0);
                            v += 3;
                        }
                        av.visit(name, sv);
                        --v;
                        break;
                    case ("C").charCodeAt(0):
                        let cv: string[] = new Array(size);
                        for (i = 0; i < size; i++) {
                            cv[i] = String.fromCharCode(this.readInt(this.items[this.readUnsignedShort(v)]));
                            v += 3;
                        }
                        av.visit(name, cv);
                        --v;
                        break;
                    case ("I").charCodeAt(0):
                        let iv: number[] = new Array(size);
                        for (i = 0; i < size; i++) {
                            iv[i] = this.readInt(this.items[this.readUnsignedShort(v)]);
                            v += 3;
                        }
                        av.visit(name, iv);
                        --v;
                        break;
                    case ("J").charCodeAt(0):
                        let lv: Long[] = new Array(size);
                        for (i = 0; i < size; i++) {
                            lv[i] = this.readLong(this.items[this.readUnsignedShort(v)]);
                            v += 3;
                        }
                        av.visit(name, lv);
                        --v;
                        break;
                    case ("F").charCodeAt(0):
                        let fv: number[] = new Array(size);
                        for (i = 0; i < size; i++) {
                            fv[i] = intBitsToFloat(this.readInt(this.items[this.readUnsignedShort(v)]));
                            v += 3;
                        }
                        av.visit(name, fv);
                        --v;
                        break;
                    case ("D").charCodeAt(0):
                        let dv: number[] = new Array(size);
                        for (i = 0; i < size; i++) {
                            dv[i] = longBitsToDouble(this.readLong(this.items[this.readUnsignedShort(v)]));
                            v += 3;
                        }
                        av.visit(name, dv);
                        --v;
                        break;
                    default:
                        v = this.readAnnotationValues(v - 3, buf, false, av.visitArray(name));
                }
        }
        return v;
    }

    /**
     * Computes the implicit frame of the method currently being parsed (as
     * defined in the given {@link Context}) and stores it in the given context.
     *
     * @param frame information about the class being parsed.
     */
    private getImplicitFrame(frame: Context) {
        let desc: string = frame.desc;
        let locals: any[] = frame.local;
        let local: number = 0;
        if ((frame.access & Opcodes.ACC_STATIC) === 0) {
            if (("<init>" === frame.name)) {
                locals[local++] = Opcodes.UNINITIALIZED_THIS;
            } else {
                locals[local++] = this.readClass(this.header + 2, frame.buffer);
            }
        }
        let i: number = 1;
        loop: while ((true)) {
            let j: number = i;
            switch (((desc.charAt(i++)).charCodeAt(0))) {
                case ("Z").charCodeAt(0):
                case ("C").charCodeAt(0):
                case ("B").charCodeAt(0):
                case ("S").charCodeAt(0):
                case ("I").charCodeAt(0):
                    locals[local++] = Opcodes.INTEGER;
                    break;
                case ("F").charCodeAt(0):
                    locals[local++] = Opcodes.FLOAT;
                    break;
                case ("J").charCodeAt(0):
                    locals[local++] = Opcodes.LONG;
                    break;
                case ("D").charCodeAt(0):
                    locals[local++] = Opcodes.DOUBLE;
                    break;
                case ("[").charCodeAt(0):
                    while ((desc.charAt(i) === ("["))) {
                        ++i;
                    };
                    if (desc.charAt(i) === ("L")) {
                        ++i;
                        while ((desc.charAt(i) !== (";"))) {
                            ++i;
                        };
                    }
                    locals[local++] = desc.substring(j, ++i);
                    break;
                case ("L").charCodeAt(0):
                    while ((desc.charAt(i) !== (";"))) {
                        ++i;
                    };
                    locals[local++] = desc.substring(j + 1, i++);
                    break;
                default:
                    break loop;
            }
        };
        frame.localCount = local;
    }

    /**
     * Reads a stack map frame and stores the result in the given
     * {@link Context} object.
     *
     * @param stackMap the start offset of a stack map frame in the class file.
     * @param zip      if the stack map frame at stackMap is compressed or not.
     * @param unzip    if the stack map frame must be uncompressed.
     * @param frame    where the parsed stack map frame must be stored.
     * @return the offset of the first byte following the parsed frame.
     */
    private readFrame(stackMap: number, zip: boolean, unzip: boolean, frame: Context): number {
        let c: number[] = frame.buffer;
        let labels: Label[] = frame.labels;
        let tag: number;
        let delta: number;
        if (zip) {
            tag = this.buf[stackMap++] & 255;
        } else {
            tag = MethodWriter.FULL_FRAME;
            frame.offset = -1;
        }
        frame.localDiff = 0;
        if (tag < MethodWriter.SAME_LOCALS_1_STACK_ITEM_FRAME) {
            delta = tag;
            frame.mode = Opcodes.F_SAME;
            frame.stackCount = 0;
        } else if (tag < MethodWriter.RESERVED) {
            delta = tag - MethodWriter.SAME_LOCALS_1_STACK_ITEM_FRAME;
            stackMap = this.readFrameType(frame.stack, 0, stackMap, c, labels);
            frame.mode = Opcodes.F_SAME1;
            frame.stackCount = 1;
        } else {
            delta = this.readUnsignedShort(stackMap);
            stackMap += 2;
            if (tag === MethodWriter.SAME_LOCALS_1_STACK_ITEM_FRAME_EXTENDED) {
                stackMap = this.readFrameType(frame.stack, 0, stackMap, c, labels);
                frame.mode = Opcodes.F_SAME1;
                frame.stackCount = 1;
            } else if (tag >= MethodWriter.CHOP_FRAME && tag < MethodWriter.SAME_FRAME_EXTENDED) {
                frame.mode = Opcodes.F_CHOP;
                frame.localDiff = MethodWriter.SAME_FRAME_EXTENDED - tag;
                frame.localCount -= frame.localDiff;
                frame.stackCount = 0;
            } else if (tag === MethodWriter.SAME_FRAME_EXTENDED) {
                frame.mode = Opcodes.F_SAME;
                frame.stackCount = 0;
            } else if (tag < MethodWriter.FULL_FRAME) {
                let local: number = unzip ? frame.localCount : 0;
                for (let i: number = tag - MethodWriter.SAME_FRAME_EXTENDED; i > 0; i--) {
                    stackMap = this.readFrameType(frame.local, local++, stackMap, c, labels);
                }
                frame.mode = Opcodes.F_APPEND;
                frame.localDiff = tag - MethodWriter.SAME_FRAME_EXTENDED;
                frame.localCount += frame.localDiff;
                frame.stackCount = 0;
            } else {
                frame.mode = Opcodes.F_FULL;
                let n: number = this.readUnsignedShort(stackMap);
                stackMap += 2;
                frame.localDiff = n;
                frame.localCount = n;
                for (let local: number = 0; n > 0; n--) {
                    stackMap = this.readFrameType(frame.local, local++, stackMap, c, labels);
                }
                n = this.readUnsignedShort(stackMap);
                stackMap += 2;
                frame.stackCount = n;
                for (let stack: number = 0; n > 0; n--) {
                    stackMap = this.readFrameType(frame.stack, stack++, stackMap, c, labels);
                }
            }
        }
        frame.offset += delta + 1;
        this.readLabel(frame.offset, labels);
        return stackMap;
    }

    /**
     * Reads a stack map frame type and stores it at the given index in the
     * given array.
     *
     * @param frame  the array where the parsed type must be stored.
     * @param index  the index in 'frame' where the parsed type must be stored.
     * @param v      the start offset of the stack map frame type to read.
     * @param buf    a buffer to read strings.
     * @param labels the labels of the method currently being parsed, indexed by
     * their offset. If the parsed type is an Uninitialized type, a
     * new label for the corresponding NEW instruction is stored in
     * this array if it does not already exist.
     * @return the offset of the first byte after the parsed type.
     */
    private readFrameType(frame: any[], index: number, v: number, buf: number[], labels: Label[]): number {
        let type: number = this.buf[v++] & 255;
        switch ((type)) {
            case 0:
                frame[index] = Opcodes.TOP;
                break;
            case 1:
                frame[index] = Opcodes.INTEGER;
                break;
            case 2:
                frame[index] = Opcodes.FLOAT;
                break;
            case 3:
                frame[index] = Opcodes.DOUBLE;
                break;
            case 4:
                frame[index] = Opcodes.LONG;
                break;
            case 5:
                frame[index] = Opcodes.NULL;
                break;
            case 6:
                frame[index] = Opcodes.UNINITIALIZED_THIS;
                break;
            case 7:
                frame[index] = this.readClass(v, buf);
                v += 2;
                break;
            default:
                frame[index] = this.readLabel(this.readUnsignedShort(v), labels);
                v += 2;
        }
        return v;
    }

    /**
     * Returns the label corresponding to the given offset. The default
     * implementation of this method creates a label for the given offset if it
     * has not been already created.
     *
     * @param offset a bytecode offset in a method.
     * @param labels the already created labels, indexed by their offset. If a
     * label already exists for offset this method must not create a
     * new one. Otherwise it must store the new label in this array.
     * @return a non null Label, which must be equal to labels[offset].
     */
    readLabel(offset: number, labels: Label[]): Label {
        if (labels[offset] == null) {
            labels[offset] = new Label();
        }
        return labels[offset];
    }

    /**
     * Returns the start index of the attribute_info structure of this class.
     *
     * @return the start index of the attribute_info structure of this class.
     */
    private getAttributes(): number {
        let u: number = this.header + 8 + this.readUnsignedShort(this.header + 6) * 2;
        for (let i: number = this.readUnsignedShort(u); i > 0; --i) {
            for (let j: number = this.readUnsignedShort(u + 8); j > 0; --j) {
                u += 6 + this.readInt(u + 12);
            }
            u += 8;
        }
        u += 2;
        for (let i: number = this.readUnsignedShort(u); i > 0; --i) {
            for (let j: number = this.readUnsignedShort(u + 8); j > 0; --j) {
                u += 6 + this.readInt(u + 12);
            }
            u += 8;
        }
        return u + 2;
    }

    /**
     * Reads an attribute in {@link #b b}.
     *
     * @param attrs   prototypes of the attributes that must be parsed during the
     * visit of the class. Any attribute whose type is not equal to
     * the type of one the prototypes is ignored (i.e. an empty
     * {@link Attribute} instance is returned).
     * @param type    the type of the attribute.
     * @param off     index of the first byte of the attribute's content in
     * {@link #b b}. The 6 attribute header bytes, containing the
     * type and the length of the attribute, are not taken into
     * account here (they have already been read).
     * @param len     the length of the attribute's content.
     * @param buf     buffer to be used to call {@link #readUTF8 readUTF8},
     * {@link #readClass(int, int[]) readClass} or {@link #readConst
     * readConst}.
     * @param codeOff index of the first byte of code's attribute content in
     * {@link #b b}, or -1 if the attribute to be read is not a code
     * attribute. The 6 attribute header bytes, containing the type
     * and the length of the attribute, are not taken into account
     * here.
     * @param labels  the labels of the method's code, or <tt>null</tt> if the
     * attribute to be read is not a code attribute.
     * @return the attribute that has been read, or <tt>null</tt> to skip this
     * attribute.
     */
    private readAttribute(attrs: Attribute[], type: string | null, off: number, len: number, buf: number[], codeOff: number, labels: Label[] | null): Attribute {
        for (let i: number = 0; i < attrs.length; ++i) {
            if ((attrs[i].type === type)) {
                return attrs[i].read(this, off, len, buf, codeOff, labels);
            }
        }
        return new Attribute(type).read(this, off, len, null, -1, null);
    }

    /**
     * Returns the number of constant pool items in {@link #b b}.
     *
     * @return the number of constant pool items in {@link #b b}.
     */
    public getItemCount(): number {
        return this.items.length;
    }

    /**
     * Returns the start index of the constant pool item in {@link #b b}, plus
     * one. <i>This method is intended for {@link Attribute} sub classes, and is
     * normally not needed by class generators or adapters.</i>
     *
     * @param item the index a constant pool item.
     * @return the start index of the constant pool item in {@link #b b}, plus
     * one.
     */
    public getItem(item: number): number {
        return this.items[item];
    }

    /**
     * Returns the maximum length of the strings contained in the constant pool
     * of the class.
     *
     * @return the maximum length of the strings contained in the constant pool
     * of the class.
     */
    public getMaxStringLength(): number {
        return this.maxStringLength;
    }

    /**
     * Reads a byte value in {@link #b b}. <i>This method is intended for
     * {@link Attribute} sub classes, and is normally not needed by class
     * generators or adapters.</i>
     *
     * @param index the start index of the value to be read in {@link #b b}.
     * @return the read value.
     */
    public readByte(index: number): number {
        // return this.buf.readInt8(index);
        return this.buf[index] & 255;
    }

    /**
     * Reads an unsigned short value in {@link #b b}. <i>This method is intended
     * for {@link Attribute} sub classes, and is normally not needed by class
     * generators or adapters.</i>
     *
     * @param index the start index of the value to be read in {@link #b b}.
     * @return the read value.
     */
    public readUnsignedShort(index: number): number {
        // return this.buf.readUInt16BE(index);
        let b = this.buf;
        return ((b[index] & 255) << 8) | (b[index + 1] & 255);
    }

    /**
     * Reads a signed short value in {@link #b b}. <i>This method is intended
     * for {@link Attribute} sub classes, and is normally not needed by class
     * generators or adapters.</i>
     *
     * @param index the start index of the value to be read in {@link #b b}.
     * @return the read value.
     */
    public readShort(index: number): number {
        let b = this.buf;
        return (b[index] << 8) | (b[index + 1]);
    }

    /**
     * Reads a signed int value in {@link #b b}. <i>This method is intended for
     * {@link Attribute} sub classes, and is normally not needed by class
     * generators or adapters.</i>
     *
     * @param index the start index of the value to be read in {@link #b b}.
     * @return the read value.
     */
    public readInt(index: number): number {
        // return this.buf.readInt32BE(index);
        let b = this.buf;
        return ((b[index] & 255) << 24) | ((b[index + 1] & 255) << 16) | ((b[index + 2] & 255) << 8) | (b[index + 3]);
    }

    /**
     * Reads a signed long value in {@link #b b}. <i>This method is intended for
     * {@link Attribute} sub classes, and is normally not needed by class
     * generators or adapters.</i>
     *
     * @param index the start index of the value to be read in {@link #b b}.
     * @return the read value.
     */
    public readLong(index: number): Long {
        let l1: number = this.readInt(index);
        let l0: number = this.readInt(index + 4) & 4294967295;
        return new Long(l1, l0);
    }

    /**
     * Reads an UTF8 string constant pool item in {@link #b b}. <i>This method
     * is intended for {@link Attribute} sub classes, and is normally not needed
     * by class generators or adapters.</i>
     *
     * @param index the start index of an unsigned short value in {@link #b b},
     * whose value is the index of an UTF8 constant pool item.
     * @param buf   buffer to be used to read the item. This buffer must be
     * sufficiently large. It is not automatically resized.
     * @return the String corresponding to the specified UTF8 item.
     */
    public readUTF8(index: number, buf: number[]): string {
        let item: number = this.readUnsignedShort(index);
        if (index === 0 || item === 0) { return ""; }
        let s: string = this.strings[item];
        if (s != null) { return s; }
        index = this.items[item];
        this.strings[item] = this.readUTF(index + 2, this.readUnsignedShort(index), buf);
        return this.strings[item];
    }

    /**
     * Reads UTF8 string in {@link #b b}.
     *
     * @param index  start offset of the UTF8 string to be read.
     * @param utfLen length of the UTF8 string to be read.
     * @param buf    buffer to be used to read the string. This buffer must be
     * sufficiently large. It is not automatically resized.
     * @return the String corresponding to the specified UTF8 string.
     */
    private readUTF(index: number, utfLen: number, buf: number[]): string {
        let endIndex: number = index + utfLen;
        let b: Uint8Array = this.buf;
        let strLen: number = 0;
        let c: number;
        let st: number = 0;
        let cc: number = 0;
        while (index < endIndex) {
            c = b[index++];
            switch (st) {
                case 0:
                    c = c & 255;
                    if (c < 128) {
                        buf[strLen++] = c;
                    } else if (c < 224 && c > 191) {
                        cc = (c & 31);
                        st = 1;
                    } else {
                        cc = (c & 15);
                        st = 2;
                    }
                    break;
                case 1:
                    buf[strLen++] = ((cc << 6) | (c & 63));
                    st = 0;
                    break;
                case 2:
                    cc = ((cc << 6) | (c & 63));
                    st = 1;
                    break;
            }
        };
        return buf.slice(0, strLen).map((c) => String.fromCharCode(c)).join("");
    }

    /**
     * Reads a class constant pool item in {@link #b b}. <i>This method is
     * intended for {@link Attribute} sub classes, and is normally not needed by
     * class generators or adapters.</i>
     *
     * @param index the start index of an unsigned short value in {@link #b b},
     * whose value is the index of a class constant pool item.
     * @param buf   buffer to be used to read the item. This buffer must be
     * sufficiently large. It is not automatically resized.
     * @return the String corresponding to the specified class item.
     */
    public readClass(index: number, buf: number[]): string {
        return this.readUTF8(this.items[this.readUnsignedShort(index)], buf) ?? "";
    }

    /**
     * Reads a numeric or string constant pool item in {@link #b b}. <i>This
     * method is intended for {@link Attribute} sub classes, and is normally not
     * needed by class generators or adapters.</i>
     *
     * @param item the index of a constant pool item.
     * @param buf  buffer to be used to read the item. This buffer must be
     * sufficiently large. It is not automatically resized.
     * @return the {@link Integer}, {@link Float}, {@link Long}, {@link Double},
     * {@link String}, {@link Type} or {@link Handle} corresponding to
     * the given constant pool item.
     */
    public readConst(item: number, buf: number[]): any {
        let index: number = this.items[item];
        switch ((this.buf[index - 1])) {
            case ClassWriter.INT:
                return this.readInt(index);
            case ClassWriter.FLOAT:
                return intBitsToFloat(this.readInt(index));
            case ClassWriter.LONG:
                return this.readLong(index);
            case ClassWriter.DOUBLE:
                return longBitsToDouble(this.readLong(index));
            case ClassWriter.CLASS:
                return Type.getObjectType(this.readUTF8(index, buf));
            case ClassWriter.STR:
                return this.readUTF8(index, buf);
            case ClassWriter.MTYPE:
                return Type.getMethodType(this.readUTF8(index, buf));
            default:
                let tag: number = this.readByte(index);
                let items: number[] = this.items;
                let cpIndex: number = items[this.readUnsignedShort(index + 1)];
                let itf: boolean = this.buf[cpIndex - 1] === ClassWriter.IMETH;
                let owner: string = this.readClass(cpIndex, buf);
                cpIndex = items[this.readUnsignedShort(cpIndex + 2)];
                let name: string = this.readUTF8(cpIndex, buf);
                let desc: string = this.readUTF8(cpIndex + 2, buf);
                return new Handle(tag, owner, name, desc, itf);
        }
    }
}

