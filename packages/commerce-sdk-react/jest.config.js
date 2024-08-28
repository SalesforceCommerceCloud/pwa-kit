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
    coverageThreshold: {
        global: {
            branches: 0,
            functions: 0,
            lines: 0,
            statements: 0
        }
    },
    collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}'],
    testEnvironment: 'jest-environment-jsdom-global'
}
