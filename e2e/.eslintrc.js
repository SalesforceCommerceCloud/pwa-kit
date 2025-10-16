/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

module.exports = {
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'script'
    },
    env: {
        es6: true,
        node: true,
        browser: true,
        jest: true
    },
    extends: ['eslint:recommended', 'plugin:prettier/recommended', 'plugin:jest/recommended'],
    plugins: ['prettier', 'jest'],
    reportUnusedDisableDirectives: true,
    rules: {
        'no-unused-vars': 'warn',
        'no-undef': 'error',
        'no-prototype-builtins': 'error',
        'no-empty': 'error',
        'jest/no-deprecated-functions': 'off'
    },
    overrides: [
        {
            files: ['*.js'],
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: 'script'
            }
        },
        {
            files: ['scripts/pageHelpers.js', 'tests/**/*.js'],
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: 'module'
            }
        }
    ]
}
