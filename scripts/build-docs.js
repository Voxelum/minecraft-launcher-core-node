const TypeDoc = require('typedoc');
const { ConverterComponent } = require('typedoc/dist/lib/converter/components');
const app = new TypeDoc.Application();
const { Converter } = require('typedoc/dist/lib/converter/converter');
const { ReflectionKind } = require('typedoc/dist/lib/models/reflections/abstract');
const { DeclarationReflection } = require('typedoc/dist/lib/models/reflections/declaration');
const { CommentPlugin } = require('typedoc/dist/lib/converter/plugins/CommentPlugin');
const { Comment } = require('typedoc/dist/lib/models/comments/comment');
const { extractReadmeUsages } = require('./readme');

// If you want TypeDoc to load tsconfig.json / typedoc.json files
app.options.addReader(new TypeDoc.TSConfigReader());
app.options.addReader(new TypeDoc.TypeDocReader());

const projectToUsage = {};
extractReadmeUsages().forEach(({ content, project }) => {
    projectToUsage[`@xmcl/${project}`] = content;
});

class GroupModuleComponent extends ConverterComponent {
    initialize() {
        this.listenTo(this.owner, {
            [Converter.EVENT_BEGIN]: this.onBegin,
            [Converter.EVENT_CREATE_DECLARATION]: this.onDeclaration,
            [Converter.EVENT_RESOLVE_BEGIN]: this.onBeginResolve,
            [Converter.EVENT_RESOLVE_END]: this.onEndResolve,
        });
    }

    onBegin(context) {
        this.moduleRenames = [];
    }

    onDeclaration(context, reflection, node) {
        if (reflection.kindOf(ReflectionKind.ExternalModule) || reflection.kindOf(ReflectionKind.Module)) {
            let path = node.path;
            let match = /.+\/packages\/([a-z-]+)\/(.+)\.ts/.exec(path);
            if (match) {
                if (match[1] === "core" && match[2] !== "fs") {
                    this.moduleRenames.push({
                        renameTo: match[1],
                        preferred: true,
                        symbol: node.symbol,
                        reflection: reflection,
                    })
                } else {
                    if (match[2] === "index.browser") {
                        removeReflection(context, reflection);
                        return;
                    }
                    if (match[2] === "index") {
                        this.moduleRenames.push({
                            renameTo: match[1],
                            preferred: true,
                            symbol: node.symbol,
                            reflection: reflection,
                        })
                    } else if (match[2].indexOf("/") === -1) {
                        this.moduleRenames.push({
                            renameTo: match[1] + "." + match[2],
                            preferred: true,
                            symbol: node.symbol,
                            reflection: reflection,
                        })
                    } else {
                        this.moduleRenames.push({
                            renameTo: match[1] + "." + `internal/${match[2].split("/")[0]}`,
                            preferred: true,
                            symbol: node.symbol,
                            reflection: reflection,
                        })
                    }
                }
            }
        }
    }

