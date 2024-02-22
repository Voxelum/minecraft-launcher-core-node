# Class ClassReader

## 🏭 Constructors

### constructor <Badge type="tip" text="public" />

```ts
new ClassReader(buffer: Uint8Array, classFileOffset: number= 0, len: number= buffer.length): ClassReader
```
Constructs a new [ClassReader](ClassReader) object.
#### Parameters

- **buffer**: `Uint8Array`
- **classFileOffset**: `number`
- **len**: `number`
the length of the class data.
#### Return Type

- `ClassReader`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L178" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:178</a>
</p>


## 🏷️ Properties

### buf <Badge type="tip" text="public" />

```ts
buf: Uint8Array
```
The class to be parsed. &lt;i&gt;The content of this array must not be
modified. This field is intended for [Attribute](Attribute) sub classes, and
is normally not needed by class generators or adapters.&lt;/i&gt;
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L141" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:141</a>
</p>


### header <Badge type="tip" text="public" />

```ts
header: number
```
Start index of the class header information (access, name...) in
[#b b](#_xmcl_asm).
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L169" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:169</a>
</p>


### items <Badge type="danger" text="private" />

```ts
items: number[]
```
The start index of each constant pool item in [#b b](#_xmcl_asm), plus one. The
one byte offset skips the constant pool item tag that indicates its type.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L147" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:147</a>
</p>


### maxStringLength <Badge type="danger" text="private" />

```ts
maxStringLength: number
```
Maximum length of the strings contained in the constant pool of the
class.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L163" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:163</a>
</p>


### strings <Badge type="danger" text="private" />

```ts
strings: string[]
```
The String objects corresponding to the CONSTANT_Utf8 items. This cache
avoids multiple parsing of a given CONSTANT_Utf8 constant pool item,
which GREATLY improves performances (by a factor 2 to 3). This caching
strategy could be extended to all constant pool items, but its benefit
would not be so great for these items (because they are much less
expensive to parse than CONSTANT_Utf8 items).
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L157" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:157</a>
</p>


### ANNOTATIONS <Badge type="warning" text="static" />

```ts
ANNOTATIONS: boolean = true
```
True to enable annotations support.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L68" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:68</a>
</p>


### EXPAND_ASM_INSNS <Badge type="warning" text="static" />

```ts
EXPAND_ASM_INSNS: number = 256
```
Flag to expand the ASM pseudo instructions into an equivalent sequence of
standard bytecode instructions. When resolving a forward jump it may
happen that the signed 2 bytes offset reserved for it is not sufficient
to store the bytecode offset. In this case the jump instruction is
replaced with a temporary ASM pseudo instruction using an unsigned 2
bytes offset (see Label#resolve). This internal flag is used to re-read
classes containing such instructions, in order to replace them with
standard instructions. In addition, when this flag is used, GOTO_W and
JSR_W are &lt;i&gt;not&lt;/i&gt; converted into GOTO and JSR, to make sure that
infinite loops where a GOTO_W is replaced with a GOTO in ClassReader and
converted back to a GOTO_W in ClassWriter cannot occur.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L134" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:134</a>
</p>


### EXPAND_FRAMES <Badge type="warning" text="static" /> <Badge type="tip" text="public" />

```ts
EXPAND_FRAMES: number = 8
```
Flag to expand the stack map frames. By default stack map frames are
visited in their original format (i.e. "expanded" for classes whose
version is less than V1_6, and "compressed" for the other classes). If
this flag is set, stack map frames are always visited in expanded format
(this option adds a decompression/recompression step in ClassReader and
ClassWriter which degrades performances quite a lot).
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L119" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:119</a>
</p>


### FRAMES <Badge type="warning" text="static" />

```ts
FRAMES: boolean = true
```
True to enable stack map frames support.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L73" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:73</a>
</p>


### RESIZE <Badge type="warning" text="static" />

```ts
RESIZE: boolean = true
```
True to enable JSR_W and GOTO_W support.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L83" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:83</a>
</p>


### SIGNATURES <Badge type="warning" text="static" />

```ts
SIGNATURES: boolean = true
```
True to enable signatures support.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L63" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:63</a>
</p>


### SKIP_CODE <Badge type="warning" text="static" /> <Badge type="tip" text="public" />

```ts
SKIP_CODE: number = 1
```
Flag to skip method code. If this class is set &lt;code&gt;CODE&lt;/code&gt;
attribute won't be visited. This can be used, for example, to retrieve
annotations for methods and method parameters.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L90" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:90</a>
</p>


### SKIP_DEBUG <Badge type="warning" text="static" /> <Badge type="tip" text="public" />

```ts
SKIP_DEBUG: number = 2
```
Flag to skip the debug information in the class. If this flag is set the
debug information of the class is not visited, i.e. the
[visitLocalVariable](#visitLocalVariable) and
[visitLineNumber](#visitLineNumber) methods will not be
called.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L99" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:99</a>
</p>


### SKIP_FRAMES <Badge type="warning" text="static" /> <Badge type="tip" text="public" />

```ts
SKIP_FRAMES: number = 4
```
Flag to skip the stack map frames in the class. If this flag is set the
stack map frames of the class is not visited, i.e. the
[visitFrame](#visitFrame) method will not be called.
This flag is useful when the [ClassWriter#COMPUTE_FRAMES] option is
used: it avoids visiting frames that will be ignored and recomputed from
scratch in the class writer.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L109" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:109</a>
</p>


### WRITER <Badge type="warning" text="static" />

```ts
WRITER: boolean = true
```
True to enable bytecode writing support.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L78" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:78</a>
</p>


## 🔧 Methods

### accept <Badge type="tip" text="public" />

```ts
accept(classVisitor: ClassVisitor, attrs: Attribute[]= [], flags: number= 0): void
```
Makes the given visitor visit the Java class of this [ClassReader](ClassReader).
This class is the one specified in the constructor (see
[#ClassReader(byte[]) ClassReader](#_xmcl_asm)).
#### Parameters

- **classVisitor**: `ClassVisitor`
the visitor that must visit this class.
- **attrs**: `Attribute[]`
prototypes of the attributes that must be parsed during the
visit of the class. Any attribute whose type is not equal to
the type of one the prototypes will not be parsed: its byte
array value will be passed unchanged to the ClassWriter.
&lt;i&gt;This may corrupt it if this value contains references to
the constant pool, or has syntactic or semantic links with a
class element that has been transformed by a class adapter
between the reader and the writer&lt;/i&gt;.
- **flags**: `number`
option flags that can be used to modify the default behavior
of this class. See [#SKIP_DEBUG](#_xmcl_asm), [#EXPAND_FRAMES](#_xmcl_asm)
, [#SKIP_FRAMES](#_xmcl_asm), [#SKIP_CODE](#_xmcl_asm).
#### Return Type

- `void`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L301" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:301</a>
</p>


### getAccess <Badge type="tip" text="public" />

```ts
getAccess(): number
```
Returns the class's access flags (see [Opcodes](Opcodes)). This value may
not reflect Deprecated and Synthetic flags when bytecode is before 1.5
and those flags are represented by attributes.
#### Return Type

- `number`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L233" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:233</a>
</p>


### getAttributes <Badge type="danger" text="private" />

```ts
getAttributes(): number
```
Returns the start index of the attribute_info structure of this class.
#### Return Type

- `number`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L1689" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:1689</a>
</p>


### getClassName <Badge type="tip" text="public" />

```ts
getClassName(): string
```
Returns the internal name of the class (see
[Type#getInternalName() getInternalName]).
#### Return Type

- `string`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L244" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:244</a>
</p>


### getImplicitFrame <Badge type="danger" text="private" />

```ts
getImplicitFrame(frame: Context): void
```
Computes the implicit frame of the method currently being parsed (as
defined in the given [Context]) and stores it in the given context.
#### Parameters

- **frame**: `Context`
information about the class being parsed.
#### Return Type

- `void`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L1483" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:1483</a>
</p>


### getInterfaces <Badge type="tip" text="public" />

```ts
getInterfaces(): string[]
```
Returns the internal names of the class's interfaces (see
[Type#getInternalName() getInternalName]).
#### Return Type

- `string[]`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L269" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:269</a>
</p>


### getItem <Badge type="tip" text="public" />

```ts
getItem(item: number): number
```
Returns the start index of the constant pool item in [#b b](#_xmcl_asm), plus
one. &lt;i&gt;This method is intended for [Attribute](Attribute) sub classes, and is
normally not needed by class generators or adapters.&lt;/i&gt;
#### Parameters

- **item**: `number`
the index a constant pool item.
#### Return Type

- `number`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L1760" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:1760</a>
</p>


### getItemCount <Badge type="tip" text="public" />

```ts
getItemCount(): number
```
Returns the number of constant pool items in [#b b](#_xmcl_asm).
#### Return Type

- `number`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L1747" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:1747</a>
</p>


### getMaxStringLength <Badge type="tip" text="public" />

```ts
getMaxStringLength(): number
```
Returns the maximum length of the strings contained in the constant pool
of the class.
#### Return Type

- `number`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L1771" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:1771</a>
</p>


### getSuperName <Badge type="tip" text="public" />

```ts
getSuperName(): string
```
Returns the internal of name of the super class (see
[Type#getInternalName() getInternalName]). For interfaces, the
super class is [Object].
#### Return Type

- `string`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L257" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:257</a>
</p>


### readAnnotationTarget <Badge type="danger" text="private" />

```ts
readAnnotationTarget(context: Context, u: number): number
```
Parses the header of a type annotation to extract its target_type and
target_path (the result is stored in the given context), and returns the
start offset of the rest of the type_annotation structure (i.e. the
offset to the type_index field, which is followed by
num_element_value_pairs and then the name,value pairs).
#### Parameters

- **context**: `Context`
information about the class being parsed. This is where the
extracted target_type and target_path must be stored.
- **u**: `number`
the start offset of a type_annotation structure.
#### Return Type

- `number`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L1210" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:1210</a>
</p>


### readAnnotationValue <Badge type="danger" text="private" />

```ts
readAnnotationValue(v: number, buf: number[], name: null | string, av: null | AnnotationVisitor): number
```
Reads a value of an annotation and makes the given visitor visit it.
#### Parameters

- **v**: `number`
the start offset in [#b b](#_xmcl_asm) of the value to be read
(&lt;i&gt;not including the value name constant pool index&lt;/i&gt;).
- **buf**: `number[]`
buffer to be used to call [#readUTF8 readUTF8](#_xmcl_asm),
[#readClass(int, int[]) readClass](#_xmcl_asm) or [#readConst readConst](#_xmcl_asm).
- **name**: `null | string`
the name of the value to be read.
- **av**: `null | AnnotationVisitor`
the visitor that must visit the value.
#### Return Type

- `number`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L1337" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:1337</a>
</p>


### readAnnotationValues <Badge type="danger" text="private" />

```ts
readAnnotationValues(v: number, buf: number[], named: boolean, av: null | AnnotationVisitor): number
```
Reads the values of an annotation and makes the given visitor visit them.
#### Parameters

- **v**: `number`
the start offset in [#b b](#_xmcl_asm) of the values to be read
(including the unsigned short that gives the number of
values).
- **buf**: `number[]`
buffer to be used to call [#readUTF8 readUTF8](#_xmcl_asm),
[#readClass(int, int[]) readClass](#_xmcl_asm) or [#readConst readConst](#_xmcl_asm).
- **named**: `boolean`
if the annotation values are named or not.
- **av**: `null | AnnotationVisitor`
the visitor that must visit the values.
#### Return Type

- `number`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L1307" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:1307</a>
</p>


### readAttribute <Badge type="danger" text="private" />

```ts
readAttribute(attrs: Attribute[], type: null | string, off: number, len: number, buf: number[], codeOff: number, labels: null | Label[]): Attribute
```
Reads an attribute in [#b b](#_xmcl_asm).
#### Parameters

- **attrs**: `Attribute[]`
prototypes of the attributes that must be parsed during the
visit of the class. Any attribute whose type is not equal to
the type of one the prototypes is ignored (i.e. an empty
[Attribute](Attribute) instance is returned).
- **type**: `null | string`
the type of the attribute.
- **off**: `number`
index of the first byte of the attribute's content in
[#b b](#_xmcl_asm). The 6 attribute header bytes, containing the
type and the length of the attribute, are not taken into
account here (they have already been read).
- **len**: `number`
the length of the attribute's content.
- **buf**: `number[]`
buffer to be used to call [#readUTF8 readUTF8](#_xmcl_asm),
[#readClass(int, int[]) readClass](#_xmcl_asm) or [#readConst readConst](#_xmcl_asm).
- **codeOff**: `number`
index of the first byte of code's attribute content in
[#b b](#_xmcl_asm), or -1 if the attribute to be read is not a code
attribute. The 6 attribute header bytes, containing the type
and the length of the attribute, are not taken into account
here.
- **labels**: `null | Label[]`
the labels of the method's code, or &lt;tt&gt;null&lt;/tt&gt; if the
attribute to be read is not a code attribute.
#### Return Type

- `Attribute`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L1733" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:1733</a>
</p>


### readByte <Badge type="tip" text="public" />

```ts
readByte(index: number): number
```
Reads a byte value in [#b b](#_xmcl_asm). &lt;i&gt;This method is intended for
[Attribute](Attribute) sub classes, and is normally not needed by class
generators or adapters.&lt;/i&gt;
#### Parameters

- **index**: `number`
the start index of the value to be read in [#b b](#_xmcl_asm).
#### Return Type

- `number`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L1783" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:1783</a>
</p>


### readClass <Badge type="tip" text="public" />

```ts
readClass(index: number, buf: number[]): string
```
Reads a class constant pool item in [#b b](#_xmcl_asm). &lt;i&gt;This method is
intended for [Attribute](Attribute) sub classes, and is normally not needed by
class generators or adapters.&lt;/i&gt;
#### Parameters

- **index**: `number`
the start index of an unsigned short value in [#b b](#_xmcl_asm),
whose value is the index of a class constant pool item.
- **buf**: `number[]`
buffer to be used to read the item. This buffer must be
sufficiently large. It is not automatically resized.
#### Return Type

- `string`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L1919" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:1919</a>
</p>


### readCode <Badge type="danger" text="private" />

```ts
readCode(mv: MethodVisitor, context: Context, u: number): void
```
Reads the bytecode of a method and makes the given visitor visit it.
#### Parameters

- **mv**: `MethodVisitor`
the visitor that must visit the method's code.
- **context**: `Context`
information about the class being parsed.
- **u**: `number`
the start offset of the code attribute in the class file.
#### Return Type

- `void`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L674" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:674</a>
</p>


### readConst <Badge type="tip" text="public" />

```ts
readConst(item: number, buf: number[]): any
```
Reads a numeric or string constant pool item in [#b b](#_xmcl_asm). &lt;i&gt;This
method is intended for [Attribute](Attribute) sub classes, and is normally not
needed by class generators or adapters.&lt;/i&gt;
#### Parameters

- **item**: `number`
the index of a constant pool item.
- **buf**: `number[]`
buffer to be used to read the item. This buffer must be
sufficiently large. It is not automatically resized.
#### Return Type

- `any`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L1935" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:1935</a>
</p>


### readField <Badge type="danger" text="private" />

```ts
readField(classVisitor: ClassVisitor, context: Context, u: number): number
```
Reads a field and makes the given visitor visit it.
#### Parameters

- **classVisitor**: `ClassVisitor`
the visitor that must visit the field.
- **context**: `Context`
information about the class being parsed.
- **u**: `number`
the start offset of the field in the class file.
#### Return Type

- `number`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L434" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:434</a>
</p>


### readFrame <Badge type="danger" text="private" />

```ts
readFrame(stackMap: number, zip: boolean, unzip: boolean, frame: Context): number
```
Reads a stack map frame and stores the result in the given
[Context] object.
#### Parameters

- **stackMap**: `number`
the start offset of a stack map frame in the class file.
- **zip**: `boolean`
if the stack map frame at stackMap is compressed or not.
- **unzip**: `boolean`
if the stack map frame must be uncompressed.
- **frame**: `Context`
where the parsed stack map frame must be stored.
#### Return Type

- `number`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L1550" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:1550</a>
</p>


### readFrameType <Badge type="danger" text="private" />

```ts
readFrameType(frame: any[], index: number, v: number, buf: number[], labels: Label[]): number
```
Reads a stack map frame type and stores it at the given index in the
given array.
#### Parameters

- **frame**: `any[]`
the array where the parsed type must be stored.
- **index**: `number`
the index in 'frame' where the parsed type must be stored.
- **v**: `number`
the start offset of the stack map frame type to read.
- **buf**: `number[]`
a buffer to read strings.
- **labels**: `Label[]`
the labels of the method currently being parsed, indexed by
their offset. If the parsed type is an Uninitialized type, a
new label for the corresponding NEW instruction is stored in
this array if it does not already exist.
#### Return Type

- `number`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L1631" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:1631</a>
</p>


### readInt <Badge type="tip" text="public" />

```ts
readInt(index: number): number
```
Reads a signed int value in [#b b](#_xmcl_asm). &lt;i&gt;This method is intended for
[Attribute](Attribute) sub classes, and is normally not needed by class
generators or adapters.&lt;/i&gt;
#### Parameters

- **index**: `number`
the start index of the value to be read in [#b b](#_xmcl_asm).
#### Return Type

- `number`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L1823" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:1823</a>
</p>


### readLabel

```ts
readLabel(offset: number, labels: Label[]): Label
```
Returns the label corresponding to the given offset. The default
implementation of this method creates a label for the given offset if it
has not been already created.
#### Parameters

- **offset**: `number`
a bytecode offset in a method.
- **labels**: `Label[]`
the already created labels, indexed by their offset. If a
label already exists for offset this method must not create a
new one. Otherwise it must store the new label in this array.
#### Return Type

- `Label`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L1677" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:1677</a>
</p>


### readLong <Badge type="tip" text="public" />

```ts
readLong(index: number): bigint
```
Reads a signed long value in [#b b](#_xmcl_asm). &lt;i&gt;This method is intended for
[Attribute](Attribute) sub classes, and is normally not needed by class
generators or adapters.&lt;/i&gt;
#### Parameters

- **index**: `number`
the start index of the value to be read in [#b b](#_xmcl_asm).
#### Return Type

- `bigint`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L1837" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:1837</a>
</p>


### readMethod <Badge type="danger" text="private" />

```ts
readMethod(classVisitor: ClassVisitor, context: Context, u: number): number
```
Reads a method and makes the given visitor visit it.
#### Parameters

- **classVisitor**: `ClassVisitor`
the visitor that must visit the method.
- **context**: `Context`
information about the class being parsed.
- **u**: `number`
the start offset of the method in the class file.
#### Return Type

- `number`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L521" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:521</a>
</p>


### readParameterAnnotations <Badge type="danger" text="private" />

```ts
readParameterAnnotations(mv: MethodVisitor, context: Context, v: number, visible: boolean): void
```
Reads parameter annotations and makes the given visitor visit them.
#### Parameters

- **mv**: `MethodVisitor`
the visitor that must visit the annotations.
- **context**: `Context`
information about the class being parsed.
- **v**: `number`
start offset in [#b b](#_xmcl_asm) of the annotations to be read.
- **visible**: `boolean`
&lt;tt&gt;true&lt;/tt&gt; if the annotations to be read are visible at
runtime.
#### Return Type

- `void`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L1272" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:1272</a>
</p>


### readShort <Badge type="tip" text="public" />

```ts
readShort(index: number): number
```
Reads a signed short value in [#b b](#_xmcl_asm). &lt;i&gt;This method is intended
for [Attribute](Attribute) sub classes, and is normally not needed by class
generators or adapters.&lt;/i&gt;
#### Parameters

- **index**: `number`
the start index of the value to be read in [#b b](#_xmcl_asm).
#### Return Type

- `number`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L1810" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:1810</a>
</p>


### readTypeAnnotations <Badge type="danger" text="private" />

```ts
readTypeAnnotations(mv: MethodVisitor, context: Context, u: number, visible: boolean): number[]
```
Parses a type annotation table to find the labels, and to visit the try
catch block annotations.
#### Parameters

- **mv**: `MethodVisitor`
the method visitor to be used to visit the try catch block
annotations.
- **context**: `Context`
information about the class being parsed.
- **u**: `number`
the start offset of a type annotation table.
- **visible**: `boolean`
if the type annotation table to parse contains runtime visible
annotations.
#### Return Type

- `number[]`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L1146" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:1146</a>
</p>


### readUTF <Badge type="danger" text="private" />

```ts
readUTF(index: number, utfLen: number, buf: number[]): string
```
Reads UTF8 string in [#b b](#_xmcl_asm).
#### Parameters

- **index**: `number`
start offset of the UTF8 string to be read.
- **utfLen**: `number`
length of the UTF8 string to be read.
- **buf**: `number[]`
buffer to be used to read the string. This buffer must be
sufficiently large. It is not automatically resized.
#### Return Type

- `string`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L1873" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:1873</a>
</p>


### readUTF8 <Badge type="tip" text="public" />

```ts
readUTF8(index: number, buf: number[]): string
```
Reads an UTF8 string constant pool item in [#b b](#_xmcl_asm). &lt;i&gt;This method
is intended for [Attribute](Attribute) sub classes, and is normally not needed
by class generators or adapters.&lt;/i&gt;
#### Parameters

- **index**: `number`
the start index of an unsigned short value in [#b b](#_xmcl_asm),
whose value is the index of an UTF8 constant pool item.
- **buf**: `number[]`
buffer to be used to read the item. This buffer must be
sufficiently large. It is not automatically resized.
#### Return Type

- `string`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L1854" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:1854</a>
</p>


### readUnsignedShort <Badge type="tip" text="public" />

```ts
readUnsignedShort(index: number): number
```
Reads an unsigned short value in [#b b](#_xmcl_asm). &lt;i&gt;This method is intended
for [Attribute](Attribute) sub classes, and is normally not needed by class
generators or adapters.&lt;/i&gt;
#### Parameters

- **index**: `number`
the start index of the value to be read in [#b b](#_xmcl_asm).
#### Return Type

- `number`

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/asm/libs/ClassReader.ts#L1796" target="_blank" rel="noreferrer">packages/asm/libs/ClassReader.ts:1796</a>
</p>


