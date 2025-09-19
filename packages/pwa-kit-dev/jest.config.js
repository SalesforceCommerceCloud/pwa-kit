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
    moduleNameMapper: {
        ...base.moduleNameMapper,
        '^@h4ad/serverless-adapter/lib/handlers/default$':
            '<rootDir>/node_modules/@h4ad/serverless-adapter/lib/handlers/default/index.cjs',
        '^@h4ad/serverless-adapter/lib/resolvers/callback$':
            '<rootDir>/node_modules/@h4ad/serverless-adapter/lib/resolvers/callback/index.cjs',
        '^@h4ad/serverless-adapter/lib/adapters/aws$':
            '<rootDir>/node_modules/@h4ad/serverless-adapter/lib/adapters/aws/index.cjs',
        '^@h4ad/serverless-adapter/lib/frameworks/express$':
            '<rootDir>/node_modules/@h4ad/serverless-adapter/lib/frameworks/express/index.cjs'
    },
    coverageThreshold: {
        global: {
            branches: 67,
            functions: 75,
            lines: 75,
            statements: 75
        }
    },
    testPathIgnorePatterns: ['bin/*', 'dist/*', 'node_modules/*', 'coverage/*'],
    collectCoverageFrom: [
        'src/**',
        'scripts/**',
        '!src/configs/**',
        '!scripts/version.js',
        '!src/ssr/server/test_fixtures/**',
        '!src/schemas/**'
    ]
}
