/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Recommended configuration for PWA Kit projects that don't use React.
 * Contains rules for JavaScript, TypeScript, and Jest.
 */
module.exports = {
    extends: [require.resolve('./base')],
    // TypeScript and Jest rules only apply to specific file paths, so they are overrides.
    overrides: [
        {
            files: ['**/*.ts', '**/*.tsx'],
            rules: {
                // Allow 'any' type in TypeScript files for internal-lib-build
                '@typescript-eslint/no-explicit-any': 'off'
            }
        },
        {
            files: [
                '**/*.test.js',
                '**/*.test.ts',
                '**/*.test.tsx',
                '**/*.spec.js',
                '**/*.spec.ts',
                '**/*.spec.tsx'
            ],
            env: {
                jest: true
            },
            rules: {
                // Jest-specific rules
                'jest/no-disabled-tests': 'warn',
                'jest/no-focused-tests': 'error',
                'jest/no-identical-title': 'error',
                'jest/prefer-to-have-length': 'warn',
                'jest/valid-expect': 'error'
            }
        }
    ]
}
