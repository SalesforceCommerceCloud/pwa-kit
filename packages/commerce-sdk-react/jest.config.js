/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const base = require('internal-lib-build/configs/jest/jest.config')

module.exports = {
    ...base,
    setupFilesAfterEnv: ['./setup-jest.js'],
    transformIgnorePatterns: [],
    moduleNameMapper: {
        ...base.moduleNameMapper,
        '^@salesforce/storefront-next-runtime/design/react/core$':
            '<rootDir>/node_modules/@salesforce/storefront-next-runtime/dist/design-react-core.js',
        '^@salesforce/storefront-next-runtime/design/react$':
            '<rootDir>/node_modules/@salesforce/storefront-next-runtime/dist/design-react.js',
        '^@salesforce/storefront-next-runtime/design$':
            '<rootDir>/node_modules/@salesforce/storefront-next-runtime/dist/design.js',
        '^@salesforce/storefront-next-runtime/design/mode$':
            '<rootDir>/node_modules/@salesforce/storefront-next-runtime/dist/design-mode.js',
        '^@salesforce/storefront-next-runtime/scapi$':
            '<rootDir>/node_modules/@salesforce/storefront-next-runtime/dist/scapi.js'
    },
    coverageThreshold: {
        global: {
            branches: 0,
            functions: 0,
            lines: 0,
            statements: 0
        }
    },
    collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}']
}
