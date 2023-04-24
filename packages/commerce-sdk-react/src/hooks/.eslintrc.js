/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
module.exports = {
    rules: {
        'jest/expect-expect': [
            'error',
            {
                // Additional helpers used in ./Shopper*/query.test.ts
                assertFunctionNames: ['expect', 'waitAndExpectError', 'waitAndExpectSuccess']
            }
        ]
    }
}
