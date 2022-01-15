/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {HOME_HREF} from '../constants'
import {getUrlConfig} from './utils'
import {urlPartPositions} from '../constants'
import {getAppOrigin} from 'pwa-kit-react-sdk/utils/url'
import {getDefaultSiteIdByHost} from './site-utils'

/**
 * A function that takes a path and qualifies it with the current host and protocol.
 * This function works on the client and on the server.
 *
 * @example
 * urlToPath(/women/dresses?color=black)
 *
 * // returns //http(s)://www.site.com/women/dresses?color=black
 * @param path
 * @returns {string|*}
 */
export const pathToUrl = (path) => {
    return `${getAppOrigin()}${path}`
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
 * Given a search term, contructs a search url.
 *
 * @param {string} searchTerm
 * @returns {string}
 */
export const searchUrlBuilder = (searchTerm) => `/search?q=${searchTerm}`

/**
 * Returns a relative URL for a locale short code.
 *
 * @param {string} shortCode - The locale short code.
 * @param {{site: {l10n: {defaultLocale: string}, alias: string, id: string}, location: URL}} [opts] - Options, if there's any.
 * @param {string[]} opts.disallowParams - URL parameters to remove
 * @param {Object} opts.location - location object to replace the default `window.location`
 * @returns {string} - The relative URL for the specific locale.
 */
export const getUrlWithLocale = (shortCode, opts = {}) => {
    const {hostname} = new URL(getAppOrigin())
    const defaultSiteId = getDefaultSiteIdByHost(hostname)
    const location = opts.location ? opts.location : window.location
    const {locale: localePosition, site: sitePosition} = getUrlConfig(location.pathname)
    const {disallowParams = [], site} = opts
    let relativeUrl = location.pathname

    const params = new URLSearchParams(location.search)

    // Remove any disallowed params.
    if (disallowParams.length) {
        disallowParams.forEach((param) => {
            params.delete(param)
        })
    }

    console.log('getUrlWithLocale ====================')

    if (relativeUrl === HOME_HREF) {
        console.log(' -------------------------relativeUrl', relativeUrl)
        relativeUrl = buildPathWithUrlConfig(relativeUrl, {site: site?.alias, locale: shortCode})
    } else {
        let paths = relativeUrl.split('/').filter((path) => path !== '')
        // remove old locale and site, rebuild the url with new locale and site
        if (localePosition === urlPartPositions.PATH && sitePosition === urlPartPositions.PATH) {
            // remove first two elements which is the site and locale
            paths.splice(0, 2)
            const pathWithoutBaseSegments = `/${paths.join('/')}`
            const isDefaultSite = site.id === defaultSiteId
            const isDefaultLocale = shortCode === site?.l10n?.defaultLocale
            // we don't want to show  site and locale when they are the home page and they are both default values
            const updatedPath = `${buildPathWithUrlConfig(pathWithoutBaseSegments, {
                locale: isDefaultLocale && isDefaultSite && paths.length === 0 ? '' : shortCode,
                site: isDefaultLocale && isDefaultSite && paths.length === 0 ? '' : site?.alias
            })}`
            relativeUrl = `${updatedPath}${Array.from(params).length > 0 ? `?${params}` : ''}`
        } else {
            paths.splice(0, 1, shortCode)
            relativeUrl = `/${paths.join('/')}${Array.from(params).length > 0 ? `?${params}` : ''}`
        }
    }
    return relativeUrl
}

/**
 * Builds the Home page URL for a given locale and site.
 * locale and site wil be shown at all times except when both of them are default values
 *
 * '/' default locale & site
 * '/global/it-IT', '/?locale=it-IT&site=global' non-default locale, default site
 * '/us', '/?site=us  default locale, non-default site
 * '/us/it-IT' '/?locale=it-IT&site=us' non-default locale, non-default site
 * @param homeHref
 * @param options
 * @returns {string}
 */
export const homeUrlBuilder = (homeHref, options = {}) => {
    console.log('homeUrlBuilder')
    const {locale, site} = options
    const {hostname} = new URL(getAppOrigin())
    const defaultSiteId = getDefaultSiteIdByHost(hostname)
    const {l10n} = site
    const defaultLocale = l10n.defaultLocale
    const updatedUrl = buildPathWithUrlConfig(homeHref, {
        locale: site?.id === defaultSiteId && locale === defaultLocale ? '' : locale,
        site: site?.id === defaultSiteId && locale === defaultLocale ? '' : site?.alias
    })
    return encodeURI(updatedUrl)
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

/**
 * Rebuild the path with locale/site value to the path as url path or url query param
 * based on url config
 * @param {string} url - based url of the output url
 * @param {object} configValues - object that contains values of url param config
 * @param {object} opts - options
 * @return {string} - an output url
 *
 * @example
 * //pwa-kit.config.json
 * url {
 *    locale: "query_param"
 * }
 * buildPathWithUrlConfig('/women/dresses', {locale: 'en-GB'})
 *
 * Returns
 *  /women/dresses?locale=en-GB
 *
 *  @example
 * //pwa-kit.config.json
 * url {
 *    locale: "path"
 * }
 * buildPathWithUrlConfig('/women/dresses', {locale: 'en-GB'})
 *
 * Returns
 *  /en-GB/women/dresses
 *
 */
export const buildPathWithUrlConfig = (url, configValues = {}, opts = {}) => {
    const urlConfig = getUrlConfig(opts.pathname)
    if (!urlConfig || !Object.values(urlConfig).length) return url
    if (!Object.values(configValues).length) return url
    const queryParams = {}
    let basePathSegments = []

    const options = ['site', 'locale']

    options.forEach((option) => {
        const position = urlConfig[option]
        switch (position) {
            case urlPartPositions.NONE:
                break
            case urlPartPositions.QUERY_PARAM:
                queryParams[option] = configValues[option]
                break
            case urlPartPositions.PATH:
                basePathSegments.push(configValues[option])
                break
        }
    })
    // filter out falsy value in the array
    basePathSegments = basePathSegments.filter(Boolean)
    let updatedPath = `${basePathSegments.length ? `/${basePathSegments.join('/')}` : ''}${url}`
    // append the query param to pathname
    if (Object.keys(queryParams).length) {
        updatedPath = rebuildPathWithParams(updatedPath, queryParams)
    }
    return updatedPath
}
