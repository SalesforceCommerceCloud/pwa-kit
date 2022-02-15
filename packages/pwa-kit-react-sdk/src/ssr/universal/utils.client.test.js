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

describe('getConfig (client-side)', () => {
    const config = {app: {}}
    beforeEach(() => {
        global.__APPCONFIG__ = config
    })
    afterEach(() => {
        delete global.__APPCONFIG__
    })
    test('should return the config set on window.__APPCONFIG__', () => {
        expect(utils.getConfig()).toEqual(config)
    })
})
