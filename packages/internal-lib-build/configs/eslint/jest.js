/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/** Override configuration for Jest files. */
module.exports = {
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
        // This doesn't reliably report errors :(
        'jest/no-standalone-expect': ['off']
    }
}
