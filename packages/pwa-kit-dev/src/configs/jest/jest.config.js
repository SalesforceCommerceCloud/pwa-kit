/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'path'

module.exports = {
    verbose: true,
    collectCoverage: true,
    testEnvironment: 'jest-environment-jsdom-global',
    testEnvironmentOptions: {
        url: 'http://localhost/',
        // Prevent jest-environment-jsdom from using 'browser' export conditions (Jest 29+).
        // Without this, packages like uuid and nanoid resolve to ESM browser builds
        // that Jest cannot parse in a CJS context.
        customExportConditions: ['node', 'node-addons']
    },
    testPathIgnorePatterns: ['node_modules', 'build'],
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
            path.join(__dirname, 'mocks', 'fileMock.js'),
        '\\.(svg)$': path.join(__dirname, 'mocks', 'svgMock.js'),
        '\\.(css|less)$': path.join(__dirname, 'mocks', 'styleMock.js'),
        '^@h4ad/serverless-adapter/lib/(.*)$':
            '<rootDir>/node_modules/@h4ad/serverless-adapter/lib/$1/index.cjs'
    },
    globals: {
        DEBUG: true,
        NODE_ENV: 'test',
        Progressive: {
            // BuildOrigin can be any non-empty string. It does not have to be /mobify/xyz
            // This is used by tests that call getAssetUrl in pwa-kit-react-sdk to simulate
            // asset urls.
            buildOrigin: '/mobify/bundle/development/'
        }
    },
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': path.join(__dirname, 'jest-babel-transform.js')
    }
}
