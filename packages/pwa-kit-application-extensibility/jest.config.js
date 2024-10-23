/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const base = require('internal-lib-build/configs/jest/jest.config')

module.exports = {
    ...base,
    coverageThreshold: {
        global: {
            branches: 90,
            functions: 87,
            lines: 90,
            statements: 90
        }
    },
    testPathIgnorePatterns: ['bin/*', 'coverage/*', 'dist/*', 'node_modules/*', 'scripts/*'],
    collectCoverageFrom: ['src/**', '!src/ssr/server/test_fixtures/*']
}
