/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const base = require('@salesforce/pwa-kit-dev/configs/jest/jest.config.js')
const path = require('path')

module.exports = {
    ...base,
    coverageThreshold: {
        global: {
            branches: 50,
            functions: 77,
            lines: 85,
            statements: 85
        }
    },
    collectCoverageFrom: ['app/**/*.mjs', '!app/request-processor.js', '!app/static/**', '!app/*.json'],
    testMatch: ['<rootDir>/app/**/*.test.mjs'],
    transform: {
        ...base.transform,
        '^.+\\.mjs$': path.join(__dirname, '../pwa-kit-dev/jest-babel-transform.js')
    },
    moduleFileExtensions: [...(base.moduleFileExtensions || ['js', 'jsx', 'ts', 'tsx', 'json', 'node']), 'mjs'],
    // Increase to: 6 x default timeout of 5 seconds
    ...(process.env.CI ? {testTimeout: 30000} : {})
}
