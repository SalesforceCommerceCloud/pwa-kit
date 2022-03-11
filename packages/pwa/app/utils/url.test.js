/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    buildUrlSet,
    categoryUrlBuilder,
    productUrlBuilder,
    searchUrlBuilder,
    getPathWithLocale,
    homeUrlBuilder,
    rebuildPathWithParams,
    removeQueryParamsFromPath,
    buildPathWithUrlConfig,
    absoluteUrl
} from './url'
import {getUrlConfig} from './utils'
import mockConfig from '../../config/mocks/default'
// import {getAppOrigin} from 'pwa-kit-react-sdk/utils/url'
jest.mock('pwa-kit-react-sdk/utils/url', () => {
    const original = jest.requireActual('pwa-kit-react-sdk/utils/url')
    return {
        ...original,
        getAppOrigin: jest.fn(() => 'https://www.example.com')
    }
})
jest.mock('./utils', () => {
    const original = jest.requireActual('./utils')
    return {
        ...original,
        getConfig: jest.fn(() => mockConfig),
        getUrlConfig: jest.fn()
    }
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
    const site = mockConfig.app.sites[0]
    const alias = mockConfig.app.siteAliases[site.id]
    const mockSite = {...site, alias}
    getUrlConfig.mockImplementation(() => mockConfig.app.url)
    test('getPathWithLocale returns expected for PLP', () => {
        const location = new URL('http://localhost:3000/uk/it-IT/category/newarrivals-womens')

        const relativeUrl = getPathWithLocale('fr-FR', {location, site: mockSite})
        expect(relativeUrl).toEqual(`/uk/fr-FR/category/newarrivals-womens`)
    })

    test('getPathWithLocale returns expected for PLP without refine param', () => {
        const location = new URL(
            'http://localhost:3000/uk/it-IT/category/newarrivals-womens?limit=25&refine=c_refinementColor%3DBianco&sort=best-matches&offset=25'
        )

        const relativeUrl = getPathWithLocale('fr-FR', {
            disallowParams: ['refine'],
            location,
            site: mockSite
        })
        expect(relativeUrl).toEqual(
            `/uk/fr-FR/category/newarrivals-womens?limit=25&sort=best-matches&offset=25`
        )
    })

    test('getPathWithLocale returns expected for Homepage', () => {
        const location = new URL('http://localhost:3000/uk/it-IT/')

        const relativeUrl = getPathWithLocale('fr-FR', {location, site: mockSite})
        expect(relativeUrl).toEqual(`/uk/fr-FR/`)
    })

    test('getPathWithLocale returns / when both site and locale are default', () => {
        const location = new URL('http://localhost:3000/uk/it-IT/')

        const relativeUrl = getPathWithLocale('en-GB', {location, site: mockSite})
        expect(relativeUrl).toEqual(`/`)
    })
})

