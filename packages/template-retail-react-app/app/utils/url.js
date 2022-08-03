/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getAppOrigin} from 'pwa-kit-react-sdk/utils/url'
import {getLocaleByReference, getParamsFromPath} from './utils'
import {getDefaultSite, getSites} from './site-utils'
import {HOME_HREF, urlPartPositions} from '../constants'

/**
 * A function that takes a path and qualifies it with the current host and protocol.
 * This function works on the client and on the server.
 *
 * @example
 * absoluteUrl(/women/dresses?color=black)
 *
 * // => http(s)://www.site.com/women/dresses?color=black
 * @param path
 * @returns {string|*}
 */
export const absoluteUrl = (path) => {
    return new URL(path, getAppOrigin()).toString()
}

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

    // Apply any extra params.
    Object.keys(extraParams).forEach((key) => {
        const value = extraParams[key]

        // 0 is a valid value as for a param
        if (!value && value !== 0) {
            params.delete(key)
        } else {
            params.set(key, value)
        }
    })

    // Clean up any trailing `=` for params without values.
    const paramStr = params
        .toString()
        .replace(/=&/g, '&')
        .replace(/=$/, '')

    // Generate the newly updated url.
    return `${pathname}${Array.from(paramStr).length > 0 ? `?${paramStr}` : ''}`
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
export const searchUrlBuilder = (searchTerm) => `/search?q=${searchTerm}`

/**
 * Returns a relative URL for a locale short code.
 * Based on your app configuration, this function will replace your current locale shortCode with a new one
 *
 * @param {String} shortCode - The locale short code.
 * @param {function(*, *, *, *=): string} - Generates a site URL from the provided path, site and locale.
 * @param {string[]} opts.disallowParams - URL parameters to remove
 * @param {Object} opts.location - location object to replace the default `window.location`
 * @returns {String} url - The relative URL for the specific locale.
 */
export const getPathWithLocale = (shortCode, buildUrl, opts = {}) => {
    const location = opts.location ? opts.location : window.location
    let {siteRef, localeRef} = getParamsFromPath(`${location.pathname}${location.search}`)
    let {pathname, search} = location

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

    const defaultSite = getDefaultSite()

    // Remove query parameters
    const {disallowParams = []} = opts

    let queryString = new URLSearchParams(`${search}`)

    if (disallowParams.length) {
        disallowParams.forEach((param) => {
            queryString.delete(param)
        })
    }

    // rebuild the url with new locale,
    const newUrl = buildUrl(
        `${pathname}${Array.from(queryString).length !== 0 ? `?${queryString}` : ''}`,
        // By default, as for home page, when the values of site and locale belongs to the default site,
        // they will be not shown in the url just
        defaultSite.alias || defaultSite.id,
        shortCode
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
    const sites = getSites()
    const siteAliasOrIdRef =
        sites.find((site) => {
            return site.alias === siteRef || site.id === siteRef
        }) || defaultSite
    const defaultLocale = getLocaleByReference(
        siteAliasOrIdRef,
        siteAliasOrIdRef.l10n.defaultLocale
    )

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
    const paramStr = params
        .toString()
        .replace(/=&/g, '&')
        .replace(/=$/, '')

    return `${pathname}${paramStr && '?'}${paramStr}`
}
