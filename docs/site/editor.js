import definitions from './definitions';
import scenarios from './scenarios';

self.MonacoEnvironment = {
    getWorkerUrl: function (moduleId, label) {
        if (label === 'json') {
            return './json.worker.js';
        }
        if (label === 'html') {
            return './html.worker.js';
        }
        if (label === 'typescript' || label === 'javascript') {
            return './ts.worker.js';
        }
        return './editor.worker.js';
    },
};

import('monaco-editor').then((monaco) => {

    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ESNext,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.ESNext,
        allowSyntheticDefaultImports: true,
    });

    for (const key of Object.keys(definitions)) {
        const modulePath = `file:///node_modules/${key}`;

        monaco.languages.typescript.typescriptDefaults.addExtraLib(
            definitions[key],
            modulePath,
        );
    }

    const models = {
    }

    for (const key of Object.keys(scenarios)) {
        models[key] = monaco.editor.createModel(
            scenarios[key],
            'typescript',
            monaco.Uri.parse(`${key}.ts`)
        );
    }

    const editor = monaco.editor.create(document.getElementById('editor'), {
        model: models.common,
        language: 'typescript',
        theme: "vs-dark",
        automaticLayout: true,
    });

    $('#code-sample').dropdown({
        onChange: function (src, _, elem) {
            editor.setModel(models[elem.attr('value')]);
        }
    });

    function proxyOfAny() {
        return new Proxy(() => { }, {
            get(target, key) {
                return proxyOfAny();
            },
            apply() {
                return proxyOfAny();
            },
            construct() {
                return proxyOfAny();
            }
        });
    }

    function require(m) {
        return proxyOfAny();
    }

    const context = {
        require,
    }

    function evalInScope(js) {
        //# Return the results of the in-line anonymous function we .call with the passed context
        return function () { return eval(js); }.call(context);
    }

    editor.addCommand(monaco.KeyCode.F2, () => {
        monaco.languages.typescript.getTypeScriptWorker()
            .then(function (worker) {
                worker(models.common.uri).then(function (client) {
                    client.getEmitOutput(models.common.uri.toString()).then(function (r) {
                        // const code = r.outputFiles[0].text;
                        const code = `let localRequire = require; require = this.require; ${r.outputFiles[0].text}; require = localRequire;`;
                        evalInScope(code)
                    });
                });
            });
    });

});



// R((require, modules, exports) => {

// });