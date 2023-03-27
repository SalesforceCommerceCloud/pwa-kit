/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getSites} from './site-utils'
import {
    buildUrlSet,
    categoryUrlBuilder,
    productUrlBuilder,
    searchUrlBuilder,
    getPathWithLocale,
    rebuildPathWithParams,
    removeQueryParamsFromPath,
    absoluteUrl,
    createUrlTemplate,
    removeSiteLocaleFromPath,
    getParamsFromPath,
    resolveLocaleFromUrl
} from './url'
import {getUrlConfig} from './utils'
import mockConfig from '../../config/mocks/default'

afterEach(() => {
    jest.clearAllMocks()
})

jest.mock('pwa-kit-react-sdk/utils/url', () => {
    const original = jest.requireActual('pwa-kit-react-sdk/utils/url')
    return {
        ...original,
        getAppOrigin: jest.fn(() => 'https://www.example.com')
    }
})
jest.mock('./site-utils', () => {
    const original = jest.requireActual('./site-utils')
    return {
        ...original,
        getSites: jest.spyOn(original, 'getSites')
    }
})
jest.mock('./utils', () => {
    const original = jest.requireActual('./utils')
    return {
        ...original,
        getConfig: jest.fn(),
        getUrlConfig: jest.fn()
    }
})

beforeEach(() => {
    getConfig.mockReset().mockReturnValue(mockConfig)
})

afterEach(() => {
    jest.clearAllMocks()
})

describe('buildUrlSet returns the expected set of urls', () => {
    test('when no values are passed in', () => {
        const set = buildUrlSet()

        expect(set).toEqual([])
    })

    test('when the values array is not empty', () => {
        const set = buildUrlSet('/mens/clothing', 'offset', [0, 5, 10])

        expect(set).toEqual([
            '/mens/clothing?offset=0',
            '/mens/clothing?offset=5',
            '/mens/clothing?offset=10'
        ])
    })

    test('when the values array is empty', () => {
        const set = buildUrlSet('/mens/clothing', 'offset', [])

        expect(set).toEqual([])
    })

    test('when extra parameters are provided', () => {
        const set = buildUrlSet('/mens/clothing', 'offset', [0, 5, 10], {sort: 'high-to-low'})

        expect(set).toEqual([
            '/mens/clothing?offset=0&sort=high-to-low',
            '/mens/clothing?offset=5&sort=high-to-low',
            '/mens/clothing?offset=10&sort=high-to-low'
        ])
    })

    test('when url has existing params', () => {
        const set = buildUrlSet('/mens/clothing?sort=high-to-low', 'offset', [0, 5, 10])

        expect(set).toEqual([
            '/mens/clothing?sort=high-to-low&offset=0',
            '/mens/clothing?sort=high-to-low&offset=5',
            '/mens/clothing?sort=high-to-low&offset=10'
        ])
    })

    test('when valueless params are present', () => {
        const set = buildUrlSet('/mens/clothing?server_only', 'offset', [0, 5, 10])

        expect(set).toEqual([
            '/mens/clothing?server_only&offset=0',
            '/mens/clothing?server_only&offset=5',
            '/mens/clothing?server_only&offset=10'
        ])
    })
})

describe('url builder test', () => {
    // Save the original `window.location` object to not affect other test
    const originalLocation = window.location

    beforeEach(() => {
        delete window.location
        window.location = {...originalLocation, assign: jest.fn()}
    })
    afterEach(() => {
        // Restore `window.location` to the `jsdom` `Location` object
        window.location = originalLocation
    })
    test('searchUrlBuilder returns expect', () => {
        const url = searchUrlBuilder('term')

        expect(url).toEqual('/search?q=term')
    })

    test('searchUrlBuilder returns expect with & symbol', () => {
        const url = searchUrlBuilder('term&term')

        expect(url).toEqual('/search?q=term%26term')
    })

    test('productUrlBuilder returns expect', () => {
        const url = productUrlBuilder({id: 'productId'})

        expect(url).toEqual('/product/productId')
    })

    test('categoryUrlBuilder returns expect', () => {
        const url = categoryUrlBuilder({id: 'men'})
        expect(url).toEqual(`/category/men`)
    })
})