    onBeginResolve(context) {
        let projRefs = context.project.reflections;
        let refsArray = Object.keys(projRefs).reduce((m, k) => {
            m.push(projRefs[k]);
            return m;
        }, []);

        this.moduleRenames.forEach(item => {
            item.renameTo = `@xmcl/${item.renameTo}`;
        });

        // Process each rename
        this.moduleRenames.forEach(item => {
            let renaming = item.reflection;

            // Find or create the module tree until the child's parent (each level is separated by .)
            let nameParts = item.renameTo.split('.');
            let parent = context.project;
            for (let i = 0; i < nameParts.length - 1; ++i) {
                let child = parent.children.filter(ref => ref.name === nameParts[i])[0];
                if (!child) {
                    child = new DeclarationReflection(nameParts[i], ReflectionKind.Module, parent);
                    child.parent = parent;
                    child.children = [];
                    context.project.reflections[child.id] = child;
                    parent.children.push(child);
                }
                parent = child;
            }

            // Find an existing module with the child's name in the last parent. Use it as the merge target.
            let mergeTarget = (
                parent.children.filter(ref => ref.kind === renaming.kind && ref.name === nameParts[nameParts.length - 1])[0]
            );

            // If there wasn't a merge target, change the name of the current module, connect it to the right parent and exit.
            if (!mergeTarget) {
                renaming.name = nameParts[nameParts.length - 1];
                let oldParent = renaming.parent;
                for (let i = 0; i < oldParent.children.length; ++i) {
                    if (oldParent.children[i] === renaming) {
                        oldParent.children.splice(i, 1);
                        break;
                    }
                }
                item.reflection.parent = parent;
                parent.children.push(renaming);
                updateSymbolMapping(context, item.symbol, parent);
                return;
            }

            updateSymbolMapping(context, item.symbol, mergeTarget);
            if (!mergeTarget.children) {
                mergeTarget.children = [];
            }

            // Since there is a merge target, relocate all the renaming module's children to the mergeTarget.
            let childrenOfRenamed = refsArray.filter(ref => ref.parent === renaming);
            childrenOfRenamed.forEach((ref) => {
                // update links in both directions
                ref.parent = mergeTarget;
                mergeTarget.children.push(ref);
            });

            // If @preferred was found on the current item, update the mergeTarget's comment
            // with comment from the renaming module
            if (item.preferred) mergeTarget.comment = renaming.comment;

            // Now that all the children have been relocated to the mergeTarget, delete the empty module
            // Make sure the module being renamed doesn't have children, or they will be deleted
            if (renaming.children) renaming.children.length = 0;
            removeReflection(context, renaming);

            // Remove @module and @preferred from the comment, if found.
            if (isEmptyComment(mergeTarget.comment)) {
                delete mergeTarget.comment;
            }
        });
    }

    onEndResolve(context) {
        let parent = context.project;
        parent.children.forEach((child) => {
            let comment = child.comment || new Comment("");
            if (projectToUsage[child.name]) {
                let md = projectToUsage[child.name].map(r => r.join("\n")).join("\n") + "\n"

                comment.text = (comment.text || "") + "\n\n ## Usage \n\n" + md;
            }

            child.comment = comment;
        })
    }
}
let lll = "";

function removeReflection(context, reflection) {
    CommentPlugin.removeReflection(context.project, reflection);
    delete context.project.reflections[reflection.id];
}

/**
 * When we delete reflections, update the symbol mapping in order to fix:
 * https://github.com/christopherthielen/typedoc-plugin-external-module-name/issues/313
 * https://github.com/christopherthielen/typedoc-plugin-external-module-name/issues/193
 */
function updateSymbolMapping(context, symbol, reflection) {
    const fqn = context.checker.getFullyQualifiedName(symbol);
    (context.project).fqnToReflectionIdMap.set(fqn, reflection.id);
}

function isEmptyComment(comment) {
    return !comment || (!comment.text && !comment.shortText && (!comment.tags || comment.tags.length === 0));
}

app.converter.addComponent("group-module", GroupModuleComponent);

app.bootstrap({
    mode: 'modules',
    logger: 'none',
    exclude: [
        "**/*.test.ts",
        "**/test.ts",
    ],
    hideGenerator: true,
    readme: "./README.md",
    name: "minecraft-launcher-core-node",
    includeVersion: true,
    includes: ".",
    excludeNotExported: true,
});

const files = app.expandInputFiles(['./packages']);
const project = app.convert(files);

TypeDoc.Reflection.prototype.getAlias = function () {
    if (!this._alias) {
        let alias = this.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        if (alias === '') {
            alias = 'reflection-' + this.id;
        }
        let target = this;
        while (target.parent && !target.parent.isProject() && !target.hasOwnDocument) {
            target = target.parent;
        }
        if (!target._aliases) {
            target._aliases = [];
        }
        let suffix = '', index = 0;
        while (target._aliases.includes(alias + suffix)) {
            suffix = '-' + (++index).toString();
        }
        alias += suffix;

        if (alias.startsWith('_')) {
            alias = alias.substring(1);
        }

        target._aliases.push(alias);
        this._alias = alias;
    }
    return this._alias;
}

if (project) { // Project may not have converted correctly
    const outputDir = 'docs/build/docs';
    // Rendered docs
    app.generateDocs(project, outputDir);
}

console.log(lll)
