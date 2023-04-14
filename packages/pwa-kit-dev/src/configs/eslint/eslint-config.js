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
        // The goal of the no-empty-function rule is to minimize the contextual knowledge required
        // by the reader. The suggested fix for empty functions is to add comments indicating that
        // the empty function is intentional. However, in my opinion, it is clear from context that
        // most of our empty arrow functions are intentional no-ops, so we don't want the rule to be
        // enforced for those.
        '@typescript-eslint/no-empty-function': ['error', {allow: ['arrowFunctions']}],
        'react-hooks/rules-of-hooks': 'error',
        // react-hooks/exhaustive-deps has too many false positives; use-effect-no-deps is nicer
        'use-effect-no-deps/use-effect-no-deps': 'warn'
    },
    overrides: [
        {
            // Jest (v29) default test match pattern
            files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
            plugins: ['jest'],
            extends: ['plugin:jest/recommended', 'plugin:jest/style'],
            rules: {
                'jest/expect-expect': [
                    'warn',
                    {
                        // Anything starting with `expect` counts as an assertion
                        assertFunctionNames: ['expect*', '**.expect*']
                    }
                ],
                // This doesn't reliably report all errors :/
                'jest/no-standalone-expect': ['off']
            }
        },
        {
            files: ['**/*.ts', '**/*.tsx'],
            extends: ['plugin:@typescript-eslint/recommended-requiring-type-checking'],
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