describe('getPathWithLocale', () => {
    getUrlConfig.mockReturnValue(mockConfig.app.url)

    test('getPathWithLocale returns expected for PLP', () => {
        const location = new URL('http://localhost:3000/uk/it-IT/category/newarrivals-womens')
        const buildUrl = createUrlTemplate(mockConfig.app, 'uk', 'it-IT')

        const relativeUrl = getPathWithLocale('fr-FR', buildUrl, {location})
        expect(relativeUrl).toEqual(`/uk/fr/category/newarrivals-womens`)
    })

    test('getPathWithLocale uses default site for siteRef when it is no defined in the url', () => {
        const location = new URL('http://localhost:3000/category/newarrivals-womens')
        const buildUrl = createUrlTemplate(mockConfig.app, 'uk', 'it-IT')

        const relativeUrl = getPathWithLocale('fr-FR', buildUrl, {location})
        expect(relativeUrl).toEqual(`/uk/fr/category/newarrivals-womens`)
    })

    test('getPathWithLocale returns expected for PLP without refine param', () => {
        const location = new URL(
            'http://localhost:3000/uk/it-IT/category/newarrivals-womens?limit=25&refine=c_refinementColor%3DBianco&sort=best-matches&offset=25'
        )
        const buildUrl = createUrlTemplate(mockConfig.app, 'uk', 'it-IT')

        const relativeUrl = getPathWithLocale('fr-FR', buildUrl, {
            disallowParams: ['refine'],
            location
        })
        expect(relativeUrl).toEqual(
            `/uk/fr/category/newarrivals-womens?limit=25&sort=best-matches&offset=25`
        )
    })

    test('getPathWithLocale returns expected for Homepage', () => {
        const location = new URL('http://localhost:3000/uk/it-IT/')
        const buildUrl = createUrlTemplate(mockConfig.app, 'uk', 'it-IT')

        const relativeUrl = getPathWithLocale('fr-FR', buildUrl, {location})
        expect(relativeUrl).toEqual(`/uk/fr/`)
    })

    test('getPathWithLocale returns / when both site and locale are default', () => {
        const location = new URL('http://localhost:3000/')
        const buildUrl = createUrlTemplate(mockConfig.app, 'uk', 'en-GB')

        const relativeUrl = getPathWithLocale('en-GB', buildUrl, {location})
        expect(relativeUrl).toEqual(`/`)
    })
})

describe('createUrlTemplate tests', () => {
    const defaultSite = mockConfig.app.sites[0]
    const defaultAlias = mockConfig.app.siteAliases[defaultSite.id]
    const defaultSiteMock = {...defaultSite, alias: defaultAlias}

    const nonDefaultSite = mockConfig.app.sites[1]
    const nonDefaultAlias = mockConfig.app.siteAliases[nonDefaultSite.id]
    const nonDefaultSiteMock = {...nonDefaultSite, alias: nonDefaultAlias}

    const configValues = ['path', 'query_param', 'none']

    let cases = []
    // TODO: This is hard to understand. Can the cases be hard-coded (or the logic simplified)?
    for (let i = 0; i < configValues.length; i++) {
        for (let j = 0; j < configValues.length; j++) {
            for (let showDefaultsValues = 0; showDefaultsValues < 2; showDefaultsValues++) {
                if (showDefaultsValues === 0) {
                    cases.push({
                        urlConfig: {
                            locale: configValues[i],
                            site: configValues[j],
                            showDefaults: true
                        },
                        site: defaultSiteMock,
                        locale: {id: 'en-GB'}
                    })
                } else {
                    for (let isDefaultSite = 0; isDefaultSite < 2; isDefaultSite++) {
                        for (let isDefaultLocale = 0; isDefaultLocale < 2; isDefaultLocale++) {
                            if (isDefaultSite === 0) {
                                cases.push({
                                    urlConfig: {
                                        locale: configValues[i],
                                        site: configValues[j],
                                        showDefaults: false
                                    },
                                    site: defaultSiteMock,
                                    locale:
                                        isDefaultLocale === 0
                                            ? {id: 'en-GB'}
                                            : {id: 'fr-FR', alias: 'fr'}
                                })
                            } else {
                                cases.push({
                                    urlConfig: {
                                        locale: configValues[i],
                                        site: configValues[j],
                                        showDefaults: false
                                    },
                                    site: nonDefaultSiteMock,
                                    locale:
                                        isDefaultLocale === 0
                                            ? {id: 'en-US'}
                                            : {id: 'fr-FR', alias: 'fr'}
                                })
                            }
                        }
                    }
                }
            }
        }
    }

    const paths = ['/testpath', '/']
    // TODO: This is hard to understand and adds a _lot_ of lines to the file. Can these results be
    // added directly to the test cases (or otherwise simplified)?
    const expectedResults = (path) => {
        return path !== '/'
            ? [
                  `/uk/en-GB${path}`,
                  `${path}`,
                  `/fr${path}`,
                  `/us${path}`,
                  `/us/fr${path}`,
                  `/en-GB${path}?site=uk`,
                  `${path}`,
                  `/fr${path}`,
                  `${path}?site=us`,
                  `/fr${path}?site=us`,
                  `/en-GB${path}`,
                  `${path}`,
                  `/fr${path}`,
                  `${path}`,
                  `/fr${path}`,
                  `/uk${path}?locale=en-GB`,
                  `${path}`,
                  `${path}?locale=fr`,
                  `/us${path}`,
                  `/us${path}?locale=fr`,
                  `${path}?site=uk&locale=en-GB`,
                  `${path}`,
                  `${path}?locale=fr`,
                  `${path}?site=us`,
                  `${path}?site=us&locale=fr`,
                  `${path}?locale=en-GB`,
                  `${path}`,
                  `${path}?locale=fr`,
                  `${path}`,
                  `${path}?locale=fr`,
                  `/uk${path}`,
                  `${path}`,
                  `${path}`,
                  `/us${path}`,
                  `/us${path}`,
                  `${path}?site=uk`,
                  `${path}`,
                  `${path}`,
                  `${path}?site=us`,
                  `${path}?site=us`,
                  `${path}`,
                  `${path}`,
                  `${path}`,
                  `${path}`,
                  `${path}`
              ]
            : [
                  `${path}`,
                  `${path}`,
                  `/fr${path}`,
                  `/us${path}`,
                  `/us/fr${path}`,
                  `${path}`,
                  `${path}`,
                  `/fr${path}`,
                  `${path}?site=us`,
                  `/fr${path}?site=us`,
                  `${path}`,
                  `${path}`,
                  `/fr${path}`,
                  `${path}`,
                  `/fr${path}`,
                  `${path}`,
                  `${path}`,
                  `${path}?locale=fr`,
                  `/us${path}`,
                  `/us${path}?locale=fr`,
                  `${path}`,
                  `${path}`,
                  `${path}?locale=fr`,
                  `${path}?site=us`,
                  `${path}?site=us&locale=fr`,
                  `${path}`,
                  `${path}`,
                  `${path}?locale=fr`,
                  `${path}`,
                  `${path}?locale=fr`,
                  `${path}`,
                  `${path}`,
                  `${path}`,
                  `/us${path}`,
                  `/us${path}`,
                  `${path}`,
                  `${path}`,
                  `${path}`,
                  `${path}?site=us`,
                  `${path}?site=us`,
                  `${path}`,
                  `${path}`,
                  `${path}`,
                  `${path}`,
                  `${path}`
              ]
    }
    paths.forEach((path) => {
        cases.forEach(({urlConfig, site, locale}, index) => {
            test(`URL template path:${path}, site:${site.alias}, locale.id:${locale.id}${
                locale?.alias ? `, locale.alias:${locale.alias}` : ''
            } and urlConfig:${JSON.stringify(urlConfig)}`, () => {
                const buildUrl = createUrlTemplate(
                    {url: urlConfig},
                    site.id,
                    locale?.alias || locale?.id
                )
                const resultUrl = buildUrl(
                    path,
                    mockConfig.app.siteAliases[site.id],
                    locale?.alias || locale?.id
                )

                expect(resultUrl).toEqual(expectedResults(path)[index])
            })
        })
    })
})

