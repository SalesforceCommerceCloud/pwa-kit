/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'path'

module.exports = {
    testURL: 'http://localhost/',
    verbose: true,
    collectCoverage: true,
    // We need access to jsdom globally in tests.
    // jsdom isn't accessible so we need to use this
    // 3rd party test environment wrapper. When we
    // upgrade to jest 28, we can revert back to jsdom.
    testEnvironment: 'jest-environment-jsdom-global',
    testPathIgnorePatterns: ['node_modules', 'build'],
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
            path.join(__dirname, 'mocks', 'fileMock.js'),
        '\\.(svg)$': path.join(__dirname, 'mocks', 'svgMock.js'),
        '\\.(css|less)$': path.join(__dirname, 'mocks', 'styleMock.js')
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
