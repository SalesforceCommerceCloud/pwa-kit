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
            branches: 62,
            functions: 65.5,
            lines: 65,
            statements: 67
        }
    },
    testPathIgnorePatterns: ['bin/*', 'dist/*', 'node_modules/*', 'coverage/*'],
    collectCoverageFrom: [
        'src/**',
        'scripts/**',
        '!src/configs/**',
        '!scripts/version.js',
        '!src/ssr/server/test_fixtures/**',
        '!src/schemas/**'
    ]
}
