# Minecraft Version Parsing

```ts
    import { Versoin } from "@xmcl/version";
    const minecraftLocation: string;
    const minecraftVersionId: string;

    const resolvedVersion: ResolvedVersion = await Version.parse(minecraftLocation, minecraftVersionId);
```

Parse minecraft version as a resolved version, which is used for launching process. You can also read version info from it if you want.

```ts
    import { Versoin, VersionDiagnosis } from "@xmcl/version";
    const minecraftLocation: string;
    const minecraftVersionId: string;

    const report: VersionDiagnosis = await Version.diagnose(minecraftLocation, minecraftVersionId);
```

Get the report of the version. It can check if version missing assets/libraries.
