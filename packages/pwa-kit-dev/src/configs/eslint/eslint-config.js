/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2017,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true
        }
    },
    env: {
        es6: true,
        node: true,
        browser: true
    },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:jsx-a11y/recommended',
        'plugin:prettier/recommended'
    ],
    plugins: ['jsx-a11y', 'prettier', 'react', 'react-hooks', 'use-effect-no-deps'],
    settings: {
        react: {
            version: 'detect'
        }
    },
    reportUnusedDisableDirectives: true,
    rules: {
        'react-hooks/rules-of-hooks': 'error',
        // react-hooks/exhaustive-deps has too many false positives; use-effect-no-deps is nicer
        'use-effect-no-deps/use-effect-no-deps': 'warn'
    },
    overrides: [
        {
            files: ['**/*.{spec,test}.{js,jsx,ts,tsx}'],
            env: {jest: true}
        },
        {
            files: ['**/*.ts', '**/*.tsx'],
            extends: 'plugin:@typescript-eslint/recommended-requiring-type-checking',
            parserOptions: {
                project: true
            }
        }
    ]
}
