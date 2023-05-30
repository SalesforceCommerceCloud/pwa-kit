/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const path = require('path')
const base = require('@salesforce/pwa-kit-dev/configs/jest/jest.config.js')

module.exports = {
    ...base,
    moduleNameMapper: {
        ...base.moduleNameMapper,
        '^react$': '<rootDir>/node_modules/react/index.js',
        '^react-router-dom(.*)$': '<rootDir>/node_modules/react-router-dom/index.js',
        '^@salesforce\/retail-react-app(.*)$': '<rootDir>$1',
        '^@tanstack/react-query$':
            '<rootDir>/node_modules/@tanstack/react-query/build/lib/index.js',
        '^is-what$': '<rootDir>/node_modules/is-what/dist/cjs/index.cjs',
        '^copy-anything$': '<rootDir>/node_modules/copy-anything/dist/cjs/index.cjs'
    },
    setupFilesAfterEnv: [path.join(__dirname, 'jest-setup.js')],
    collectCoverageFrom: [
        'app/**/*.{js,jsx}',
        'non-pwa/**/*.{js,jsx}',
        'worker/**/*.{js,jsx}',
        'scripts/generator/*.{js,jsx}',
        '!app/pages/test-container/**/*.{js,jsx}',
        '!app/utils/test-utils.js',
        '!app/mocks/*.js',
        '!app/main.jsx',
        '!app/loader.js',
        '!app/ssr.js',
        '!app/static/**',
        '!app/theme/**',
        '!node_modules/**'
    ],
    //@TODO: Revert this threshold back to original numbers stattements: 80, branches: 72, functions: 78, lines: 83
    coverageThreshold: {
        global: {
            statements: 73,
            branches: 60,
            functions: 65,
            lines: 74
        }
    },
    // Increase to: 6 x default timeout of 5 seconds
    ...(process.env.CI ? {testTimeout: 30000} : {})
}
