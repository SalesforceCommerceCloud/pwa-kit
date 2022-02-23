/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const base = require('internal-lib-build/configs/jest/jest.config')

module.exports = {
    ...base,
    coverageThreshold: {
        global: {
            branches: 92.5,
            functions: 87,
            lines: 90,
            statements: 90
        }
    },
    testPathIgnorePatterns: ['bin/*', 'dist/*', 'node_modules/*', 'coverage/*'],
    collectCoverageFrom: ['src/**', 'scripts/**']
}
