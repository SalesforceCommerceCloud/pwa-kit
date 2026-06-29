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
    createUrlTemplate,
    removeSiteLocaleFromPath,
    serverSafeEncode,
    ensureExternalUrl
} from '@salesforce/retail-react-app/app/utils/url'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'
import {getRouterBasePath} from '@salesforce/pwa-kit-react-sdk/ssr/universal/utils'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

afterEach(() => {
    jest.clearAllMocks()
})

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: jest.fn()
}))

beforeEach(() => {
    getConfig.mockReturnValue(mockConfig)
})
jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-namespace-paths', () => {
    const original = jest.requireActual('@salesforce/pwa-kit-runtime/utils/ssr-namespace-paths')
    return {
        ...original,
        getEnvBasePath: jest.fn(() => '')
    }
})

jest.mock('@salesforce/pwa-kit-react-sdk/ssr/universal/utils', () => {
    const original = jest.requireActual('@salesforce/pwa-kit-react-sdk/ssr/universal/utils')
    return {
        ...original,
        getRouterBasePath: jest.fn(() => '')
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

    test('getPathWithLocale returns path without base path if base path is present', () => {
        const basePath = '/test-base'
        getRouterBasePath.mockReturnValue(basePath)

        const location = new URL(
            `http://localhost:3000${basePath}/uk/it-IT/category/newarrivals-womens`
        )
        const buildUrl = createUrlTemplate(mockConfig.app, 'uk', 'it-IT')

        const path = getPathWithLocale('fr-FR', buildUrl, {location})
        expect(path).toBe('/uk/fr/category/newarrivals-womens')
        expect(path).not.toContain(basePath)
        // Caller uses basePath + path for window.location or full href
        expect(`${basePath}${path}`).toBe(`${basePath}/uk/fr/category/newarrivals-womens`)
    })

    test('getPathWithLocale does not strip when path has basePath only as substring (e.g. /shop vs /shopping/cart)', () => {
        const basePath = '/shop'
        getRouterBasePath.mockReturnValue(basePath)

        const location = new URL('http://localhost:3000/shopping/cart')
        const buildUrl = createUrlTemplate(mockConfig.app, 'uk', 'en-GB')

        const path = getPathWithLocale('en-GB', buildUrl, {location})
        expect(path).toContain('/shopping')
        expect(path).not.toBe('/cart')
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

describe('serverSafeEncode', () => {
    test('encodes simple string', () => {
        const input = 'My Address'
        const result = serverSafeEncode(input)
        expect(result).toBe('My%20Address')
    })

    test('encodes string with special characters', () => {
        const input = 'My Address & Co.'
        const result = serverSafeEncode(input)
        expect(result).toBe('My%20Address%20%26%20Co.')
    })

    test('encodes string with spaces and symbols', () => {
        const input = 'Home Address #123'
        const result = serverSafeEncode(input)
        expect(result).toBe('Home%20Address%20%23123')
    })

    test('encodes string with unicode characters', () => {
        const input = 'Café & Résumé'
        const result = serverSafeEncode(input)
        expect(result).toBe('Caf%C3%A9%20%26%20R%C3%A9sum%C3%A9')
    })

    test('encodes empty string', () => {
        const input = ''
        const result = serverSafeEncode(input)
        expect(result).toBe('')
    })

    test('encodes string with URL-unsafe characters', () => {
        const input = 'test@example.com'
        const result = serverSafeEncode(input)
        expect(result).toBe('test%40example.com')
    })

    test('verifies encoding behavior', () => {
        const input = 'My Address & Co.'
        const encoded = serverSafeEncode(input)

        // Decode should give us original string
        const decoded = decodeURIComponent(encoded)
        expect(decoded).toBe(input)
    })

    test('correctly double encodes', () => {
        const input = 'My%20Address%20%26%20Co.'
        const encoded = serverSafeEncode(input)

        // Decode should give us original string
        const decoded = decodeURIComponent(encoded)
        expect(decoded).toBe(input)
    })
})

describe('ensureExternalUrl', () => {
    test('normalizes external URLs to an absolute https href', () => {
        // scheme-less host -> prepend https:// (the carrier-tracking bug)
        expect(ensureExternalUrl('www.testingtracking.com')).toBe(
            'https://www.testingtracking.com/'
        )
        expect(ensureExternalUrl('fedex.com/track?n=123')).toBe('https://fedex.com/track?n=123')
        // protocol-relative, host:port (URL would misread as a scheme), and IPv4 hosts
        expect(ensureExternalUrl('//carrier.com/track')).toBe('https://carrier.com/track')
        expect(ensureExternalUrl('carrier.com:8080/track')).toBe('https://carrier.com:8080/track')
        expect(ensureExternalUrl('192.168.0.1/track')).toBe('https://192.168.0.1/track')
        // already-absolute http(s): kept; scheme + host lowercased by the URL parser
        expect(ensureExternalUrl('https://www.carrier.com/track?n=1')).toBe(
            'https://www.carrier.com/track?n=1'
        )
        expect(ensureExternalUrl('http://carrier.com')).toBe('http://carrier.com/')
        expect(ensureExternalUrl('HTTPS://Carrier.COM/Path')).toBe('https://carrier.com/Path')
        // control characters stripped, surrounding whitespace trimmed
        expect(ensureExternalUrl('  www.carrier.com  ')).toBe('https://www.carrier.com/')
        expect(ensureExternalUrl('https://carrier.com\t/track\n')).toBe('https://carrier.com/track')
    })

    test('returns undefined (never throws) for unsafe, internal, or unusable input', () => {
        // dangerous / non-web schemes
        expect(ensureExternalUrl('javascript:alert(1)')).toBeUndefined()
        expect(ensureExternalUrl('javascript:alert(1)//')).toBeUndefined()
        expect(ensureExternalUrl('data:text/html,<script>alert(1)</script>')).toBeUndefined()
        expect(ensureExternalUrl('vbscript:msgbox(1)')).toBeUndefined()
        expect(ensureExternalUrl('file:///etc/passwd')).toBeUndefined()
        expect(ensureExternalUrl('mailto:a@b.com')).toBeUndefined()
        expect(ensureExternalUrl('tel:+15551234')).toBeUndefined()
        // app-internal / relative paths (must not become external links)
        expect(ensureExternalUrl('/account/orders/123')).toBeUndefined()
        expect(ensureExternalUrl('track')).toBeUndefined()
        expect(ensureExternalUrl('./relative')).toBeUndefined()
        // empty / nullish
        expect(ensureExternalUrl('')).toBeUndefined()
        expect(ensureExternalUrl('   ')).toBeUndefined()
        expect(ensureExternalUrl(null)).toBeUndefined()
        expect(ensureExternalUrl(undefined)).toBeUndefined()
    })

    // Security/correctness regressions from PR review — each asserts the resolved host
    // so a refactor can't silently reopen a bypass. Grouped by failure class.
    test('rejects host-confusion bypasses (href would navigate to a different host than it reads)', () => {
        // userinfo `@` — "www.ups.com" is the username, real host is evil.com — on BOTH branches
        expect(ensureExternalUrl('https://www.ups.com@evil.com/track')).toBeUndefined()
        expect(ensureExternalUrl('www.ups.com@evil.com/track')).toBeUndefined()
        expect(ensureExternalUrl('ups.com:@evil.com/track')).toBeUndefined()
        expect(ensureExternalUrl('carrier.com:user@evil.com/track')).toBeUndefined()
        // backslash authority (WHATWG treats `\` as `/`)
        expect(ensureExternalUrl('https:\\\\evil.com')).toBeUndefined()
        expect(ensureExternalUrl('\\\\evil.com')).toBeUndefined()
        // control char between slashes must NOT collapse a relative path into //host
        expect(ensureExternalUrl('/\x00/evil.com')).toBeUndefined()
        // dotted-"protocol" WITH an authority (`label.tld://host`) — parses to a dotted
        // protocol so it skips the dot-less validation, and the real host is the part after
        // `//` (`ups.com`/`evil.com`), not the leading label. Must NOT fall through to be
        // re-prepended into `https://attacker.com//ups.com/...`.
        expect(ensureExternalUrl('attacker.com://ups.com/track/12345')).toBeUndefined()
        expect(ensureExternalUrl('foo.bar://evil.com')).toBeUndefined()
    })

    test('still externalizes a genuine scheme-less host:port (no // authority — must not be over-rejected)', () => {
        // The dotted-protocol-authority guard must NOT catch a real `host:port`, whose parse
        // has an EMPTY host (the part after `:` is the port), unlike the `label.tld://…` spoof.
        expect(ensureExternalUrl('carrier.com:8080')).toBe('https://carrier.com:8080/')
        expect(ensureExternalUrl('carrier.com:8080/track')).toBe('https://carrier.com:8080/track')
    })

    test('rejects junk / non-host values that would become dead external links', () => {
        // bare filenames and degenerate-dot hosts (contradict the relative→undefined contract)
        expect(ensureExternalUrl('data.html')).toBeUndefined()
        expect(ensureExternalUrl('index.html')).toBeUndefined()
        expect(ensureExternalUrl('a..b')).toBeUndefined()
        // non-string input must not throw (never-throws contract)
        expect(ensureExternalUrl(1234)).toBeUndefined()
        expect(ensureExternalUrl({})).toBeUndefined()
        expect(ensureExternalUrl([])).toBeUndefined()
    })

    test('does NOT reject legit carrier URLs that merely contain @ in the path/query', () => {
        expect(ensureExternalUrl('https://tracking.dhl.com/track?email=a@b.com')).toBe(
            'https://tracking.dhl.com/track?email=a@b.com'
        )
    })
})
