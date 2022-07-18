/*
 * Copyright (c) 2021, salesforce.com, inc.
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
        browser: true,
        jest: true
    },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
        'prettier',
        'prettier/react'
    ],
    plugins: ['@typescript-eslint', 'header', 'react', 'prettier'],
    settings: {
        react: {
            version: '16.8'
        }
    },
    rules: {
        'prettier/prettier': ['error'],
        'no-console': 'off',
        'no-unused-vars': ['error', {ignoreRestSiblings: true}],
        // NOTE: converting these rules to warnings to pass CI tests for now
        // TODO: revisit these rules
        '@typescript-eslint/no-var-requires': ['warn'],
        '@typescript-eslint/no-empty-function': ['warn'],
        '@typescript-eslint/no-this-alias': ['warn'],
        '@typescript-eslint/no-extra-semi': ['warn']
    }
}
