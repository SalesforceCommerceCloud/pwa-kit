/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const base = require('@salesforce/pwa-kit-dev/configs/jest/jest.config.js')

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
    coverageThreshold: {
        global: {
            branches: 0,
            functions: 0,
            lines: 0,
            statements: 0
        }
    },
    collectCoverageFrom: ['app/**']
}
