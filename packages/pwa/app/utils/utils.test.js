/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import * as utils from './utils'
import EventEmitter from 'events'
import {flatten, getSiteId, shallowEquals} from './utils'

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

describe('get site Id', function() {
    test('return site id based on different hostname', () => {
        const appConfig = {
            defaultSiteId: 'RefArchGlobal',
            sites: [
                {
                    id: 'RefArch',
                    alias: 'us',
                    hostname: ['company.co.uk'],
                    l10n: {
                        defaultLocale: 'en-US',
                        supportedLocales: ['en-US']
                    }
                },
                {
                    id: 'RefArchGlobal',
                    alias: 'global',
                    hostname: ['company.com'],
                    l10n: {
                        defaultLocale: 'en-GB',
                        supportedLocales: ['en-GB', 'ja-JP', 'fr-FR']
                    }
                }
            ]
        }

        const currentUrl = new URL('https://company.co.uk/')
        const siteId = getSiteId(appConfig, '/', currentUrl)
        expect(siteId).toEqual('RefArch')
    })

    test('return site id by using the default value', () => {
        const appConfig = {
            defaultSiteId: 'siteId-1',
            sites: [
                {
                    id: 'siteId-1',
                    alias: 'us',
                    hostname: ['company.co.uk'],
                    l10n: {
                        defaultLocale: 'en-US',
                        supportedLocales: ['en-US']
                    }
                },
                {
                    id: 'siteId-2',
                    alias: 'global',
                    hostname: ['company.co.uk'],
                    l10n: {
                        defaultLocale: 'en-GB',
                        supportedLocales: ['en-GB', 'ja-JP', 'fr-FR']
                    }
                }
            ]
        }

        const currentUrl = new URL('https://company.co.uk/')
        const siteId = getSiteId(appConfig, '/', currentUrl)
        expect(siteId).toEqual('siteId-1')
    })

    test('return site id based on the siteAlias param from the pathname', () => {
        const appConfig = {
            defaultSiteId: 'siteId-2',
            sites: [
                {
                    id: 'siteId-1',
                    alias: 'us',
                    hostname: [],
                    l10n: {
                        defaultLocale: 'en-US',
                        supportedLocales: ['en-US']
                    }
                },
                {
                    id: 'siteId-2',
                    alias: 'global',
                    hostname: [],
                    l10n: {
                        defaultLocale: 'en-GB',
                        supportedLocales: ['en-GB', 'ja-JP', 'fr-FR']
                    }
                }
            ]
        }

        const pathname = '/global/en-GB/women/dress'
        const currentUrl = 'https://example.org'
        const siteId = getSiteId(appConfig, pathname, currentUrl)
        expect(siteId).toEqual('siteId-2')
    })

    test('throw error when there is default value is not in the sites configuration on home page', () => {
        const appConfig = {
            defaultSiteId: 'site-2',
            sites: [
                {
                    id: 'siteId-1',
                    alias: 'us',
                    hostname: [],
                    l10n: {
                        defaultLocale: 'en-US',
                        supportedLocales: ['en-US']
                    }
                },
                {
                    id: 'siteId-2',
                    alias: 'global',
                    hostname: [],
                    l10n: {
                        defaultLocale: 'en-GB',
                        supportedLocales: ['en-GB', 'ja-JP', 'fr-FR']
                    }
                }
            ]
        }

        const pathname = '/'
        const currentUrl = 'https://example.org'

        expect(() => getSiteId(appConfig, pathname, currentUrl)).toThrow(
            'The default SiteId does not match any values from the site configuration. Please check your config'
        )
    })
})
