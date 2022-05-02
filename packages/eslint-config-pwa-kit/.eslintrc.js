/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

    // Deliberate eslint rule violation for testing eslint

require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
    parser: '@babel/eslint-parser',
    parserOptions: {
        ecmaVersion: 2017,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true
        },
        requireConfigFile: false,
        babelOptions: {
            presets: ['pwa-kit']
        }
    },
    env: {
        es6: true,
        node: true,
        browser: true,
        jest: true
    },
    extends: ['eslint:recommended', 'plugin:react/recommended', 'prettier', 'prettier/react'],
    plugins: ['react', 'prettier'],
    settings: {
        react: {
            version: '16.8'
        }
    },
    rules: {
        'prettier/prettier': ['error'],
        'no-console': 'off',
        'no-unused-vars': ['error', {ignoreRestSiblings: true}]
    },
    overrides: [
        {
            files: ['**/*.ts?(x)'],
            parser: '@typescript-eslint/parser',
            parserOptions: {
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true
                },
                warnOnUnsupportedTypeScriptVersion: true
            }
        }
    ]
}
