/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getAppOrigin} from './url'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
const defaultConfig = {
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
        ssrFunctionNodeVersion: '20.x',
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
}
jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => {
    return {
        getConfig: jest.fn()
    }
})

describe('getAppOrigin', () => {
    const OLD_ENV = process.env
    const OLD_WINDOW = global.window
    const TEST_ORIGIN = 'https://www.example.com'
    const FORWARDED_HOST = 'https://www.another-site.com'
    beforeEach(() => {
        jest.resetModules()
        process.env = {...OLD_ENV}
    })

    afterEach(() => {
        process.env = OLD_ENV
        global.window = OLD_WINDOW
    })

    test('returns `process.env.APP_ORIGIN` when on server when useXForwardedHost is false', () => {
        // Simulate being on the server by deleting the window.
        delete global.window
        getConfig.mockReturnValue({
            ...defaultConfig,
            app: {
                useXForwardedHost: false
            }
        })

        // Simulate starting the app server by simply setting the `APP_ORIGIN`
        process.env.APP_ORIGIN = TEST_ORIGIN

        expect(getAppOrigin()).toBe(TEST_ORIGIN)
    })

    test('returns `process.env.APP_ORIGIN` when on server when useXForwardedHost is true', () => {
        // Simulate being on the server by deleting the window.
        delete global.window
        getConfig.mockReturnValue({
            ...defaultConfig,
            app: {
                useXForwardedHost: true
            }
        })

        // Simulate starting the app server by simply setting the `APP_ORIGIN`
        process.env.APP_ORIGIN = TEST_ORIGIN
        process.env.X_FORWARDED_HOST = FORWARDED_HOST

        expect(getAppOrigin()).toBe(FORWARDED_HOST)
    })

    test('returns `window.location.origin` when on client', () => {
        expect(getAppOrigin()).toBe('http://localhost')
    })

    test('throws error when APP_ORIGIN is not defined on server.', () => {
        // Simulate being on the server by deleting the window.
        delete global.window

        // Simulate app server not being initialized.
        process.env.APP_ORIGIN = undefined

        expect(() => {
            getAppOrigin()
        }).toThrow()
    })
})
