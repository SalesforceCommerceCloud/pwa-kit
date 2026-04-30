/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const base = require('internal-lib-build/configs/jest/jest.config')

module.exports = {
    ...base,
    // Jest otherwise resolves "development" → package src/*.ts and pulls in untransformed deps.
    // Map only for tests; runtime uses normal package exports.
    // Use production data-store for tests that mock DynamoDB (most tests)
    moduleNameMapper: {
        ...base.moduleNameMapper,
        '^@h4ad/serverless-adapter/lib/(.*)$':
            '<rootDir>/node_modules/@h4ad/serverless-adapter/lib/$1/index.cjs',
        '^@salesforce/mrt-utilities/data-store$':
            '<rootDir>/node_modules/@salesforce/mrt-utilities/dist/esm/data-store/production.js',
        '^@salesforce/mrt-utilities/middleware$':
            '<rootDir>/node_modules/@salesforce/mrt-utilities/dist/esm/middleware/data-store.js'
    },
    // @salesforce/mrt-utilities dist is ESM; compile it under Jest.
    transformIgnorePatterns: [
        'node_modules/(?!(@salesforce/mrt-utilities|jsdom/lib/jsdom/browser/resources/resource-loader))'
    ],
    coverageThreshold: {
        global: {
            branches: 89,
            functions: 87,
            lines: 90,
            statements: 90
        }
    },
    testPathIgnorePatterns: ['bin/*', 'coverage/*', 'dist/*', 'node_modules/*', 'scripts/*'],
    collectCoverageFrom: ['src/**', '!src/ssr/server/test_fixtures/*']
}
