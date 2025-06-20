/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/** Override configuration for TypeScript files. */
module.exports = {
    files: ['**/*.ts', '**/*.tsx'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2017,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true
        }
    },
    plugins: ['@typescript-eslint'],
    extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking'
    ],
    rules: {
        // The goal of the no-empty-function rule is to minimize the contextual knowledge required
        // by the reader. The suggested fix for empty functions is to add comments indicating that
        // the empty function is intentional. However, in my opinion, it is clear from context that
        // most of our empty arrow functions are intentional no-ops, so we don't want the rule to be
        // enforced for those.
        '@typescript-eslint/no-empty-function': ['error', {allow: ['arrowFunctions']}]
    }
} 