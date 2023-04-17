/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/** Override configuration for TypeScript files. */
module.exports = {
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
