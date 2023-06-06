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
    rebuildPathWithParams,
    removeQueryParamsFromPath,
    absoluteUrl,
    createUrlTemplate,
    removeSiteLocaleFromPath
} from '@salesforce/retail-react-app/app/utils/url'
import {getUrlConfig} from '@salesforce/retail-react-app/app/utils/site-utils'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'

afterEach(() => {
    jest.clearAllMocks()
})

jest.mock('@salesforce/pwa-kit-react-sdk/utils/url', () => {
    const original = jest.requireActual('@salesforce/pwa-kit-react-sdk/utils/url')
    return {
        ...original,
        getAppOrigin: jest.fn(() => 'https://www.example.com')
    }
})
jest.mock('./utils', () => {
    const original = jest.requireActual('./utils')
    return {
        ...original,
        getConfig: jest.fn(() => mockConfig)
    }
})

jest.mock('./site-utils', () => {
    const original = jest.requireActual('./site-utils')
    return {
        ...original,
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

        expect(url).toBe('/search?q=term')
    })

    test('searchUrlBuilder returns expect with & symbol', () => {
        const url = searchUrlBuilder('term&term')

        expect(url).toBe('/search?q=term%26term')
    })

    test('productUrlBuilder returns expect', () => {
        const url = productUrlBuilder({id: 'productId'})

        expect(url).toBe('/product/productId')
    })

    test('categoryUrlBuilder returns expect', () => {
        const url = categoryUrlBuilder({id: 'men'})
        expect(url).toBe(`/category/men`)
    })
})

describe('getPathWithLocale', () => {
    getUrlConfig.mockImplementation(() => mockConfig.app.url)

    test('getPathWithLocale returns expected for PLP', () => {
        const location = new URL('http://localhost:3000/uk/it-IT/category/newarrivals-womens')
        const buildUrl = createUrlTemplate(mockConfig.app, 'uk', 'it-IT')

        const relativeUrl = getPathWithLocale('fr-FR', buildUrl, {location})
        expect(relativeUrl).toBe(`/uk/fr/category/newarrivals-womens`)
    })

    test('getPathWithLocale uses default site for siteRef when it is no defined in the url', () => {
        const location = new URL('http://localhost:3000/category/newarrivals-womens')
        const buildUrl = createUrlTemplate(mockConfig.app, 'uk', 'it-IT')

        const relativeUrl = getPathWithLocale('fr-FR', buildUrl, {location})
        expect(relativeUrl).toBe(`/uk/fr/category/newarrivals-womens`)
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
        expect(relativeUrl).toBe(
            `/uk/fr/category/newarrivals-womens?limit=25&sort=best-matches&offset=25`
        )
    })

    test('getPathWithLocale returns expected for Homepage', () => {
        const location = new URL('http://localhost:3000/uk/it-IT/')
        const buildUrl = createUrlTemplate(mockConfig.app, 'uk', 'it-IT')

        const relativeUrl = getPathWithLocale('fr-FR', buildUrl, {location})
        expect(relativeUrl).toBe(`/uk/fr/`)
    })

    test('getPathWithLocale returns / when both site and locale are default', () => {
        const location = new URL('http://localhost:3000/')
        const buildUrl = createUrlTemplate(mockConfig.app, 'uk', 'en-GB')

        const relativeUrl = getPathWithLocale('en-GB', buildUrl, {location})
        expect(relativeUrl).toBe(`/`)
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
        expect(updatedUrl).toBe('/en/product/25501032M?color=black&size=M')
    })
})

describe('removeQueryParamsFromPath test', () => {
    test('returns updated url', () => {
        const url = '/en/product/25501032M?color=black&size=M&something=123'
        const updatedUrl = removeQueryParamsFromPath(url, ['color', 'size'])
        expect(updatedUrl).toBe('/en/product/25501032M?something=123')
    })
})

describe('absoluteUrl', function () {
    test('return expected when path is a relative url', () => {
        const url = absoluteUrl('/uk/en/women/dresses')
        expect(url).toBe('https://www.example.com/uk/en/women/dresses')
    })

    test('return expected when path is an absolute url', () => {
        const url = absoluteUrl('https://www.example.com/uk/en/women/dresses')
        expect(url).toBe('https://www.example.com/uk/en/women/dresses')
    })
})

describe('removeSiteLocaleFromPath', function () {
    test('return path without site alias and locale', () => {
        const pathName = removeSiteLocaleFromPath('/uk/en-GB/account/wishlist')
        expect(pathName).toBe('/account/wishlist')
    })

    test('return path without site alias if they appear multiple times', () => {
        const pathName = removeSiteLocaleFromPath('/uk/en-GB/uk/en-GB/account/wishlist')
        expect(pathName).toBe('/account/wishlist')
    })

    test('return expected path name when no locale or site alias appear', () => {
        const pathName = removeSiteLocaleFromPath('/account/wishlist')
        expect(pathName).toBe('/account/wishlist')
    })

    test('return empty string when no path name is passed', () => {
        const pathName = removeSiteLocaleFromPath()
        expect(pathName).toBe('')
    })
})