describe('homeUrlBuilder', () => {
    const defaultSite = mockConfig.app.sites[0]
    const defaultAlias = mockConfig.app.siteAliases[defaultSite.id]
    const defaultSiteMock = {...defaultSite, alias: defaultAlias}

    const nonDefaultSite = mockConfig.app.sites[1]
    const nonDefaultAlias = mockConfig.app.siteAliases[nonDefaultSite.id]
    const nonDefaultSiteMock = {...nonDefaultSite, alias: nonDefaultAlias}
    const cases = [
        {
            urlConfig: {
                locale: 'path',
                site: 'path',
                showDefaults: true
            },
            site: defaultSiteMock,
            locale: {id: 'en-GB'},
            expectedRes: '/uk/en-GB/'
        },
        {
            urlConfig: {
                locale: 'query_param',
                site: 'query_param',
                showDefaults: true
            },
            site: defaultSiteMock,
            locale: {id: 'en-GB'},
            expectedRes: '/?site=uk&locale=en-GB'
        },
        {
            urlConfig: {
                locale: 'path',
                site: 'path',
                showDefaults: false
            },
            site: defaultSiteMock,
            locale: {id: 'en-GB'},
            expectedRes: '/'
        },
        {
            urlConfig: {
                locale: 'query_param',
                site: 'query_param',
                showDefaults: false
            },
            site: defaultSiteMock,
            locale: {id: 'en-GB'},
            expectedRes: '/'
        },
        {
            urlConfig: {
                locale: 'path',
                site: 'path',
                showDefaults: true
            },
            site: defaultSiteMock,
            locale: {id: 'fr-FR'},
            expectedRes: '/uk/fr-FR/'
        },
        {
            urlConfig: {
                locale: 'path',
                site: 'path',
                showDefaults: false
            },
            site: defaultSiteMock,
            locale: {id: 'fr-FR'},
            expectedRes: '/fr-FR/'
        },
        {
            urlConfig: {
                locale: 'query_param',
                site: 'query_param',
                showDefaults: true
            },
            site: defaultSiteMock,
            locale: {id: 'fr-FR'},
            expectedRes: '/?site=uk&locale=fr-FR'
        },
        {
            urlConfig: {
                locale: 'path',
                site: 'path',
                showDefaults: true
            },
            site: nonDefaultSiteMock,
            locale: {id: 'en-US'},
            expectedRes: '/us/en-US/'
        },
        {
            urlConfig: {
                locale: 'query_param',
                site: 'path',
                showDefaults: true
            },
            site: nonDefaultSiteMock,
            locale: {id: 'en-US'},
            expectedRes: '/us/?locale=en-US'
        },
        {
            urlConfig: {
                locale: 'path',
                site: 'path',
                showDefaults: false
            },
            site: nonDefaultSiteMock,
            locale: {id: 'en-US'}, // default locale of the nonDefault Site
            expectedRes: '/us/'
        },
        {
            urlConfig: {
                locale: 'query_param',
                site: 'path',
                showDefaults: false
            },
            site: nonDefaultSiteMock,
            locale: {id: 'en-US'}, // default locale of the nonDefault Site
            expectedRes: '/us/'
        },
        {
            urlConfig: {
                locale: 'query_param',
                site: 'query_param',
                showDefaults: true
            },
            site: nonDefaultSiteMock,
            locale: {id: 'en-US'}, // default locale of the nonDefault Site
            expectedRes: '/?site=us&locale=en-US'
        }
    ]

    cases.forEach(({urlConfig, site, locale, expectedRes}) => {
        test(`return expected URL with site ${site.alias}, locale ${
            locale.id
        } and urlConfig as ${JSON.stringify(urlConfig)}`, () => {
            getUrlConfig.mockImplementation(() => urlConfig)
            const homeUrl = homeUrlBuilder('/', {
                site,
                locale
            })
            expect(homeUrl).toEqual(expectedRes)
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

describe('buildPathWithUrlConfig', () => {
    test('return a new url with locale and site a part of path', () => {
        getUrlConfig.mockImplementation(() => ({
            locale: 'path',
            site: 'path',
            showDefaults: true
        }))
        const url = buildPathWithUrlConfig('/women/dresses', {locale: 'en-GB', site: 'uk'})
        expect(url).toEqual('/uk/en-GB/women/dresses')
    })

    test('return an expected url with only locale since the showDefaults is off', () => {
        getUrlConfig.mockImplementation(() => ({
            locale: 'path',
            site: 'path',
            showDefaults: false
        }))
        const url = buildPathWithUrlConfig('/women/dresses', {locale: 'en-GB', site: 'uk'})
        expect(url).toEqual('/women/dresses')
    })

    test('return a new url with locale value as a query param and site in the path', () => {
        getUrlConfig.mockImplementation(() => ({
            locale: 'query_param',
            site: 'path',
            showDefaults: true
        }))
        const url = buildPathWithUrlConfig('/women/dresses', {locale: 'en-GB', site: 'uk'})
        expect(url).toEqual('/uk/women/dresses?locale=en-GB')
    })

    test('return a new url with locale value as a path, site as query_param', () => {
        getUrlConfig.mockImplementation(() => ({
            locale: 'path',
            site: 'query_param',
            showDefaults: true
        }))
        const url = buildPathWithUrlConfig('/women/dresses', {locale: 'en-GB', site: 'uk'})
        expect(url).toEqual('/en-GB/women/dresses?site=uk')
    })

    test('return a new url with locale value as a path, site as query_param when showDefault is off', () => {
        getUrlConfig.mockImplementation(() => ({
            locale: 'path',
            site: 'query_param',
            showDefaults: false
        }))
        const url = buildPathWithUrlConfig('/women/dresses', {locale: 'en-GB', site: 'uk'})
        expect(url).toEqual('/women/dresses')
    })

    test('return a new url without a disallow param but respect other params', () => {
        getUrlConfig.mockImplementation(() => ({
            locale: 'query_param',
            site: 'path',
            showDefaults: true
        }))
        const url = buildPathWithUrlConfig(
            '/women/dresses?something=else&refine=c_color',
            {locale: 'en-GB', site: 'uk'},
            {disallowParams: ['refine']}
        )
        expect(url).toEqual('/uk/women/dresses?something=else&locale=en-GB')
    })

    test('return a new url as configured when the values are not defaults and showDefault is off', () => {
        getUrlConfig.mockImplementation(() => ({
            locale: 'query_param',
            site: 'path',
            showDefaults: false
        }))
        const url = buildPathWithUrlConfig(
            '/women/dresses?something=else&refine=c_color',
            {locale: 'en-CA', site: 'us'},
            {disallowParams: ['refine']}
        )
        expect(url).toEqual('/us/women/dresses?something=else&locale=en-CA')
    })

    test('throw an error when url config is not defined', () => {
        getUrlConfig.mockImplementation(() => undefined)

        expect(() => {
            buildPathWithUrlConfig('/women/dresses', {locale: 'en-GB', site: 'uk'})
        }).toThrow()
    })
})

describe('absoluteUrl', function() {
    test('return expected when path is an relative path', () => {
        const url = absoluteUrl('/uk/en/women/dresses')
        expect(url).toEqual('https://www.example.com/uk/en/women/dresses')
    })

    test('return expected when path is an relative path', () => {
        const url = absoluteUrl('https://www.example.com/uk/en/women/dresses')
        expect(url).toEqual('https://www.example.com/uk/en/women/dresses')
    })
})
