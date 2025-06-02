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

    //NOTE: we manually re-enable tests here until we finish migrating to Chakra v3
    testMatch: [
        '<rootDir>/src/components/footer/**/*.test.js',
        '<rootDir>/src/components/links-list/**/*.test.js',
        '<rootDir>/src/components/icons/**/*.test.js',
        '<rootDir>/src/components/social-icons/**/*.test.js',
        '<rootDir>/src/components/hero/**/*.test.js',
        '<rootDir>/src/components/image-gallery/**/*.test.js',
        '<rootDir>/src/components/display-price/**/*.test.js',
        '<rootDir>/src/components/product-scroller/**/*.test.js',
        '<rootDir>/src/components/product-tile/**/*.test.js',
        '<rootDir>/src/components/swatch-group/**/*.test.js',
        '<rootDir>/src/utils/responsive-image.test.js',
        '<rootDir>/src/pages/home/**/*.test.js',
        '<rootDir>/src/components/toaster/**/*.test.jsx',
        '<rootDir>/src/hooks/use-toast.test.js',
    ],
    moduleNameMapper: {
        ...base.moduleNameMapper,
        '^react$': '<rootDir>/node_modules/react/index.js',
        '^react-router-dom(.*)$': '<rootDir>/node_modules/react-router-dom/index.js',
        '^@tanstack/react-query$':
            '<rootDir>/node_modules/@tanstack/react-query/build/modern/index.cjs',
        '^is-what$': '<rootDir>/node_modules/is-what/dist/cjs/index.cjs',
        '^copy-anything$': '<rootDir>/node_modules/copy-anything/dist/cjs/index.cjs',
        '^@salesforce/cc-datacloud-typescript$':
            '<rootDir>/node_modules/@salesforce/cc-datacloud-typescript/dist/index.js',
        // Chakra v3 use ESM by default, but we need to use CJS for jest 27
        '^@ark-ui/react/(.*)$': [
            '<rootDir>/node_modules/@ark-ui/react/dist/components/$1/index.cjs',
            '<rootDir>/node_modules/@ark-ui/react/dist/components/$1.cjs',
            '<rootDir>/node_modules/@ark-ui/react/dist/providers/$1/index.cjs',
            '<rootDir>/node_modules/@ark-ui/react/dist/providers/$1.cjs'
        ],
        '^@chakra-ui/react/(.*)$': [
            '<rootDir>/node_modules/@chakra-ui/react/dist/cjs/$1/index.cjs',
            '<rootDir>/node_modules/@chakra-ui/react/dist/cjs/index.cjs'
        ],
        '^@chakra-ui/skip-nav/(.*)$': [
            '<rootDir>/node_modules/@chakra-ui/skip-nav/dist/index.js',
            '<rootDir>/node_modules/@chakra-ui/skip-nav/dist/$1.js'
        ],
        '^proxy-compare$': '<rootDir>/node_modules/proxy-compare/dist/cjs/index.js',
        '^uqr$': '<rootDir>/node_modules/uqr/dist/index.cjs',
        // handle pwa-kit extensibility special import
        '^overridable!(.*)': '$1'
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
    // TODO: Revert this threshold once we start adding tests back to the codebase
    coverageThreshold: {
        global: {
            // statements: 73,
            // branches: 60,
            // functions: 65,
            // lines: 74
        }
    },
    // Increase to: 6 x default timeout of 5 seconds
    ...(process.env.CI ? {testTimeout: 30000} : {})
}
