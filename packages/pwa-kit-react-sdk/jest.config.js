/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const base = require('internal-lib-build/configs/jest/jest.config')

module.exports = {
    ...base,
    setupFilesAfterEnv: ['./setup-jest.js'],
    collectCoverageFrom: [
        'src/**/*.{js,jsx}',
        'scripts/**/*.{js,jsx}',
        '!**/test.{js,jsx}',
        '!scripts/setup-jsdom.js',
        '!scripts/version.js'
    ],
    coverageThreshold: {
        global: {
            branches: 90,
            functions: 85,
            lines: 85,
            statements: 85
        }
    }
}
