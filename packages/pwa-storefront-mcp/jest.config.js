/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const path = require('path')
const base = require('@salesforce/pwa-kit-dev/configs/jest/jest.config.js')

module.exports = {
    ...base,
    moduleNameMapper: {
        ...base.moduleNameMapper,
        '^react$': '<rootDir>/node_modules/react/index.js',
        '^react-router-dom(.*)$': '<rootDir>/node_modules/react-router-dom/index.js',
        // Add more mappings as needed for this package
    },
    transformIgnorePatterns: [
        "/node_modules/"
    ],
    setupFilesAfterEnv: [path.join(__dirname, 'jest-setup.js')],
    collectCoverageFrom: [
        'src/**/*.{js,jsx}',
        '!node_modules/**'
    ],
    coverageThreshold: {
        global: {
            statements: 73,
            branches: 60,
            functions: 65,
            lines: 74
        }
    },
    ...(process.env.CI ? {testTimeout: 30000} : {})
} 