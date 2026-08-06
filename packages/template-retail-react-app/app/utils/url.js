/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    getLocaleByReference,
    getParamsFromPath,
    getDefaultSite,
    getSiteByReference,
    removeBasePathFromPath
} from '@salesforce/retail-react-app/app/utils/site-utils'
import {HOME_HREF, urlPartPositions} from '@salesforce/retail-react-app/app/constants'
import {getRouterBasePath} from '@salesforce/pwa-kit-react-sdk/ssr/universal/utils'

/**
 * Modifies a given url by adding/updating query parameters.
 *
 * @param {string} url - The base url of the output url set.
 * @param {object} extraParams - A key values pairing used to add static search param values.
 * @returns {string} A URL with additional params
 * @example
 * import {rebuildPathWithParams} from '/path/to/utils/url'
 *
 * rebuildPathWithParams(
 *     '/en-GB/product/25501032M',
 *     {color: 'JJ2SKXX', size: 'MD'}
 * )
 *
 * // Returns
 * // '/en-GB/product/25501032M?color=JJ2SKXX&size=9MD'
 */
export const rebuildPathWithParams = (url, extraParams) => {
    const [pathname, search] = url.split('?')
    const params = new URLSearchParams(search)

    updateSearchParams(params, extraParams)

    // Clean up any trailing `=` for params without values.
    const paramStr = params.toString().replace(/=&/g, '&').replace(/=$/, '')

    // Generate the newly updated url.
    return `${pathname}${Array.from(paramStr).length > 0 ? `?${paramStr}` : ''}`
}

export const updateSearchParams = (searchParams, newParams) => {
    Object.entries(newParams).forEach(([key, value]) => {
        // 0 is a valid value as for a param
        if (!value && value !== 0) {
            searchParams.delete(key)
        } else {
            searchParams.set(key, value)
        }
    })
}

/**
 * Builds a list of modified Urls with the provided params key and values,
 * preserving any search params provided in the original url.Optionally
 * you can pass and object used to set static params values.
 * @param {string} url - The base url of the output url set.
 * @param {string} key - The search params for the associated values
 * @param {Array} values - The search param values
 * @param {object} extraParams - A key values pairing used to add static search param values.
 * @returns {string[]} A list of URLs
 * @example
 * import {buildUrlSet} from '/path/to/utils/url'
 *
 * buildUrlSet(
 *     '/womens/clothing',
 *     'sort',
 *     ['price-high-to-low', 'price-low-to-high'],
 *     {offset: 0}
 * )
 *
 * // Returns
 * // ['/womens/clothing?sort=price-high-to-low', '/womens/clothing?sort=price-low-to-high']
 */
export const buildUrlSet = (url = '', key = '', values = [], extraParams = {}) =>
    values.map((value) => rebuildPathWithParams(url, {[key]: value, ...extraParams}))

/**
 * Given a category and the current locale returns an href to the product list page.
 *
 * @param {Object} category
 * @returns {string}
 */
export const categoryUrlBuilder = (category) => encodeURI(`/category/${category.id}`)

/**
 * Given a product and the current locale returns an href to the product detail page.
 *
 * @param {Object} product
 * @returns {string}
 */
export const productUrlBuilder = (product) => encodeURI(`/product/${product.id}`)

/**
 * Given a search term, constructs a search url.
 *
 * @param {string} searchTerm
 * @returns {string}
 */
export const searchUrlBuilder = (searchTerm) => '/search?q=' + encodeURIComponent(searchTerm)

/**
 * Returns a relative URL for a locale short code.
 * Based on your app configuration, this function will replace your current locale shortCode with a new one.
 *
 * @param {String} shortCode - The locale short code.
 * @param {function(*, *, *, *=): string} - Generates a site URL from the provided path, site and locale.
 * @param {string[]} opts.disallowParams - URL parameters to remove
 * @param {Object} opts.location - location object to replace the default `window.location`
 * @returns {String} url - The relative URL for the specific locale (without base path).
 */
