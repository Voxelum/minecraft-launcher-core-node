# Interface BlockModel

The block model json format
## 🏷️ Properties

### ambientocclusion <Badge type="info" text="optional" />

```ts
ambientocclusion: boolean
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/resourcepack/format.ts#L30" target="_blank" rel="noreferrer">packages/resourcepack/format.ts:30</a>
</p>


### display <Badge type="info" text="optional" />

```ts
display: Display
```
Holds the different places where item models are displayed.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/resourcepack/format.ts#L34" target="_blank" rel="noreferrer">packages/resourcepack/format.ts:34</a>
</p>


### elements <Badge type="info" text="optional" />

```ts
elements: Element[]
```
Contains all the elements of the model. they can only have cubic forms. If both "parent" and "elements" are set, the "elements" tag overrides the "elements" tag from the previous model.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/resourcepack/format.ts#L49" target="_blank" rel="noreferrer">packages/resourcepack/format.ts:49</a>
</p>


### overrides <Badge type="info" text="optional" />

```ts
overrides: Object[]
```
Determines cases which a different model should be used based on item tags.
All cases are evaluated in order from top to bottom and last predicate that mathches will override.
However, overrides are ignored if it has been already overriden once, for example this avoids recursion on overriding to the same model.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/resourcepack/format.ts#L55" target="_blank" rel="noreferrer">packages/resourcepack/format.ts:55</a>
</p>


### parent <Badge type="info" text="optional" />

```ts
parent: string
```
For Block:

Loads a different model from the given path, starting in assets/minecraft/models. If both "parent" and "elements" are set, the "elements" tag overrides the "elements" tag from the previous model.
Can be set to "builtin/generated" to use a model that is created out of the specified icon. Note that only the first layer is supported, and rotation can only be achieved using block states files.

For Item:

Loads a different model from the given path, starting in assets/minecraft/models. If both "parent" and "elements" are set, the "elements" tag overrides the "elements" tag from the previous model.
Can be set to "builtin/generated" to use a model that is created out of the specified icon.
Can be set to "builtin/entity" to load a model from an entity file. As you can not specify the entity, this does not work for all items (only for chests, ender chests, mob heads, shields and banners).
Needs to be set to "builtin/compass" or "builtin/clock" for the compass and the clock.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/resourcepack/format.ts#L28" target="_blank" rel="noreferrer">packages/resourcepack/format.ts:28</a>
</p>


### textures <Badge type="info" text="optional" />

```ts
textures: Object
```
Holds the textures of the model. Each texture starts in assets/minecraft/textures or can be another texture variable.
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/resourcepack/format.ts#L38" target="_blank" rel="noreferrer">packages/resourcepack/format.ts:38</a>
</p>


