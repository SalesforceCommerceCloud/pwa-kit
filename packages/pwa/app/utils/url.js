/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {DEFAULT_LOCALE} from '../constants'
import {getUrlConfig} from './utils'
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

        if (!value) {
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
 * @param {Object} [opts] - Options, if there's any.
 * @param {string[]} opts.disallowParams - URL parameters to remove
 * @param {Object} opts.location - location object to replace the default `window.location`
 * @returns {string} - The relative URL for the specific locale.
 */
export const getUrlWithLocale = (shortCode, opts = {}) => {
    const {locale: localeParamType} = getUrlConfig()
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

    if (localeParamType === urlParamTypes.PATH) {
        // Array of the paths without empty items

        // Remove the previous locale
        paths.shift()

        // Add the new locale
        if (shortCode !== DEFAULT_LOCALE || paths?.length > 0) {
            paths.unshift(shortCode)
        }
    } else if (localeParamType === urlParamTypes.QUERY_PARAM) {
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
 * @param locale
 * @returns {string}
 */
export const homeUrlBuilder = (homeHref, locale) => {
    const updatedUrl = buildPathWithUrlConfigParams(homeHref, {
        locale: locale !== DEFAULT_LOCALE ? locale : ''
    })
    console.log('updatedUrl', updatedUrl)
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
 * @return {string} - an output url
 *
 * @example
 * //pwa-kit-config.json
 * url {
 *    locale: "query_param"
 * }
 * buildPathWithLocaleAndSiteParams('/women/dresses', {locale: 'en-GB'})
 *
 * Returns
 *  /women/dresses?locale=en-GB
 *
 *  @example
 * //pwa-kit-config.json
 * url {
 *    locale: "path"
 * }
 * buildPathWithLocaleAndSiteParams('/women/dresses', {locale: 'en-GB'})
 *
 * Returns
 *  /en-GB/women/dresses
 *
 */
export const buildPathWithUrlConfigParams = (url, configValues = {}) => {
    const urlConfig = getUrlConfig()
    if (!Object.values(configValues).length) return url
    const {locale, siteAlias} = configValues
    const queryParams = {}
    const basePathSegments = []

    const localeParamType = urlConfig['locale']
    if (localeParamType === urlParamTypes.QUERY_PARAM) {
        queryParams.locale = locale
    }

    if (localeParamType === urlParamTypes.PATH) {
        basePathSegments.push(locale)
    }

    const siteAliasParamType = urlConfig['siteAlias']
    if (siteAliasParamType === urlParamTypes.QUERY_PARAM) {
        queryParams.locale = siteAlias
    }

    if (siteAliasParamType === urlParamTypes.PATH) {
        basePathSegments.push(siteAlias)
    }
    // filter the array and build the pathname
    let updatedPath = `${
        basePathSegments.filter(Boolean).length ? `/${basePathSegments.join('/')}` : ''
    }${url}`
    // append the query param to pathname
    if (Object.keys(queryParams).length) {
        updatedPath = rebuildPathWithParams(updatedPath, queryParams)
    }

    return updatedPath
}
