/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    getDefaultSite,
    getSites,
    resolveSiteFromUrl
} from '@salesforce/retail-react-app/app/utils/site-utils'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

import mockConfig from '@salesforce/retail-react-app/config/mocks/default'
import {
    getParamsFromPath,
    resolveLocaleFromUrl
} from '@salesforce/retail-react-app/app/utils/site-utils'
jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => {
    const origin = jest.requireActual('@salesforce/pwa-kit-react-sdk/ssr/universal/utils')
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

describe('resolveSiteFromUrl', function () {
    test('throw an error without an arg', () => {
        expect(() => {
            resolveSiteFromUrl()
        }).toThrow()
    })

    test('return site based on the site alias in the url', () => {
        getConfig.mockImplementation(() => mockConfig)
        const result = resolveSiteFromUrl('https://www.example-site.com/us/en-US/women/dress')
        expect(result.id).toBe('site-2')
    })

    test('return default site for home page', () => {
        getConfig.mockImplementation(() => mockConfig)
        const result = resolveSiteFromUrl('https://www.example-site.com/')
        expect(result.id).toBe('site-1')
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
        expect(result.id).toBe('site-2')
    })
})

describe('getDefaultSite', function () {
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

describe('getSites', function () {
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
            getConfig.mockImplementation(() => {
                return {
                    ...mockConfig,
                    app: {
                        ...mockConfig.app,
                        sites: [
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
                    }
                }
            })
            // getSites.mockImplementation(() => {
            //     return
            // })
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
            getConfig.mockImplementation(() => mockConfig)
            const locale = resolveLocaleFromUrl(path)
            expect(locale).toEqual(expectedRes)
        })
    })
})
