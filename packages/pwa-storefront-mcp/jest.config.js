/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const parentConfig = require('@salesforce/pwa-kit-dev/configs/jest/jest.config.js')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path')

module.exports = {
    ...parentConfig,
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
    testPathIgnorePatterns: ['bin/*', 'coverage/*', 'dist/*', 'node_modules/*', 'scripts/*'],
    setupFilesAfterEnv: [path.join(__dirname, 'jest-setup.js')],
    collectCoverageFrom: ['src/**/*.js', '!src/**/*.test.js', '!src/**/*.spec.js'],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    testTimeout: 10000
}
