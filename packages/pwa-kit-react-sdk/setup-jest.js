/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-env jest */

import 'regenerator-runtime/runtime'
import '@testing-library/jest-dom'
// Mock the application configuration to be used in all tests.
jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => {
    return {
        getConfig: () => ({
            externals: [],
            pageNotFoundURL: '/page-not-found',
            ssrEnabled: true,
            ssrOnly: ['ssr.js', 'ssr.js.map', 'node_modules/**/*.*'],
            ssrShared: [
                'static/ico/favicon.ico',
                'static/robots.txt',
                '**/*.js',
                '**/*.js.map',
                '**/*.json'
            ],
            ssrParameters: {
                ssrFunctionNodeVersion: '16.x',
                proxyConfigs: [
                    {
                        host: 'kv7kzm78.api.commercecloud.salesforce.com',
                        path: 'api'
                    },
                    {
                        host: 'zzrf-001.dx.commercecloud.salesforce.com',
                        path: 'ocapi'
                    }
                ]
            }
        })
    }
})
