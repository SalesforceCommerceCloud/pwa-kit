/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as utils from './utils'
import EventEmitter from 'events'
import {flatten, getParamsFromPath, shallowEquals} from './utils'
import {getSites} from './site-utils'

jest.mock('./site-utils', () => {
    const origin = jest.requireActual('./site-utils')
    return {
        ...origin,
        getSites: jest.fn()
    }
})

describe('requestIdleCallback should be a working shim', () => {
    test('without a working implementation built in', () => {
        return new Promise((resolve) => {
            utils.requestIdleCallback(resolve)
        })
    })

    test('with a working implementation built in', () => {
        window.requestIdleCallback = (fn) => setTimeout(() => fn(), 1)
        return new Promise((resolve) => {
            utils.requestIdleCallback(resolve)
        })
    })
})

describe('WatchOnlineStatus', () => {
    test('responds to offline/online events', () => {
        const emitter = new EventEmitter()
        const win = {
            addEventListener: emitter.addListener.bind(emitter),
            removeEventListener: emitter.removeListener.bind(emitter)
        }
        const collected = []
        const callback = (isOnline) => collected.push(isOnline)
        const unsubscribe = utils.watchOnlineStatus(callback, win)
        emitter.emit('online')
        emitter.emit('offline')
        emitter.emit('online')
        expect(collected).toEqual([true, false, true])
        unsubscribe()
        expect(emitter.listenerCount('online')).toBe(0)
        expect(emitter.listenerCount('offline')).toBe(0)
    })
})

describe('boldString & Capitalize test', () => {
    test('boldString returns provided part of string bolded html', () => {
        const boldedString = utils.boldString('boldedString', 'bolded')
        expect(boldedString).toEqual('<b>bolded</b>String')
    })

    test('capitalize capitalizes a string', () => {
        const stringToCapitlize = utils.capitalize('capitalize string test')
        expect(stringToCapitlize).toEqual('Capitalize String Test')
    })
})

describe('session storage tests', () => {
    test('sets,gets and removes item in session storage', () => {
        utils.setSessionJSONItem('test', ['text'])
        let testing = utils.getSessionJSONItem('test')
        expect(testing.length).toEqual(1)
        utils.clearSessionJSONItem('test')
        testing = utils.getSessionJSONItem('test')
        expect(testing).not.toBeDefined()
    })
})

describe('flatten', () => {
    test('return a an array', () => {
        const result = flatten({
            id: 1,
            item: 1,
            children: [{id: 2, item: 2, children: [{id: 3, item: 3}]}]
        })

        expect(JSON.stringify(result)).toEqual(
            '{"1":{"id":1,"item":1,"children":[{"id":2,"item":2,"children":[{"id":3,"item":3}]}]},"2":{"id":2,"item":2,"children":[{"id":3,"item":3}]},"3":{"id":3,"item":3}}'
        )
    })
})

describe('shallow', function() {
    test('should return false', () => {
        const a = {a: '123'}
        const b = {a: '123', b: '456'}
        const result = shallowEquals(a, b)
        expect(result).toBeFalsy()
    })
})

describe('getParamsFromPath', function() {
    getSites.mockImplementation(() => {
        return [
            {
                id: 'RefArch',
                alias: 'us',
                l10n: {
                    supportedCurrencies: ['USD'],
                    defaultCurrency: 'USD',
                    defaultLocale: 'en-US',
                    supportedLocales: [
                        {
                            id: 'en-US',
                            alias: 'en',
                            preferredCurrency: 'USD'
                        },
                        {
                            id: 'en-CA',
                            alias: 'ca',
                            preferredCurrency: 'USD'
                        }
                    ]
                }
            },
            {
                id: 'RefArchGlobal',
                alias: 'global',
                l10n: {
                    supportedCurrencies: ['GBP', 'EUR', 'CNY', 'JPY'],
                    defaultCurrency: 'GBP',
                    supportedLocales: [
                        {
                            id: 'de-DE',
                            preferredCurrency: 'EUR'
                        },
                        {
                            id: 'en-GB',
                            alias: 'uk',
                            preferredCurrency: 'GBP'
                        }
                    ],
                    defaultLocale: 'en-GB'
                }
            }
        ]
    })
    const cases = [
        {path: '/us/en-US/', expectedRes: {site: 'us', locale: 'en-US'}},
        {path: '/us/en-US', expectedRes: {site: 'us', locale: 'en-US'}},
        {path: '/us/en', expectedRes: {site: 'us', locale: 'en'}},
        {path: '/us/en/', expectedRes: {site: 'us', locale: 'en'}},
        {path: '/RefArch/en-US/', expectedRes: {site: 'RefArch', locale: 'en-US'}},
        {path: '/RefArch/en/', expectedRes: {site: 'RefArch', locale: 'en'}},
        {path: '/us/en-US/category/womens', expectedRes: {site: 'us', locale: 'en-US'}},
        {
            path: '/RefArch/en-US/category/womens',
            expectedRes: {site: 'RefArch', locale: 'en-US'}
        },
        {path: '/en-US/category/womens', expectedRes: {site: undefined, locale: 'en-US'}},
        {path: '/en/category/womens', expectedRes: {site: undefined, locale: 'en'}},
        {path: '/category/womens', expectedRes: {site: undefined, locale: undefined}},
        {path: '/en/', expectedRes: {site: undefined, locale: 'en'}},
        {path: '/en', expectedRes: {site: undefined, locale: 'en'}},
        {path: '/ca/', expectedRes: {site: undefined, locale: 'ca'}},
        {path: '/ca', expectedRes: {site: undefined, locale: 'ca'}},
        {path: '/', expectedRes: {site: undefined, locale: undefined}},
        {path: '/?site=us', expectedRes: {site: 'us', locale: undefined}},
        {path: '/?site=us&locale=en', expectedRes: {site: 'us', locale: 'en'}},
        {path: '/en-US/category/womens?site=us', expectedRes: {site: 'us', locale: 'en-US'}},
        {path: '/us/category/womens?locale=en-US', expectedRes: {site: 'us', locale: 'en-US'}},
        {path: '/us/category/womens?locale=en', expectedRes: {site: 'us', locale: 'en'}},
        {path: '/category/womens?site=us&locale=en-US', expectedRes: {site: 'us', locale: 'en-US'}},
        {
            path: '/category/womens?site=RefArch&locale=en-US',
            expectedRes: {site: 'RefArch', locale: 'en-US'}
        }
    ]
    cases.forEach(({path, expectedRes}) => {
        test(`return expected values when path is ${path}`, () => {
            expect(getParamsFromPath(path)).toEqual(expectedRes)
        })
    })
})
