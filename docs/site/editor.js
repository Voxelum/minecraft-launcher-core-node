import definitions from './definitions';
import scenarios from './scenarios';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

self.MonacoEnvironment = {
    getWorker(moduleId, label) {
        if (label === 'typescript' || label === 'javascript') {
            return new tsWorker({ name: label });
        }
        return new editorWorker({ name: label });
    },
};

import('monaco-editor').then(({ languages, editor, KeyCode, Uri }) => {
    languages.typescript.typescriptDefaults.setCompilerOptions({
        target: languages.typescript.ScriptTarget.ESNext,
        allowNonTsExtensions: true,
        moduleResolution: languages.typescript.ModuleResolutionKind.NodeJs,
        module: languages.typescript.ModuleKind.ESNext,
        allowSyntheticDefaultImports: true,
    });

    const libs = {

    }

    for (const key of Object.keys(definitions)) {
        const modulePath = `file:///node_modules/${key}`;

        languages.typescript.typescriptDefaults.addExtraLib(
            definitions[key],
            modulePath,
        );

        libs[key] = editor.createModel(
            definitions[key],
            'typescript',
            Uri.parse(modulePath)
        );
    }

    const models = {
    }


    for (const key of Object.keys(scenarios)) {
        models[key] = editor.createModel(
            scenarios[key],
            'typescript',
            Uri.parse(`${key}.ts`)
        );
    }

    const standoneEditor = editor.create(document.getElementById('editor'), {
        model: models.common,
        language: 'typescript',
        theme: "vs-dark",
        automaticLayout: true,
    });
    const history = []
    standoneEditor.onDidChangeModel((e) => {
        history.push(e.newModelUrl)
    })

    // languages.typescript.typescriptDefaults.
    const service = standoneEditor._codeEditorService;
    const openEditorBase = service.openCodeEditor.bind(service);
    service.openCodeEditor = async (input, source) => {
        const result = await openEditorBase(input, source);
        if (!result) {
            const model = editor.getModel(input.resource)
            source.setModel(model)
            source.setSelection(input.options.selection)
            source.revealLines(input.options.selection.startLineNumber,
                input.options.selection.endLineNumber,
                input.options.selectionRevealType)
        }
        return result;
    }


    $('#code-sample').dropdown({
        onChange: function (src, _, elem) {
            standoneEditor.setModel(models[elem.attr('value')]);
        }
    });

    // standoneEditor.addCommand(KeyCode.F2, () => {
    //     languages.typescript.getTypeScriptWorker()
    //         .then(function (worker) {
    //             worker(models.common.uri).then(function (client) {
    //                 client.getEmitOutput(models.common.uri.toString()).then(function (r) {
    //                     // const code = r.outputFiles[0].text;
    //                     const code = `let localRequire = require; require = this.require; ${r.outputFiles[0].text}; require = localRequire;`;
    //                     evalInScope(code)
    //                 });
    //             });
    //         });
    // });
});
