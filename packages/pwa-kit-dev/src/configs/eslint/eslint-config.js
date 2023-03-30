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
            rules: {
                // These rules all deal with the `any` type in some capacity;
                // we want to be more permissive than @typescript-eslint is by default
                '@typescript-eslint/no-explicit-any': 'off',
                '@typescript-eslint/no-unsafe-argument': 'off',
                '@typescript-eslint/no-unsafe-assignment': 'off',
                '@typescript-eslint/no-unsafe-call': 'off',
                '@typescript-eslint/no-unsafe-member-access': 'off',
                '@typescript-eslint/no-unsafe-return': 'off'
            },
            parserOptions: {
                project: true
            }
        }
    ]
}
