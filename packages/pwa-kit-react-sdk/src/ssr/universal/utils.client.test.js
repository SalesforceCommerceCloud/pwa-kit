/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as utils from './utils'

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
