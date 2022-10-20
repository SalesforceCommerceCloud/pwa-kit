/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getDefaultSite, getSites, resolveSiteFromUrl} from './site-utils'
import {getConfig} from 'pwa-kit-runtime/utils/ssr-config'

import mockConfig from '../../config/mocks/default'
jest.mock('pwa-kit-runtime/utils/ssr-config', () => {
    const origin = jest.requireActual('pwa-kit-react-sdk/ssr/universal/utils')
    return {
        ...origin,
        getConfig: jest.fn()
    }
})

beforeEach(() => {
    jest.resetModules()
})

afterEach(() => {
    jest.resetAllMocks()
})

describe('resolveSiteFromUrl', function() {
    test('throw an error without an arg', () => {
        expect(() => {
            resolveSiteFromUrl()
        }).toThrow()
    })

    test('return site based on the site alias in the url', () => {
        getConfig.mockImplementation(() => mockConfig)
        const result = resolveSiteFromUrl('https://www.example-site.com/us/en-US/women/dress')
        expect(result.id).toEqual('site-2')
    })

    test('return default site for home page', () => {
        getConfig.mockImplementation(() => mockConfig)
        const result = resolveSiteFromUrl('https://www.example-site.com/')
        expect(result.id).toEqual('site-1')
    })

    test('throw an error when no matching site can be found', () => {
        // Mock the  `default` config to the window global
        const newConfig = {
            ...mockConfig,
            app: {
                ...mockConfig.app,
                defaultSite: 'site-3'
            }
        }

        getConfig.mockImplementation(() => newConfig)
        expect(() => {
            resolveSiteFromUrl('https://www.example-site.com/site-3')
        }).toThrow()
    })

    test('returns correct site when aliases are not declared in the config', () => {
        getConfig.mockImplementation(() => {
            return {
                ...mockConfig,
                app: {
                    ...mockConfig.app,
                    siteAliases: {},
                    defaultSite: 'site-2'
                }
            }
        })

        const result = resolveSiteFromUrl('https://www.example-site.com/')
        expect(result.id).toEqual('site-2')
    })
})

describe('getDefaultSite', function() {
    test('returns expected default site when there is only one site in the site list', () => {
        const siteMock = {
            id: 'site-a',
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
        }
        getConfig.mockImplementation(() => ({
            app: {
                ...mockConfig.app,
                sites: [siteMock]
            }
        }))

        const defaultSite = getDefaultSite()
        expect(defaultSite).toEqual(siteMock)
    })

    test('returns site-2 as the default site according to the config', () => {
        getConfig.mockImplementation(() => ({
            app: {
                ...mockConfig.app,
                defaultSite: 'site-2'
            }
        }))

        const expectedRes = {
            alias: 'us',
            id: 'site-2',
            l10n: {
                defaultLocale: 'en-US',
                defaultCurrency: 'USD',
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

        const defaultSite = getDefaultSite()
        expect(defaultSite).toEqual(expectedRes)
    })
})

describe('getSites', function() {
    test('returns site list with alias', () => {
        getConfig.mockImplementation(() => mockConfig)
        const sites = getSites()
        const expectedRes = [
            {
                id: 'site-1',
                alias: 'uk',
                l10n: {
                    defaultLocale: 'en-GB',
                    defaultCurrency: 'GBP',
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
                    defaultCurrency: 'USD',
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
        expect(sites).toEqual(expectedRes)
    })

    test('throw error when there is no sites in the config', () => {
        getConfig.mockImplementation(() => ({
            ...mockConfig.app,
            sites: []
        }))

        expect(() => {
            getSites()
        }).toThrow()
    })
})
