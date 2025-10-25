# Monaco Editor Integration with Vite

**Source**: https://github.com/microsoft/monaco-editor/blob/main/docs/integrate-esm.md

## Using Vite

Vite has built-in support for web workers. Implement the `getWorker` function (NOT `getWorkerUrl`):

```javascript
import * as monaco from 'monaco-editor';

self.MonacoEnvironment = {
    getWorker: function (workerId, label) {
        const getWorkerModule = (moduleUrl, label) => {
            return new Worker(self.MonacoEnvironment.getWorkerUrl(moduleUrl), {
                name: label,
                type: 'module'
            });
        };

        switch (label) {
            case 'json':
                return getWorkerModule(
                    '/monaco-editor/esm/vs/language/json/json.worker?worker',
                    label
                );
            case 'css':
            case 'scss':
            case 'less':
                return getWorkerModule(
                    '/monaco-editor/esm/vs/language/css/css.worker?worker',
                    label
                );
            case 'html':
            case 'handlebars':
            case 'razor':
                return getWorkerModule(
                    '/monaco-editor/esm/vs/language/html/html.worker?worker',
                    label
                );
            case 'typescript':
            case 'javascript':
                return getWorkerModule(
                    '/monaco-editor/esm/vs/language/typescript/ts.worker?worker',
                    label
                );
            default:
                return getWorkerModule(
                    '/monaco-editor/esm/vs/editor/editor.worker?worker',
                    label
                );
        }
    }
};

monaco.editor.create(document.getElementById('container'), {
    value: "function hello() {\n\talert('Hello world!');\n}",
    language: 'javascript'
});
```

## For GLSL Syntax Highlighting

Monaco doesn't have built-in GLSL support, but we can configure it:

```javascript
// Register GLSL language
monaco.languages.register({ id: 'glsl' });

// Define GLSL syntax highlighting
monaco.languages.setMonarchTokensProvider('glsl', {
    keywords: [
        'attribute', 'const', 'uniform', 'varying',
        'break', 'continue', 'do', 'for', 'while',
        'if', 'else',
        'in', 'out', 'inout',
        'float', 'int', 'void', 'bool', 'true', 'false',
        'lowp', 'mediump', 'highp', 'precision',
        'invariant',
        'discard', 'return',
        'mat2', 'mat3', 'mat4',
        'vec2', 'vec3', 'vec4', 'ivec2', 'ivec3', 'ivec4', 'bvec2', 'bvec3', 'bvec4',
        'sampler1D', 'sampler2D', 'sampler3D', 'samplerCube',
        'sampler1DShadow', 'sampler2DShadow',
        'struct'
    ],

    operators: [
        '=', '>', '<', '!', '~', '?', ':',
        '==', '<=', '>=', '!=', '&&', '||', '++', '--',
        '+', '-', '*', '/', '&', '|', '^', '%', '<<',
        '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=',
        '^=', '%=', '<<=', '>>=', '>>>='
    ],

    // Tokenizer rules
    tokenizer: {
        root: [
            // identifiers and keywords
            [/[a-z_$][\w$]*/, {
                cases: {
                    '@keywords': 'keyword',
                    '@default': 'identifier'
                }
            }],

            // whitespace
            { include: '@whitespace' },

            // numbers
            [/\d*\.\d+([eE][\-+]?\d+)?[fFdD]?/, 'number.float'],
            [/0[xX][0-9a-fA-F]+/, 'number.hex'],
            [/\d+/, 'number'],

            // delimiter
            [/[;,.]/, 'delimiter'],
            [/[()[\]]/, '@brackets'],
            [/[{}]/, '@brackets'],
            [/<[^<>]*>/, 'annotation'],

            // operators
            [/@operators/, 'operator'],

            // strings
            [/"([^"\\]|\\.)*$/, 'string.invalid'],  // non-terminated
            [/"/, 'string', '@string'],
        ],

        whitespace: [
            [/[ \t\r\n]+/, ''],
            [/\/\*/, 'comment', '@comment'],
            [/\/\/.*$/, 'comment'],
        ],

        comment: [
            [/[^\/*]+/, 'comment'],
            [/\*\//, 'comment', '@pop'],
            [/[\/*]/, 'comment']
        ],

        string: [
            [/[^\\"]+/, 'string'],
            [/"/, 'string', '@pop']
        ],
    },
});

// Optional: Add GLSL completions
monaco.languages.registerCompletionItemProvider('glsl', {
    provideCompletionItems: () => {
        const suggestions = [
            {
                label: 'sin',
                kind: monaco.languages.CompletionItemKind.Function,
                insertText: 'sin(${1:x})',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Returns the sine of x'
            },
            {
                label: 'cos',
                kind: monaco.languages.CompletionItemKind.Function,
                insertText: 'cos(${1:x})',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Returns the cosine of x'
            },
            {
                label: 'normalize',
                kind: monaco.languages.CompletionItemKind.Function,
                insertText: 'normalize(${1:v})',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Returns a vector in the same direction but with length 1'
            },
            {
                label: 'dot',
                kind: monaco.languages.CompletionItemKind.Function,
                insertText: 'dot(${1:a}, ${2:b})',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Returns the dot product of two vectors'
            },
            {
                label: 'length',
                kind: monaco.languages.CompletionItemKind.Function,
                insertText: 'length(${1:v})',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Returns the length of a vector'
            },
            {
                label: 'mix',
                kind: monaco.languages.CompletionItemKind.Function,
                insertText: 'mix(${1:x}, ${2:y}, ${3:a})',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Linear interpolation between x and y using a'
            },
            {
                label: 'clamp',
                kind: monaco.languages.CompletionItemKind.Function,
                insertText: 'clamp(${1:x}, ${2:min}, ${3:max})',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Constrains x to lie between min and max'
            },
            {
                label: 'smoothstep',
                kind: monaco.languages.CompletionItemKind.Function,
                insertText: 'smoothstep(${1:edge0}, ${2:edge1}, ${3:x})',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                documentation: 'Smooth Hermite interpolation'
            }
        ];
        return { suggestions: suggestions };
    }
});
```

## Basic Editor Configuration

```javascript
const editor = monaco.editor.create(document.getElementById('editor-container'), {
    value: shaderCode,
    language: 'glsl',
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    tabSize: 2
});

// Listen for changes
editor.onDidChangeModelContent(() => {
    const newCode = editor.getValue();
    // Update shader, recompile, etc.
});
```

## Important Notes for Vite

1. **Worker Loading**: Use `?worker` suffix in import paths
2. **Type**: Specify `type: 'module'` for workers
3. **No Webpack Plugin**: Vite handles workers natively
4. **Hot Reload**: Works out of the box with Vite HMR

## Bundle Size Optimization

Monaco is large (~3MB uncompressed). Optimize by:

1. **Code Splitting**: Load Monaco lazily
```javascript
// Lazy load Monaco
const loadMonaco = async () => {
    const monaco = await import('monaco-editor');
    return monaco;
};
```

2. **Use Only Needed Languages**: Configure to exclude unnecessary languages in vite.config.js

3. **Tree Shaking**: Vite automatically handles with ESM imports

---

**Fetched**: October 4, 2025
**License**: Educational use for fractal-explorer project
