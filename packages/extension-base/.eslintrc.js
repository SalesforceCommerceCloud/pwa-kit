/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

module.exports = {
    extends: [require.resolve('@salesforce/pwa-kit-dev/configs/eslint')],
    rules: {
        // Ignore unresolved imports for wildcard paths (e.g., */path/to/module)
        'import/no-unresolved': [
            'error',
            {
                ignore: ['^\\$/'] // Ignore any import paths that start with '$/'
            }
        ],
        // Add TypeScript specific rule to ignore TS2307 errors for wildcard imports
        '@typescript-eslint/no-unsafe-assignment': 'off', // Optional: disable or adjust as needed
        '@typescript-eslint/no-explicit-any': 'off' // Optional: allow usage of 'any'
    },
}
