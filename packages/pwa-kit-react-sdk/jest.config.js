/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
const base = require('internal-lib-build/configs/jest/jest.config')

// pwa-kit-runtime re-exports DataStore from @salesforce/mrt-utilities/data-store; Jest loads compiled
// runtime dist which uses require(). Map to compiled ESM data-store only (see pwa-kit-runtime jest.config).
const mrtMiddlewareDataStore = path.join(
    __dirname,
    '..',
    'pwa-kit-runtime',
    'node_modules',
    '@salesforce',
    'mrt-utilities',
    'dist',
    'esm',
    'middleware',
    'data-store.js'
)

const pwaKitDevLocalMrtDataStore = path.join(
    __dirname,
    '..',
    'pwa-kit-dev',
    'src',
    'utils',
    'mrt-data-store-local-provider.js'
)

module.exports = {
    ...base,
    moduleNameMapper: {
        ...base.moduleNameMapper,
        '^@salesforce/mrt-utilities/data-store$': mrtMiddlewareDataStore,
        '^@salesforce/pwa-kit-dev/dist/utils/mrt-data-store-local-provider\\.js$':
            pwaKitDevLocalMrtDataStore,
        '^@salesforce/pwa-kit-dev/utils/mrt-data-store-local-provider\\.js$':
            pwaKitDevLocalMrtDataStore
    },
    transformIgnorePatterns: [
        'node_modules/(?!(@salesforce/mrt-utilities|jsdom/lib/jsdom/browser/resources/resource-loader))'
    ],
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
