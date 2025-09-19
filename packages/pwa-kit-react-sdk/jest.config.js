/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const base = require('internal-lib-build/configs/jest/jest.config')

module.exports = {
    ...base,
    moduleNameMapper: {
        ...base.moduleNameMapper,
        '^@h4ad/serverless-adapter/lib/handlers/default$':
            '<rootDir>/../pwa-kit-runtime/node_modules/@h4ad/serverless-adapter/lib/handlers/default/index.cjs',
        '^@h4ad/serverless-adapter/lib/resolvers/callback$':
            '<rootDir>/../pwa-kit-runtime/node_modules/@h4ad/serverless-adapter/lib/resolvers/callback/index.cjs',
        '^@h4ad/serverless-adapter/lib/adapters/aws$':
            '<rootDir>/../pwa-kit-runtime/node_modules/@h4ad/serverless-adapter/lib/adapters/aws/index.cjs',
        '^@h4ad/serverless-adapter/lib/frameworks/express$':
            '<rootDir>/../pwa-kit-runtime/node_modules/@h4ad/serverless-adapter/lib/frameworks/express/index.cjs'
    },
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