export const getPathWithLocale = (shortCode, buildUrl, opts = {}) => {
    const location = opts.location ? opts.location : window.location
    let {siteRef, localeRef} = getParamsFromPath(`${location.pathname}${location.search}`)
    let {pathname, search} = location

    // sanitize the base path from current url if existing
    const basePath = getRouterBasePath()
    pathname = removeBasePathFromPath(pathname, basePath)

    // sanitize the site from current url if existing
    if (siteRef) {
        pathname = pathname.replace(`/${siteRef}`, '')
        search = search.replace(`site=${siteRef}`, '')
    }
    // sanitize the locale from current url if existing
    if (localeRef) {
        pathname = pathname.replace(`/${localeRef}`, '')
        search = search.replace(`locale=${localeRef}`, '')
    }
    // remove ending any &
    search = search.replace(/&$/, '')

    // Remove query parameters
    const {disallowParams = []} = opts

    let queryString = new URLSearchParams(`${search}`)

    if (disallowParams.length) {
        disallowParams.forEach((param) => {
            queryString.delete(param)
        })
    }

    const site = getSiteByReference(siteRef)
    const locale = getLocaleByReference(site, shortCode)

    // rebuild the url with new locale,
    const newUrl = buildUrl(
        `${pathname}${Array.from(queryString).length !== 0 ? `?${queryString}` : ''}`,
        // By default, as for home page, when the values of site and locale belongs to the default site,
        // they will be not shown in the url just
        site.alias || site.id,
        locale?.alias || locale?.id
    )

    return newUrl
}

/**
 * Generates the URL Template literal (Template string) used to build URLs in the App according
 * the current selected site/locale and the default App URL configuration.
 *
 * @param appConfig Application default configuration.
 * @param siteRef Current selected Site reference. The value can be the Site id or alias.
 * @param localeRef Current selected Locale reference. The value can be the Locale id or alias.
 * @returns {function(*, *, *): string} function providing: path, site and locale generates a URL.
 */
export const createUrlTemplate = (appConfig, siteRef, localeRef) => {
    const {site: siteConfig, locale: localeConfig, showDefaults: showDefaultsConfig} = appConfig.url
    const defaultSite = getDefaultSite()
    const site = getSiteByReference(siteRef)
    const defaultLocale = getLocaleByReference(site, site.l10n.defaultLocale)

    const isDefaultSite =
        defaultSite.id === siteRef || (defaultSite.alias && defaultSite.alias === siteRef)
    const isDefaultLocale =
        defaultLocale.id === localeRef || (defaultLocale.alias && defaultLocale.alias === localeRef)

    const querySite =
        (siteConfig === urlPartPositions.QUERY_PARAM && showDefaultsConfig) ||
        (siteConfig === urlPartPositions.QUERY_PARAM && !showDefaultsConfig && !isDefaultSite)
    const queryLocale =
        (localeConfig === urlPartPositions.QUERY_PARAM && showDefaultsConfig) ||
        (localeConfig === urlPartPositions.QUERY_PARAM && !showDefaultsConfig && !isDefaultLocale)

    const isQuery = querySite || queryLocale

    const pathSite =
        (siteConfig === urlPartPositions.PATH && showDefaultsConfig) ||
        (siteConfig === urlPartPositions.PATH && !showDefaultsConfig && !isDefaultSite)
    const pathLocale =
        (localeConfig === urlPartPositions.PATH && showDefaultsConfig) ||
        (localeConfig === urlPartPositions.PATH && !showDefaultsConfig && !isDefaultLocale)

    return (path, site, locale) => {
        const isHomeWithDefaultSiteAndLocale =
            path === HOME_HREF &&
            (defaultSite.id === site || (defaultSite.alias && defaultSite.alias === site)) &&
            (defaultLocale.id === locale || (defaultLocale.alias && defaultLocale.alias === locale))

        const sitePath = pathSite && site && !isHomeWithDefaultSiteAndLocale ? `/${site}` : ''
        const localePath =
            pathLocale && locale && !isHomeWithDefaultSiteAndLocale ? `/${locale}` : ''

        const hasQuery = isQuery && (site || locale) && !isHomeWithDefaultSiteAndLocale
        let queryString = ''
        if (hasQuery) {
            const searchParams = new URLSearchParams()
            querySite && site && searchParams.append('site', site)
            queryLocale && locale && searchParams.append('locale', locale)
            queryString = `?${searchParams.toString()}`
        }

        return `${sitePath}${localePath}${path}${queryString}`
    }
}

