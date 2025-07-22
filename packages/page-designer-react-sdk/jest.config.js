/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const base = require('internal-lib-build/configs/jest/jest.config')

module.exports = {
    ...base,
    collectCoverageFrom: [
        'src/**/*.{js,jsx,ts,tsx}',
        '!**/test.{js,jsx,ts,tsx}',
        '!**/*.test.{js,jsx,ts,tsx}'
    ]
}
