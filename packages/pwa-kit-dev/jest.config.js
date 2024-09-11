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
    ],
    moduleNameMapper: {
        // Handle tsx module imports
        'tsx/cjs/api': '<rootDir>/node_modules/tsx/dist/cjs/api/index.cjs',

        // General case for setup-server files with various extensions
        '^src/ssr/server/test_fixtures/node_modules/(.+)/src/setup-server\\.(js|ts)$':
            '<rootDir>/src/ssr/server/test_fixtures/node_modules/$1/src/setup-server.$2',

        // Specific known extensions
        '^src/ssr/server/test_fixtures/node_modules/test-extension/src/setup-server\\.(js|ts)$':
            '<rootDir>/src/ssr/server/test_fixtures/node_modules/test-extension/src/setup-server.$1',
        '^src/ssr/server/test_fixtures/node_modules/ts-extension/src/setup-server\\.(js|ts)$':
            '<rootDir>/src/ssr/server/test_fixtures/node_modules/ts-extension/src/setup-server.$1',
        '^src/ssr/server/test_fixtures/node_modules/another-extension/src/setup-server\\.(js|ts)$':
            '<rootDir>/src/ssr/server/test_fixtures/node_modules/another-extension/src/setup-server.$1',
        '^src/ssr/server/test_fixtures/node_modules/extension-with-bad-setup-server/src/setup-server\\.(js|ts)$':
            '<rootDir>/src/ssr/server/test_fixtures/node_modules/extension-with-bad-setup-server/src/setup-server.$1',
        '^src/ssr/server/test_fixtures/node_modules/extension-with-setup-server-no-default-export/src/setup-server\\.(js|ts)$':
            '<rootDir>/src/ssr/server/test_fixtures/node_modules/extension-with-setup-server-no-default-export/src/setup-server.$1'
    },

    transformIgnorePatterns: [
        '<rootDir>/node_modules/',
        '!<rootDir>/src/ssr/server/test_fixtures/node_modules/',
        '/tsx/dist/cjs/api/index.cjs'
    ]
}
