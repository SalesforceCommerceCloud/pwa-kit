/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')

module.exports = {
    transformIgnorePatterns: [
        'node_modules/(?!(jsdom/lib/jsdom/browser/resources/resource-loader))'
    ],
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': path.join(__dirname, 'jest-babel-transform.js')
    },
    setupFiles: [path.join(__dirname, 'setup-jest.js')],
    cacheDirectory: './node_modules/.cache',
    clearMocks: true,
    collectCoverage: true,
    moduleFileExtensions: ['js', 'jsx', 'json', 'ts', 'tsx'],
    moduleNameMapper: {
        '^.+\\.svg$': path.join(__dirname, '__mocks__', 'emptyStringMock.js')
    },
    testPathIgnorePatterns: [
        '/dist/',
        '/temp/',
        '/generator-assets/',
        '/node_modules/',
        '/vendor/'
    ],
    testEnvironment: 'jest-environment-jsdom-global',
    testEnvironmentOptions: {
        resources: 'usable'
    }
}