/*
 * Remove query params from a give url path based on a given list of keys
 *
 * @param {string} path - The part of url to have params removed from.
 * @param {array} keys - list of params to be removed
 * @returns {string} - the url after param has been removed
 * @example
 * import {removeQueryParamsFromPath} from /path/to/util/url
 *
 * removeQueryParamsFromPath(
 *   /en-GB/cart?pid=1234&color=black&size=s&abc=12,
 *   ['pid', 'color', 'size']
 * )
 * // returns
 * // '/en-GB/cart?abc=12'
 */
export const removeQueryParamsFromPath = (path, keys) => {
    const [pathname, search] = path.split('?')
    const params = new URLSearchParams(search)
    keys.forEach((key) => {
        if (params.has(key)) {
            params.delete(key)
        }
    })

    // Clean up any trailing `=` for params without values.
    const paramStr = params.toString().replace(/=&/g, '&').replace(/=$/, '')

    return `${pathname}${paramStr && '?'}${paramStr}`
}

/*
 * Remove site alias and locale from a given url, to be used for "navigate" urls
 *
 * @param {string} pathName - The part of url to have site alias and locale removed from
 * @returns {string} - the path after site alias and locale have been removed
 * @example
 * import {removeSiteLocaleFromPath} from /path/to/util/url
 *
 * removeSiteLocaleFromPath(/RefArch/en-US/account/wishlist)
 * // returns '/account/wishlist'
 */
export const removeSiteLocaleFromPath = (pathName = '') => {
    let {siteRef, localeRef} = getParamsFromPath(pathName)

    const basePath = getRouterBasePath()
    pathName = removeBasePathFromPath(pathName, basePath)

    // remove the site alias from the current pathName
    if (siteRef) {
        pathName = pathName.replace(new RegExp(`/${siteRef}`, 'g'), '')
    }
    // remove the locale from the current pathName
    if (localeRef) {
        pathName = pathName.replace(new RegExp(`/${localeRef}`, 'g'), '')
    }

    return pathName
}

/**
 * Encodes a string to work around server-side double-decoding issues.
 *
 * This function applies a second level of URL encoding to handle cases where the server
 * performs double URL decoding, which can cause issues with special characters
 * in address names and other URL parameters.
 *
 * This utility is centralized in one place so that if the server-side double-decoding
 * issue is fixed in the future, we can easily revert all usages by simply changing
 * this function to return the input unchanged or removing the encoding entirely.
 *
 * @param {string} input - The string that is double double-decoded on the server
 * @returns {string} The encoded string
 * @example
 * import {serverSafeEncode} from '/path/to/utils/url'
 *
 * serverSafeEncode('My Address & Co.')
 * // Returns: 'My%20Address%20%26%20Co.'
 *
 * @warning Only use this function when you know the server will double-decode
 *          URL components. This is a workaround for server-side behavior that
 *          is out of your control.
 */
export const serverSafeEncode = (input) => {
    // WARNING: only use this because server double-decodes URL components
    return encodeURIComponent(input)
}

/** Last-label patterns that mark a "host" as really a filename, not an external host. */
const FILENAME_HOST =
    /\.(html?|php|aspx?|jsp|css|js|mjs|cjs|json|xml|txt|pdf|png|jpe?g|gif|svg|webp|ico)$/i

/**
 * A parsed URL is a safe external href only if it is http(s), carries NO userinfo,
 * and resolves to a plausible public host. Userinfo is rejected because
 * `new URL('https://www.carrier.com@evil.com')` parses `evil.com` as the host and
 * `www.carrier.com` as the username — the href would read like the carrier but
 * navigate elsewhere. A host with no dot, an empty label (`a..b`), or one that looks
 * like a bare filename (`data.html`) isn't a real external host.
 *
 * @param {URL} url - A parsed URL
 * @returns {boolean} Whether the URL is a safe external href
 */
