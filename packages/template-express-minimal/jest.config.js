/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const base = require('@salesforce/pwa-kit-dev/configs/jest/jest.config.js')

module.exports = {
    ...base,
    coverageThreshold: {
        global: {
            branches: 85,
            functions: 85,
            lines: 85,
            statements: 85
        }
    },
    collectCoverageFrom: ['app/**'],

    // This is a monorepo only issue!
    // Jest doesn't know how to resolve this dependency unless we upgrade to jest 29
    // since it's in monorepo, the node_modules folders are not linked
    // we have to point it to pwa-kit-dev node_modules
    moduleNameMapper: {
        'tsx/cjs/api': '<rootDir>/../pwa-kit-dev/node_modules/tsx/dist/cjs/api/index.cjs'
    },
    testEnvironment: 'node'
}
