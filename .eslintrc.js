module.exports = {
    root: true,
    plugins: ['header'],
    rules: {
        'header/header': [
            2,
            'block',
            [
                '',
                {
                    pattern: '^ \\* Copyright \\(c\\) \\d{4}, (salesforce.com, inc|Salesforce, Inc)\\.$',
                    template: ` * Copyright (c) ${new Date().getFullYear()}, Salesforce, Inc.`
                },
                ' * All rights reserved.',
                ' * SPDX-License-Identifier: BSD-3-Clause',
                ' * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause',
                ' '
            ]
        ],
        // Sometimes VS Code will automatically add missing imports, but will do so via
        // @salesforce/retail-react-app/node_modules/ instead of a normal import. It technically
        // works inside the monorepo, but won't necessarily work in customer projects, so we want to
        // avoid the pattern. (Also just because it's weird.)
        'no-restricted-imports': [
            'error',
            {
                patterns: [
                    {
                        group: ['@salesforce/retail-react-app/node_modules/*'],
                        message: 'Did your IDE auto-complete this import? Avoid /node_modules/ and import the package directly.'
                    }
                ]
            }
        ]
    },
    // For an import in a file to be replaced via template extensibility, the import must use the
    // full package name, rather than relative imports, i.e. all retail react app imports must use
    // "@salesforce/retail-react-app/" rather than relative imports.
    overrides: [
        {
            files: ['packages/template-retail-react-app/**'],
            plugins: ['no-relative-import-paths'],
            rules: {
                // https://github.com/MelvinVermeer/eslint-plugin-no-relative-import-paths
                'no-relative-import-paths/no-relative-import-paths': [
                    'error',
                    {
                        allowSameFolder: false,
                        rootDir: 'packages/template-retail-react-app',
                        prefix: '@salesforce/retail-react-app'
                    }
                ]
            }
        }
    ]
}
