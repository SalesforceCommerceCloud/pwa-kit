/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as utils from './utils'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {getEnvBasePath} from '@salesforce/pwa-kit-runtime/utils/ssr-namespace-paths'

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config')
jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-namespace-paths')

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

describe('getBasename (client-side)', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    test('should return basename when showBasename is true', () => {
        const mockBasename = '/test-base'
        getEnvBasePath.mockReturnValue(mockBasename)
        getConfig.mockReturnValue({
            app: {
                url: {
                    showBasename: true
                }
            }
        })

        expect(utils.getBasename()).toBe(mockBasename)
    })

    test('should return empty string when showBasename is undefined', () => {
        getConfig.mockReturnValue({
            app: {
                url: {}
            }
        })

        expect(utils.getBasename()).toBe('')
    })

    test('should return empty string when showBasename is false', () => {
        getConfig.mockReturnValue({
            app: {
                url: {
                    showBasename: false
                }
            }
        })

        expect(utils.getBasename()).toBe('')
    })

    test('should return empty string when app config is missing', () => {
        getConfig.mockReturnValue({})

        expect(utils.getBasename()).toBe('')
    })
})
