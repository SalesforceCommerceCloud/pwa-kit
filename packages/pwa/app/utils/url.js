/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {DEFAULT_LOCALE} from '../constants'
import {getUrlsConfig, urlsConfigValidator} from './utils'
import {urlParamTypes} from '../constants'

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

        if (value !== undefined) {
            params.set(key, value)
        } else {
            params.delete(key)
        }
    })

    // Clean up any trailing `=` for params without values.
    const paramStr = params
        .toString()
        .replace(/=&/g, '&')
        .replace(/=$/, '')

    // Generate the newly updated url.
    return `${pathname}?${paramStr}`
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
 * @param {Object} options
 * @returns {string}
 */
export const categoryUrlBuilder = (category, options = {}) => {
    const {locale = DEFAULT_LOCALE, ...rest} = options
    const categoryPath = `/category/${category.id}`
    const updatedUrl = routeBuilder(categoryPath, {locale, ...rest})
    return encodeURI(updatedUrl)
}

/**
 * Given a product and the current locale returns an href to the product detail page.
 *
 * @param {Object} product
 * @param {Object} options
 * @returns {string}
 */
export const productUrlBuilder = (product, options = {}) => {
    const productPath = `/product/${product.id}`
    const {locale = DEFAULT_LOCALE, ...rest} = options
    const updatedUrl = routeBuilder(productPath, {locale, ...rest})
    return encodeURI(updatedUrl)
}

/**
 * Given a search term, contructs a search url.
 *
 * @param {string} searchTerm
 * @param {object} options
 * @returns {string}
 */
export const searchUrlBuilder = (searchTerm, options = {}) => {
    const searchPath = `/search?q=${searchTerm}`
    const updatedPath = routeBuilder(searchPath, options)
    return encodeURI(updatedPath)
}

/**
 * Returns a relative URL for a locale short code.
 *
 * @param {string} shortCode - The locale short code.
 * @param {Object} [opts] - Options, if there's any.
 * @param {string[]} opts.disallowParams - URL parameters to remove
 * @param {Object} opts.location - location object to replace the default `window.location`
 * @returns {string} - The relative URL for the specific locale.
 */
export const getUrlWithLocale = (shortCode, opts = {}) => {
    const {locale: localeType} = getUrlsConfig()
    const location = opts.location ? opts.location : window.location
    const {disallowParams = []} = opts
    let relativeUrl = location.pathname

    const params = new URLSearchParams(location.search)

    // Remove any disallowed params.
    if (disallowParams.length) {
        disallowParams.forEach((param) => {
            params.delete(param)
        })
    }

    let paths = []
    paths = relativeUrl.split('/').filter((path) => path !== '')

    if (localeType === urlParamTypes.PATH) {
        // Array of the paths without empty items

        // Remove the previous locale
        paths.shift()

        // Add the new locale
        if (shortCode !== DEFAULT_LOCALE || paths?.length > 0) {
            paths.unshift(shortCode)
        }
    } else if (localeType === urlParamTypes.QUERY_PARAM) {
        params.set('locale', shortCode)
    }

    relativeUrl = `/${paths.join('/')}${Array.from(params).length > 0 ? `?${params}` : ''}`

    return relativeUrl
}

/**
 * Builds the Home page URL for a given locale.
 * We don't add the locale to the URL for the default locale.
 *
 * @param homeHref
 * @param options
 * @returns {string}
 */
export const homeUrlBuilder = (homeHref, options) => {
    const updatedUrl = routeBuilder(homeHref, options)
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
    console.log('paramStr', paramStr)

    return `${pathname}${paramStr && '?'}${paramStr}`
}

/**
 * Build a route based on the url configuration
 * if the type = path => append its value to the url
 * if the type = query param => build the url with updated query params
 * @param {string} url - based url of the output url
 * @param {object} options - object that contains values of url config key
 * @return {string} - an output url
 */
export const routeBuilder = (url, options = {}) => {
    const urlsConfig = getUrlsConfig()
    if (!urlsConfigValidator(urlsConfig, Object.values(urlParamTypes))) return url
    if (!Object.keys(urlsConfig).length) return url
    let urlSegments = []
    const queryParams = {}

    Object.keys(urlsConfig).forEach((key) => {
        const type = urlsConfig[key]
        if (!options[key]) {
            return
        }
        if (type === urlParamTypes.PATH) {
            urlSegments.push(options[key])
        }
        if (type === urlParamTypes.QUERY_PARAM) {
            queryParams[key] = options[key]
        }
    })

    // build the pathname
    let updatedPath = `${urlSegments.length ? `/${urlSegments.join('/')}` : ''}${url}`
    // append the query param to pathname if there is any
    if (Object.keys(queryParams).length) {
        updatedPath = rebuildPathWithParams(updatedPath, queryParams)
    }

    return updatedPath
}
