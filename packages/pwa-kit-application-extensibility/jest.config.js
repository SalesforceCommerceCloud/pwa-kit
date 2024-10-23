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
            functions: 90,
            lines: 90,
            statements: 90
        }
    },
    testPathIgnorePatterns: ['bin/*', 'coverage/*', 'dist/*', 'node_modules/*', 'scripts/*'],
    collectCoverageFrom: ['src/**', '!src/ssr/server/test_fixtures/*', '!src/**/*-placeholder'],
    coveragePathIgnorePatterns: [
        '^index\\.ts$', // Don't put code in index files!
        '-placeholder\\.ts$' // Ignore Placeholder files
    ],
    setupFilesAfterEnv: ['@testing-library/jest-dom/extend-expect']
}
