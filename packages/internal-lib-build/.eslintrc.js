/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

module.exports = {
    extends: ['eslint:recommended'],
    env: {
        node: true,
        es6: true
    },
    parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module'
    },
    overrides: [
        {
            files: ['**/*.js'],
            parserOptions: {
                sourceType: 'script'
            }
        },
        {
            files: ['configs/jest/setup-jest.js'],
            parserOptions: {
                sourceType: 'module'
            }
        }
    ],
    rules: {
        // Disable TypeScript-specific rules since this package doesn't use TypeScript ESLint
        '@typescript-eslint/no-var-requires': 'off'
    }
}
