/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as utils from './utils'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {getEnvBasePath} from '@salesforce/pwa-kit-runtime/utils/ssr-namespace-paths'

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: jest.fn()
}))
jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-namespace-paths', () => ({
    getEnvBasePath: jest.fn()
}))

describe('getProxyConfigs (client-side)', () => {
    const configs = [{foo: 'bar'}]
    beforeEach(() => {
        global.Progressive = {ssrOptions: {proxyConfigs: configs}}
    })
    afterEach(() => {
        delete global.Progressive
    })
    test('should return proxy configs set on window.Progressive', () => {
        expect(utils.getProxyConfigs()).toEqual(configs)
    })
    test('should return empty array when ssrOptions is missing', () => {
        global.Progressive = {}
        expect(utils.getProxyConfigs()).toEqual([])
    })
    test('should return empty array when proxyConfigs is missing', () => {
        global.Progressive = {ssrOptions: {}}
        expect(utils.getProxyConfigs()).toEqual([])
    })
})

describe('getAssetUrl (client-side)', () => {
    beforeEach(() => {
        global.Progressive = {buildOrigin: 'test.com'}
    })
    afterEach(() => {
        delete global.Progressive
    })
    test('should return build origin when path is undefined', () => {
        expect(utils.getAssetUrl()).toBe('test.com')
    })
    test('should return origin + path', () => {
        expect(utils.getAssetUrl('/path')).toBe('test.com/path')
    })
})

describe('getRouterBasePath (client-side)', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('should return base path when showBasePath is true', () => {
        const mockBasePath = '/test-base'
        getEnvBasePath.mockReturnValue(mockBasePath)
        getConfig.mockReturnValue({
            app: {
                url: {
                    showBasePath: true
                }
            }
        })

        expect(utils.getRouterBasePath()).toBe(mockBasePath)
    })

    test('should return empty string when showBasePath is undefined', () => {
        getConfig.mockReturnValue({
            app: {
                url: {}
            }
        })

        expect(utils.getRouterBasePath()).toBe('')
    })

    test('should return empty string when showBasePath is false', () => {
        getConfig.mockReturnValue({
            app: {
                url: {
                    showBasePath: false
                }
            }
        })

        expect(utils.getRouterBasePath()).toBe('')
    })

    test('should return empty string when app config is missing', () => {
        getConfig.mockReturnValue({})

        expect(utils.getRouterBasePath()).toBe('')
    })

    test('should return empty string when getConfig returns null', () => {
        getConfig.mockReturnValue(null)

        expect(utils.getRouterBasePath()).toBe('')
    })
})
