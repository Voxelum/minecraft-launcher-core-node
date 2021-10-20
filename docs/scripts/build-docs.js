const TypeDoc = require("typedoc");
const { ReflectionKind } = require("typedoc");
const { join } = require("path");
const { readdir, readFile } = require("fs/promises");

TypeDoc.Reflection.prototype.getAlias = function () {
  if (!this._alias) {
    let alias = this.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    if (alias === "") {
      alias = "reflection-" + this.id;
    }
    let target = this;
    while (
      target.parent &&
      !target.parent.isProject() &&
      !target.hasOwnDocument
    ) {
      target = target.parent;
    }
    if (!target._aliases) {
      target._aliases = [];
    }
    let suffix = "",
      index = 0;
    while (target._aliases.includes(alias + suffix)) {
      suffix = "-" + (++index).toString();
    }
    alias += suffix;

    if (alias.startsWith("_")) {
      alias = alias.substring(1);
    }

    target._aliases.push(alias);
    this._alias = alias;
  }
  return this._alias;
};

async function generateDocs() {
  const app = new TypeDoc.Application();
  // If you want TypeDoc to load tsconfig.json / typedoc.json files
  app.options.addReader(new TypeDoc.TSConfigReader());
  app.options.addReader(new TypeDoc.TypeDocReader());
  // app.converter.addComponent("group-module", GroupModuleComponent);
  const modules = await readdir("../packages/");
  app.bootstrap({
    entryPoints: modules.map((m) => `../packages/${m}`),
    entryPointStrategy: "resolve",
    exclude: ["**/*.test.ts", "**/test.ts", "**/node_modules/**"],
    hideGenerator: true,
    readme: "./README.md",
    name: "minecraft-launcher-core-node",
    includeVersion: true,
    includes: ".",
    excludeInternal: true,
    excludeExternals: true,
    githubPages: true
  });

  const readmes = await Promise.all(
    modules.map(async (f) => {
      return {
        content: await readFile(`../packages/${f}/README.md`, "utf-8"),
        module: `@xmcl/${f}`,
      };
    })
  );
  const project = app.convert();

  for (const refl of project.getReflectionsByKind(ReflectionKind.Module)) {
    if (refl.comment) {
      let md =
        (readmes.find((f) => f.module === refl.name)?.content ||
          refl.comment.text ||
          refl.comment.shortText) + "\n";
      refl.comment.text = md;
    }
  }
  if (!project) throw new Error("Cannot convert project!");
  const outputDir = join(__dirname, "../build/docs");
  await app.generateDocs(project, outputDir);
}

generateDocs().catch(console.error);