const isSafeExternalUrl = (url) => {
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false
    if (url.username || url.password) return false
    const host = url.hostname
    if (!host.includes('.')) return false
    if (!host.split('.').every((label) => label.length > 0)) return false
    if (FILENAME_HOST.test(host)) return false
    return true
}

/**
 * Normalize a possibly scheme-less external URL (e.g. a carrier tracking URL) into
 * a safe, absolute http(s) URL for an `href`. Prepends `https://` to a scheme-less
 * value so the browser doesn't treat it as a path relative to the current page.
 *
 * A result is returned only when it passes `isSafeExternalUrl` (http(s), no userinfo,
 * plausible host); unsafe/non-web values (`javascript:`, `data:`, `mailto:`, userinfo
 * spoofs, internal/relative paths, bare filenames, …) and non-string input return
 * `undefined` so callers render an inactive link. Pair the link with
 * `target="_blank"` and an explicit `rel="noopener noreferrer"`. Chakra's
 * `isExternal` alone only emits `rel="noopener"`, which still leaks the order
 * page URL as the `Referer` to the carrier host — pass `rel` explicitly to add
 * `noreferrer`.
 *
 * @param {*} input - The raw URL (may be scheme-less; non-strings return undefined)
 * @returns {string|undefined} An absolute http(s) URL, or `undefined` if unsafe/unusable
 * @example
 * ensureExternalUrl('www.carrier.com/t') // 'https://www.carrier.com/t'
 * ensureExternalUrl('https://www.ups.com@evil.com') // undefined (host is evil.com)
 * ensureExternalUrl('javascript:alert(1)') // undefined
 * ensureExternalUrl('/account/orders/1') // undefined
 */
export const ensureExternalUrl = (input) => {
    if (typeof input !== 'string') return undefined

    // Backslashes never appear in a real carrier URL; the WHATWG parser treats `\`
    // as `/`, so a value like `https:\\evil.com` would smuggle in an authority.
    if (input.includes('\\')) return undefined

    // Reject relative / app-internal paths on the RAW input, before stripping (allow
    // protocol-relative "//host"). Pre-strip so a control char between slashes
    // (e.g. "/\x00/evil.com") can't collapse into "//host" and evade this guard.
    if (input.startsWith('/') && !input.startsWith('//')) return undefined
    if (input.startsWith('.')) return undefined

    // eslint-disable-next-line no-control-regex -- strip control chars so they can't smuggle past the checks
    const sanitized = input.replace(/[\x00-\x1f\x7f]/g, '').trim()
    if (!sanitized) return undefined

    try {
        // A real scheme (`https:`, `javascript:`, `mailto:`) parses to a dot-less
        // protocol; a scheme-less `host:port` (`carrier.com:8080`) mis-parses to a
        // dotted protocol — only the former should be validated/rejected as-is.
        const parsed = new URL(sanitized)
        if (!parsed.protocol.replace(/:$/, '').includes('.')) {
            return isSafeExternalUrl(parsed) ? parsed.toString() : undefined
        }
        // Dotted protocol WITH an authority (`attacker.com://ups.com/t`) is a host-confusion
        // spoof — the real host is `ups.com` but it reads like `attacker.com`. It must NOT fall
        // through to be re-prepended (which would yield `https://attacker.com//ups.com/t`). A
        // genuine scheme-less `host:port` has an EMPTY host on this parse (`carrier.com:8080` →
        // host ``), so only the empty-host form is allowed through to the prepend path.
        if (parsed.host) return undefined
    } catch {
        // no scheme — fall through to prepend
    }

    // Scheme-less (`www.carrier.com/t`, `//carrier.com`, `carrier.com:8080`) → prepend https.
    const candidate = sanitized.startsWith('//') ? `https:${sanitized}` : `https://${sanitized}`
    try {
        const fixed = new URL(candidate)
        return isSafeExternalUrl(fixed) ? fixed.toString() : undefined
    } catch {
        return undefined
    }
}
