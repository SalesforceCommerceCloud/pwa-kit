/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const base = require('pwa-kit-build/configs/jest/jest.config.js')

module.exports = {
    ...base,
    moduleNameMapper: {
        ...base.moduleNameMapper,
        '^react-router-dom(.*)$': '<rootDir>/node_modules/react-router-dom/index.js'
    },
    collectCoverageFrom: [
        'app/**/*.{js,jsx}',
        'non-pwa/**/*.{js,jsx}',
        'worker/**/*.{js,jsx}',
        'scripts/generator/*.{js,jsx}',
        '!app/pages/test-container/**/*.{js,jsx}',
        '!app/utils/test-utils.js',
        '!app/commerce-api/mocks/*js',
        '!app/main.jsx',
        '!app/loader.js',
        '!app/ssr.js',
        '!app/static/**',
        '!app/theme/**',
        '!node_modules/**'
    ],
    coverageThreshold: {
        global: {
            statements: 80,
            branches: 72,
            functions: 78,
            lines: 83
        }
    }
}
