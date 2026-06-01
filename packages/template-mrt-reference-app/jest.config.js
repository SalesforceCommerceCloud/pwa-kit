/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const path = require('path')
const base = require('@salesforce/pwa-kit-dev/configs/jest/jest.config.js')

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
        '^@salesforce/pwa-kit-dev/utils/mrt-data-store-local-provider\\.js$': pwaKitDevLocalMrtDataStore
    },
    transformIgnorePatterns: [
        'node_modules/(?!(@salesforce/mrt-utilities|jsdom/lib/jsdom/browser/resources/resource-loader))'
    ],
    coverageThreshold: {
        global: {
            branches: 50,
            functions: 77,
            lines: 85,
            statements: 85
        }
    },
    collectCoverageFrom: ['app/**', '!app/request-processor.js', '!app/static/**', '!app/*.json'],
    // Increase to: 6 x default timeout of 5 seconds
    ...(process.env.CI ? {testTimeout: 30000} : {})
}
