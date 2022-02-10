/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {resolveConfigFromPath} from './url-config'
import {getAppOrigin} from 'pwa-kit-react-sdk/utils/url'
import {buildPathWithUrlConfig} from './url-config'
import {getConfig} from './utils'

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
 * This function will take based on the url config from the pwa-kit.config
 * to look for the locale position from the path/param
 * and replace it with new shortCode
 *
 * @param {string} shortCode - The locale short code.
 * @param {object} [opts] - Options, if there's any.
 * @param {Object} opts.location - location object to replace the default `window.location`
 * @returns {string} - The relative URL for the specific locale.
 */
export const getUrlWithLocale = (shortCode, opts = {}) => {
    const location = opts.location ? opts.location : window.location
    const {site, locale, url} = resolveConfigFromPath(`${location.pathname}${location.search}`)
    let {pathname, search} = location

    // sanitize the locale/site from the current Url
    pathname = pathname.replace(`/${site}`, '').replace(`/${locale}`, '')
    search = search
        .replace(`locale=${locale}`, '')
        .replace(`site=${site}`, '')
        .replace(/&$/, '')
    // rebuild the url with new locale
    const newUrl = buildPathWithUrlConfig(
        `${pathname}${search}`,
        {site, url, locale: shortCode},
        opts
    )
    return newUrl
}

/**
 * Builds the Home page URL for a given locale and site.
 *
 * @param homeHref
 * @param options
 * @returns {string}
 */
export const homeUrlBuilder = (homeHref, options = {}) => {
    const {locale, site} = options
    const {url} = getConfig()
    const updatedUrl = buildPathWithUrlConfig(homeHref, {
        locale,
        site: site.alias || site.id,
        url
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
