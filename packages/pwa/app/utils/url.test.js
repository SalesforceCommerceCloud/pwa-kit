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
    buildPathWithUrlConfig
} from './url'
import {getUrlConfig} from './utils'
import mockConfig from '../../config/mocks/default'

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
    test('getPathWithLocale returns expected for PLP', () => {
        const location = new URL('http://localhost:3000/uk/it-IT/category/newarrivals-womens')

        const relativeUrl = getPathWithLocale('fr-FR', {location, site: mockConfig.app.sites[0]})
        expect(relativeUrl).toEqual(`/uk/fr-FR/category/newarrivals-womens`)
    })

    test('getPathWithLocale returns expected for PLP without refine param', () => {
        const location = new URL(
            'http://localhost:3000/uk/it-IT/category/newarrivals-womens?limit=25&refine=c_refinementColor%3DBianco&sort=best-matches&offset=25'
        )

        const relativeUrl = getPathWithLocale('fr-FR', {
            disallowParams: ['refine'],
            location,
            site: mockConfig.app.sites[0]
        })
        expect(relativeUrl).toEqual(
            `/uk/fr-FR/category/newarrivals-womens?limit=25&sort=best-matches&offset=25`
        )
    })

    test('getPathWithLocale returns expected for Homepage', () => {
        const location = new URL('http://localhost:3000/uk/it-IT/')

        const relativeUrl = getPathWithLocale('fr-FR', {location, site: mockConfig.app.sites[0]})
        expect(relativeUrl).toEqual(`/uk/fr-FR/`)
    })

    test('getPathWithLocale returns / when both site and locale are default', () => {
        const location = new URL('http://localhost:3000/uk/it-IT/')

        const relativeUrl = getPathWithLocale('en-GB', {location, site: mockConfig.app.sites[0]})
        expect(relativeUrl).toEqual(`/`)
    })
})

describe('homeUrlBuilder', () => {
    getUrlConfig.mockImplementation(() => ({
        locale: 'path',
        site: 'path',
        showDefaults: true
    }))
    test('homeUrlBuilder returns expected url without any locale and site', () => {
        const homeUrlDefaultLocale = homeUrlBuilder('/', {
            locale: 'en-GB',
            site: mockConfig.app.sites[0]
        })
        expect(homeUrlDefaultLocale).toEqual(`/`)
    })

    test('homeUrlBuilder returns expected url locale and site', () => {
        const site = mockConfig.app.sites[1]
        const alias = mockConfig.app.siteAliases[site.id]
        const homeUrlDefaultLocale = homeUrlBuilder('/', {
            locale: 'fr-FR',
            site: {...mockConfig.app.sites[1], alias}
        })
        expect(homeUrlDefaultLocale).toEqual(`/us/fr-FR/`)
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
        const defaultLocaleRefs = ['en-GB', 'uk']
        const url = buildPathWithUrlConfig(
            '/women/dresses',
            {locale: 'en-GB', site: 'uk'},
            {defaultLocaleRefs}
        )
        expect(url).toEqual('/uk/en-GB/women/dresses')
    })

    test('return an expected url with only locale since the showDefaults is off', () => {
        getUrlConfig.mockImplementation(() => ({
            locale: 'path',
            site: 'path',
            showDefaults: false
        }))
        const defaultLocaleRefs = ['en-GB', 'uk']
        const url = buildPathWithUrlConfig(
            '/women/dresses',
            {locale: 'en-GB', site: 'uk'},
            {defaultLocaleRefs}
        )
        expect(url).toEqual('/women/dresses')
    })

    test('return a new url with locale value as a query param and site in the path', () => {
        getUrlConfig.mockImplementation(() => ({
            locale: 'query_param',
            site: 'path',
            showDefaults: true
        }))
        const defaultLocaleRefs = ['en-GB', 'uk']
        const url = buildPathWithUrlConfig(
            '/women/dresses',
            {locale: 'en-GB', site: 'uk'},
            {defaultLocaleRefs}
        )
        expect(url).toEqual('/uk/women/dresses?locale=en-GB')
    })

    test('return a new url with locale value as a path, site as query_param', () => {
        getUrlConfig.mockImplementation(() => ({
            locale: 'path',
            site: 'query_param',
            showDefaults: true
        }))
        const defaultLocaleRefs = ['en-GB', 'uk']
        const url = buildPathWithUrlConfig(
            '/women/dresses',
            {locale: 'en-GB', site: 'uk'},
            {defaultLocaleRefs}
        )
        expect(url).toEqual('/en-GB/women/dresses?site=uk')
    })

    test('return a new url with locale value as a path, site as query_param when showDefault is off', () => {
        getUrlConfig.mockImplementation(() => ({
            locale: 'path',
            site: 'query_param',
            showDefaults: false
        }))
        const defaultLocaleRefs = ['en-GB', 'uk']
        const url = buildPathWithUrlConfig(
            '/women/dresses',
            {locale: 'en-GB', site: 'uk'},
            {defaultLocaleRefs}
        )
        expect(url).toEqual('/women/dresses')
    })

    test('return a new url without a disallow param but respect other params', () => {
        getUrlConfig.mockImplementation(() => ({
            locale: 'query_param',
            site: 'path',
            showDefaults: true
        }))
        const defaultLocaleRefs = ['en-GB', 'uk']
        const url = buildPathWithUrlConfig(
            '/women/dresses?something=else&refine=c_color',
            {locale: 'en-GB', site: 'uk'},
            {defaultLocaleRefs},
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
        const defaultLocaleRefs = ['en-GB', 'uk']
        const url = buildPathWithUrlConfig(
            '/women/dresses?something=else&refine=c_color',
            {locale: 'de-DE', site: 'de'},
            {defaultLocaleRefs},
            {disallowParams: ['refine']}
        )
        expect(url).toEqual('/de/women/dresses?something=else&locale=de-DE')
    })

    test('throw an error when url config is not defined', () => {
        getUrlConfig.mockImplementation(() => undefined)

        expect(() => {
            buildPathWithUrlConfig('/women/dresses', {locale: 'en-GB', site: 'uk'})
        }).toThrow()
    })
})
