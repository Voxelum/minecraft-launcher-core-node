# Interface FabricInstallOptions

Install the fabric to the client. Notice that this will only install the json.
You need to call ``Installer.installDependencies`` to get a full client.
## 🏷️ Properties

### inheritsFrom <Badge type="info" text="optional" />

```ts
inheritsFrom: string
```
When you want to install a version over another one.

Like, you want to install liteloader over a forge version.
You should fill this with that forge version id.
*Inherited from: `InstallOptions.inheritsFrom`*

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/utils.ts#L107" target="_blank" rel="noreferrer">packages/installer/utils.ts:107</a>
</p>


### side <Badge type="info" text="optional" />

```ts
side: "server" | "client"
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/fabric.ts#L138" target="_blank" rel="noreferrer">packages/installer/fabric.ts:138</a>
</p>


### versionId <Badge type="info" text="optional" />

```ts
versionId: string
```
Override the newly installed version id.

If this is absent, the installed version id will be either generated or provided by installer.
*Inherited from: `InstallOptions.versionId`*

<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/utils.ts#L114" target="_blank" rel="noreferrer">packages/installer/utils.ts:114</a>
</p>


### yarnVersion <Badge type="info" text="optional" />

```ts
yarnVersion: string | FabricArtifactVersion
```
<p style="font-size: 14px; color: var(--vp-c-text-2)">
<strong>Defined in:</strong> <a href="https://github.com/voxelum/minecraft-launcher-core-node/blob/master/packages/installer/fabric.ts#L139" target="_blank" rel="noreferrer">packages/installer/fabric.ts:139</a>
</p>


