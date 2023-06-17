/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const base = require('pwa-kit-dev/configs/jest/jest.config.js')

module.exports = {
    ...base,
    coverageThreshold: {
        global: {
            branches: 64,
            functions: 77,
            lines: 85,
            statements: 85
        }
    },
    collectCoverageFrom: ['app/**'],
    ...(process.env.CI ? {testTimeout: 30000} : {})
}
