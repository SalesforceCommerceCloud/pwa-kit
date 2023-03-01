/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as utils from './utils'
import EventEmitter from 'events'
import {flatten, getParamsFromPath, resolveLocaleFromUrl, shallowEquals} from './utils'
import {getSites} from './site-utils'

afterEach(() => {
    jest.clearAllMocks()
})

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

describe('escapeRegexChars', () => {
    test('escapes special characters', () => {
        const escapedString = utils.escapeRegexChars('{}()*+?.,\\^$|#')
        expect(escapedString).toEqual('\\{\\}\\(\\)\\*\\+\\?\\.\\,\\\\\\^\\$\\|\\#')
    })
})

describe('boldString & Capitalize test', () => {
    test('boldString returns provided part of string bolded html', () => {
        const boldedString = utils.boldString('boldedString', 'bolded')
        expect(boldedString).toEqual('<b>bolded</b>String')
    })

    test('boldString handles special regex characters', () => {
        const boldedString = utils.boldString('some (*special!) chars', '(*special!)')
        expect(boldedString).toEqual('some <b>(*special!)</b> chars')
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

describe('shallow', function () {
    test('should return false', () => {
        const a = {a: '123'}
        const b = {a: '123', b: '456'}
        const result = shallowEquals(a, b)
        expect(result).toBeFalsy()
    })
})

describe('getParamsFromPath', function () {
    const cases = [
        {path: '/us/en-US/', expectedRes: {siteRef: 'us', localeRef: 'en-US'}},
        {path: '/us/en-US', expectedRes: {siteRef: 'us', localeRef: 'en-US'}},
        {path: '/us/en', expectedRes: {siteRef: 'us', localeRef: 'en'}},
        {path: '/us/en/', expectedRes: {siteRef: 'us', localeRef: 'en'}},
        {path: '/RefArch/en-US/', expectedRes: {siteRef: 'RefArch', localeRef: 'en-US'}},
        {path: '/RefArch/en/', expectedRes: {siteRef: 'RefArch', localeRef: 'en'}},
        {path: '/us/en-US/category/womens', expectedRes: {siteRef: 'us', localeRef: 'en-US'}},
        {
            path: '/RefArch/en-US/category/womens',
            expectedRes: {siteRef: 'RefArch', localeRef: 'en-US'}
        },
        {path: '/en-US/category/womens', expectedRes: {siteRef: undefined, localeRef: 'en-US'}},
        {path: '/en/category/womens', expectedRes: {siteRef: undefined, localeRef: 'en'}},
        {path: '/category/womens', expectedRes: {siteRef: undefined, localeRef: undefined}},
        {path: '/en/', expectedRes: {siteRef: undefined, localeRef: 'en'}},
        {path: '/en', expectedRes: {siteRef: undefined, localeRef: 'en'}},
        {path: '/ca/', expectedRes: {siteRef: undefined, localeRef: 'ca'}},
        {path: '/ca', expectedRes: {siteRef: undefined, localeRef: 'ca'}},
        {path: '/', expectedRes: {site: undefined, localeRef: undefined}},
        {path: '/?site=us', expectedRes: {siteRef: 'us', localeRef: undefined}},
        {path: '/?site=us&locale=en', expectedRes: {siteRef: 'us', localeRef: 'en'}},
        {path: '/en-US/category/womens?site=us', expectedRes: {siteRef: 'us', localeRef: 'en-US'}},
        {
            path: '/us/category/womens?locale=en-US',
            expectedRes: {siteRef: 'us', localeRef: 'en-US'}
        },
        {path: '/us/category/womens?locale=en', expectedRes: {siteRef: 'us', localeRef: 'en'}},
        {
            path: '/category/womens?site=us&locale=en-US',
            expectedRes: {siteRef: 'us', localeRef: 'en-US'}
        },
        {
            path: '/category/womens?site=RefArch&locale=en-US',
            expectedRes: {siteRef: 'RefArch', localeRef: 'en-US'}
        }
    ]
    cases.forEach(({path, expectedRes}) => {
        test(`return expected values when path is ${path}`, () => {
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
            expect(getParamsFromPath(path)).toEqual(expectedRes)
        })
    })
})

describe('resolveLocaleFromUrl', function () {
    const cases = [
        {
            path: '/',
            expectedRes: {
                id: 'en-GB',
                preferredCurrency: 'GBP'
            }
        },
        {
            path: '/uk/en-GB/women/dresses',
            expectedRes: {
                id: 'en-GB',
                preferredCurrency: 'GBP'
            }
        },
        {
            path: '/women/dresses/?site=uk&locale=en-GB',
            expectedRes: {
                id: 'en-GB',
                preferredCurrency: 'GBP'
            }
        },
        {
            path: '/uk/fr/women/dresses',
            expectedRes: {
                id: 'fr-FR',
                alias: 'fr',
                preferredCurrency: 'EUR'
            }
        },
        {
            path: '/women/dresses/?site=uk&locale=fr',
            expectedRes: {
                id: 'fr-FR',
                alias: 'fr',
                preferredCurrency: 'EUR'
            }
        },
        {
            path: '/us/en-US/women/dresses',
            expectedRes: {
                id: 'en-US',
                preferredCurrency: 'USD'
            }
        },
        {
            path: '/women/dresses/?site=us&locale=en-US',
            expectedRes: {
                id: 'en-US',
                preferredCurrency: 'USD'
            }
        }
    ]
    cases.forEach(({path, expectedRes}) => {
        test(`returns expected locale with given path ${path}`, () => {
            getSites.mockImplementation(() => {
                return [
                    {
                        id: 'site-1',
                        alias: 'uk',
                        l10n: {
                            defaultLocale: 'en-GB',
                            supportedLocales: [
                                {
                                    id: 'en-GB',
                                    preferredCurrency: 'GBP'
                                },
                                {
                                    id: 'fr-FR',
                                    alias: 'fr',
                                    preferredCurrency: 'EUR'
                                },
                                {
                                    id: 'it-IT',
                                    preferredCurrency: 'EUR'
                                }
                            ]
                        }
                    },
                    {
                        id: 'site-2',
                        alias: 'us',
                        l10n: {
                            defaultLocale: 'en-US',
                            supportedLocales: [
                                {
                                    id: 'en-US',
                                    preferredCurrency: 'USD'
                                },
                                {
                                    id: 'en-CA',
                                    preferredCurrency: 'USD'
                                }
                            ]
                        }
                    }
                ]
            })
            const locale = resolveLocaleFromUrl(path)
            expect(locale).toEqual(expectedRes)
        })
    })
})