describe('rebuildPathWithParams test', () => {
    test('returns updated url', () => {
        const url = '/en/product/25501032M?color=black&size=M'
        const updatedUrl = rebuildPathWithParams(url, {pid: undefined})
        expect(updatedUrl).toEqual('/en/product/25501032M?color=black&size=M')
    })
})

describe('removeQueryParamsFromPath test', () => {
    test('returns updated url', () => {
        const url = '/en/product/25501032M?color=black&size=M&something=123'
        const updatedUrl = removeQueryParamsFromPath(url, ['color', 'size'])
        expect(updatedUrl).toEqual('/en/product/25501032M?something=123')
    })
})

describe('absoluteUrl', function () {
    test('return expected when path is a relative url', () => {
        const url = absoluteUrl('/uk/en/women/dresses')
        expect(url).toEqual('https://www.example.com/uk/en/women/dresses')
    })

    test('return expected when path is an absolute url', () => {
        const url = absoluteUrl('https://www.example.com/uk/en/women/dresses')
        expect(url).toEqual('https://www.example.com/uk/en/women/dresses')
    })
})

describe('removeSiteLocaleFromPath', function () {
    test('return path without site alias and locale', () => {
        const pathName = removeSiteLocaleFromPath('/uk/en-GB/account/wishlist')
        expect(pathName).toEqual('/account/wishlist')
    })

    test('return path without site alias if they appear multiple times', () => {
        const pathName = removeSiteLocaleFromPath('/uk/en-GB/uk/en-GB/account/wishlist')
        expect(pathName).toEqual('/account/wishlist')
    })

    test('return expected path name when no locale or site alias appear', () => {
        const pathName = removeSiteLocaleFromPath('/account/wishlist')
        expect(pathName).toEqual('/account/wishlist')
    })

    test('return empty string when no path name is passed', () => {
        const pathName = removeSiteLocaleFromPath()
        expect(pathName).toEqual('')
    })
})

describe('getParamsFromPath', function () {
    afterAll(() => getSites.mockReset())
    beforeAll(() => {
        getSites.mockReturnValue([
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
        ])
    })

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
        test(`gets params from path ${path}`, () => {
            expect(getParamsFromPath(path)).toEqual(expectedRes)
        })
    })
})

describe('resolveLocaleFromUrl', function () {
    afterAll(() => getSites.mockReset())
    beforeAll(() => {
        getSites.mockReturnValue([
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
        ])
    })

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
        test(`resolves locale from url ${path}`, () => {
            expect(resolveLocaleFromUrl(path)).toEqual(expectedRes)
        })
    })
})
