/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import Enzyme from 'enzyme'
import 'regenerator-runtime/runtime'

// DANGEROUS: this enzyme React 17 adapter is unofficial
// because the official adaptor is still in development
// see https://github.com/enzymejs/enzyme/issues/2429
import Adapter from '@wojtekmaj/enzyme-adapter-react-17'

Enzyme.configure({adapter: new Adapter()})

// Mock the application configuration to be used in all tests.
jest.mock('pwa-kit-runtime/utils/ssr-config', () => {
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
                ssrFunctionNodeVersion: '14.x',
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
