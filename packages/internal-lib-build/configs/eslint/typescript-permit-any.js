/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const base = require('./typescript')

/**
 * Override configuration for TypeScript files. Adds rules that require type checking, but allows
 * the use of implicit or explicit `any`.
 */
module.exports = {
    // We can't use `extends: ./typescript` because this is an override config.
    // Instead, we clone and modify the base config.
    ...base,
    rules: {
        ...base.rules,
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-return': 'off'
    }
}
