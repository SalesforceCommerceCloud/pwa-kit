/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
module.exports = {
    testEnvironment: 'node',
    verbose: true,
    collectCoverage: true,
    testPathIgnorePatterns: ['node_modules', 'dist'],
    collectCoverageFrom: ['src/**/*.{js,jsx}', 'scripts/**/*.{js,jsx}', '!node_modules/**'],
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': './jest-babel-transform.js'
    }
}
