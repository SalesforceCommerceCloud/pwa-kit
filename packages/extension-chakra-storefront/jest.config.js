/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const path = require('path')
const base = require('@salesforce/pwa-kit-dev/configs/jest/jest.config.js')

const createTestGlob = (relativePath) => {
    return `<rootDir>/src/${relativePath}/**/*.test.{js,jsx,ts,tsx}`
}

module.exports = {
    ...base,

    //NOTE: we manually re-enable tests here until we finish migrating to Chakra v3
    testMatch: [
        createTestGlob('components/display-price'),
        createTestGlob('components/fade'),
        createTestGlob('components/footer'),
        createTestGlob('components/hero'),
        createTestGlob('components/icons'),
        createTestGlob('components/image-gallery'),
        createTestGlob('components/drawer-menu'),
        createTestGlob('components/error'),
        createTestGlob('components/header'),
        createTestGlob('components/links-list'),
        createTestGlob('components/locale-selector'),
        createTestGlob('components/nested-accordion'),
        createTestGlob('components/pagination'),
        createTestGlob('components/product-scroller'),
        createTestGlob('components/product-tile'),
        createTestGlob('components/product-view'),
        createTestGlob('components/promo-popover'),
        createTestGlob('components/quantity-picker'),
        createTestGlob('components/search'),
        createTestGlob('components/social-icons'),
        createTestGlob('components/swatch-group'),
        createTestGlob('components/toaster'),
        createTestGlob('components/list-menu'),
        createTestGlob('components/login'),
        createTestGlob('components/register'),
        createTestGlob('components/email-confirmation'),
        createTestGlob('components/field'),
        createTestGlob('components/reset-password'),
        createTestGlob('components/with-registration'),
        createTestGlob('components/social-login'),
        createTestGlob('components/toggle-card'),
        createTestGlob('pages/home'),
        createTestGlob('pages/cart'),
        createTestGlob('pages/product-list'),
        createTestGlob('components/offline-banner'),
        createTestGlob('components/offline-boundary'),
        // createTestGlob('pages/login'),  // TODO: enable after Account page has been migrated
        createTestGlob('pages/login-redirect'),
        createTestGlob('pages/social-login-redirect'),
        createTestGlob('hooks/cart'),
        // createTestGlob('pages/registration'), // TODO: enable after Account page has been migrated
        '<rootDir>/src/pages/checkout/partials/contact-info.test.js',
        '<rootDir>/src/pages/checkout/partials/login-state.test.js',
        '<rootDir>/src/pages/account/orders.test.js',
        '<rootDir>/src/pages/account/wishlist/index.test.js',
        '<rootDir>/src/utils/responsive-image.test.js',
        '<rootDir>/src/hooks/use-errors.test.js',
        '<rootDir>/src/hooks/use-toast.test.js',
        '<rootDir>/src/pages/product-detail/metadata.test.js',
        '<rootDir>/src/pages/product-list/metadata.test.js',
        '<rootDir>/src/hooks/use-toast.test.js',
        '<rootDir>/src/hooks/use-dnt-notification.test.js'
        // '<rootDir>/src/hooks/use-auth-modal.test.js' // TODO: enable after Account page has been migrated
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
        'src/**/*.{js,jsx}',
        'app/**/*.{js,jsx}',
        'non-pwa/**/*.{js,jsx}',
        'worker/**/*.{js,jsx}',
        'scripts/generator/*.{js,jsx}',
        'src/**/*.{js,jsx}',
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
