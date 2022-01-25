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
    testEnvironment: 'jsdom',
    testPathIgnorePatterns: ['node_modules', 'build'],
    moduleNameMapper: {
        '\\.(jpg|jpeg|png|gif|eot|otf|webp|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': path.join(
            __dirname,
            '__mocks__/fileMock.js'
        ),
        '\\.(svg)$': path.join(__dirname, '__mocks__/svgMock.js'),
        '\\.(css|less)$': path.join(__dirname, '__mocks__/styleMock.js')
    },
    setupFilesAfterEnv: [path.join(__dirname, 'jest-setup.js')],
    globals: {
        DEBUG: true,
        NODE_ENV: 'test',
        Progressive: {
            buildOrigin: '/mobify/bundle/development/'
        }
    },
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': path.join(__dirname, 'jest-babel-transform.js')
    }
}
