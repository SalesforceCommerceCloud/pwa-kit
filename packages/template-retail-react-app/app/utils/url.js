/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getAppOrigin} from 'pwa-kit-react-sdk/utils/url'
import {getLocaleByReference, getParamsFromPath} from './utils'
import {getDefaultSite, getSites} from './site-utils'
import {HOME_HREF} from '../constants'

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
 * Given a search term, contructs a search url.
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
 * @param {Object} [opts] - Options, if there's any.
 * @param {Object} opts.location - location object to replace the default `window.location`
 * @returns {String} url - The relative URL for the specific locale.
 */
export const getPathWithLocale = (shortCode, opts = {}) => {
    const location = opts.location ? opts.location : window.location
    let {siteRef, localeRef} = getParamsFromPath(`${location.pathname}${location.search}`)
    let {pathname, search} = location
    const urlTemplateLiteral = opts.urlTemplateLiteral

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
    const isHomeRef = pathname === HOME_HREF

    const isDefaultLocaleOfDefaultSite = shortCode === defaultSite.l10n.defaultLocale
    const isDefaultSite = siteRef === defaultSite.alias || siteRef === defaultSite.id
    // rebuild the url with new locale,
    const newUrl = urlTemplateLiteral(
        `${pathname}${search}`,
        // By default, as for home page, when the values of site and locale belongs to the default site,
        // they will be not shown in the url just
        isDefaultLocaleOfDefaultSite && isDefaultSite && isHomeRef
            ? ''
            : siteRef || defaultSite.alias || defaultSite.id,
        isDefaultLocaleOfDefaultSite && isDefaultSite && isHomeRef ? '' : shortCode
    )
    return newUrl
}

//TODO: Clean up and merge cases
//TODO: Add option disallowParams: ['refine']
export const getUrlTemplateLiteral = (appConfig, siteUrl, localeUrl) => {
    const {site: siteConfig, locale: localeConfig, showDefaults: showDefaultsConfig} = appConfig.url
    const defaultSite = getDefaultSite()
    const sites = getSites()
    const site =
        sites.find((site) => {
            return site.alias === appConfig['site'] || site.id === appConfig['site']
        }) || defaultSite
    const defaultLocale = getLocaleByReference(site, site.l10n.defaultLocale)

    const isDefaultSite = defaultSite === siteUrl
    const isDefaultLocale = defaultLocale === localeUrl

    //TODO: Clean unused variables
    /* eslint-disable no-unused-vars */
    /* eslint-disable no-unreachable */

    switch (true) {
        // showDefaultsConfig
        case siteConfig === 'path' && localeConfig === 'path' && showDefaultsConfig:
            return (href, site, locale) =>
                `${site ? `/${site}` : ''}${locale ? `/${locale}` : ''}${href}`
            break
        case siteConfig === 'path' && localeConfig === 'query_param' && showDefaultsConfig:
            return (href, site, locale) => `/${site}${href}?locale=${locale}`
            break
        case siteConfig === 'path' && localeConfig === 'none' && showDefaultsConfig:
            return (href, site, locale) => `/${site}${href}`
            break
        case siteConfig === 'query_param' && localeConfig === 'path' && showDefaultsConfig:
            return (href, site, locale) => `/${locale}${href}?site=${site}`
            break
        case siteConfig === 'query_param' && localeConfig === 'query_param' && showDefaultsConfig:
            return (href, site, locale) => `/${href}?site=${site}&locale=${locale}`
            break
        case siteConfig === 'query_param' && localeConfig === 'none' && showDefaultsConfig:
            return (href, site, locale) => `/${href}?site=${site}`
            break
        case siteConfig === 'none' && localeConfig === 'path' && showDefaultsConfig:
            return (href, site, locale) => `/${locale}${href}`
            break
        case siteConfig === 'none' && localeConfig === 'query_param' && showDefaultsConfig:
            return (href, site, locale) => `/${href}?locale=${locale}`
            break
        // !showDefaultsConfig
        case siteConfig === 'path' && localeConfig === 'path' && !showDefaultsConfig:
            if (!isDefaultLocale && !isDefaultSite)
                return (href, site, locale) => `/${site}/${locale}${href}`
            if (!isDefaultLocale && isDefaultSite)
                return (href, site, locale) => `/${locale}${href}`
            if (isDefaultLocale && !isDefaultSite) return (href, site, locale) => `/${site}${href}`
            break
        case siteConfig === 'path' && localeConfig === 'query_param' && !showDefaultsConfig:
            if (!isDefaultLocale && !isDefaultSite)
                return (href, site, locale) => `/${site}${href}?locale=${locale}`
            if (!isDefaultLocale && isDefaultSite)
                return (href, site, locale) => `/${href}?locale=${locale}`
            if (isDefaultLocale && !isDefaultSite) return (href, site, locale) => `/${site}${href}`
            break
        case siteConfig === 'path' && localeConfig === 'none' && !showDefaultsConfig:
            if (!isDefaultSite) return (href, site, locale) => `/${site}${href}`
            break
        case siteConfig === 'query_param' && localeConfig === 'path' && !showDefaultsConfig:
            if (!defaultLocale && !defaultSite)
                return (href, site, locale) => `/${locale}${href}?site=${site}`
            if (!defaultLocale && defaultSite) return (href, site, locale) => `/${locale}${href}`
            if (defaultLocale && !defaultSite)
                return (href, site, locale) => `/${href}?site=${site}`
            break
        case siteConfig === 'query_param' && localeConfig === 'query_param' && !showDefaultsConfig:
            if (!defaultLocale && !defaultSite)
                return (href, site, locale) => `/${href}?site=${site}&locale=${locale}`
            if (!defaultLocale && defaultSite)
                return (href, site, locale) => `/${href}?locale=${locale}`
            if (defaultLocale && !defaultSite)
                return (href, site, locale) => `/${href}?site=${site}`
            break
        case siteConfig === 'query_param' && localeConfig === 'none' && !showDefaultsConfig:
            if (!defaultSite) return (href, site, locale) => `/${href}?site=${site}`
            break
        case siteConfig === 'none' && localeConfig === 'path' && !showDefaultsConfig:
            if ((!defaultLocale && !defaultSite) || (!defaultLocale && defaultSite))
                return (href, site, locale) => `/${locale}${href}`
            break
        case siteConfig === 'none' && localeConfig === 'query_param' && !showDefaultsConfig:
            if ((!defaultLocale && !defaultSite) || (!defaultLocale && defaultSite))
                return (href, site, locale) => `/${href}?locale=${locale}`
            break
        default:
            return (href) => `${href ? `/${href}` : ''}`
    }
}

/**
 * Builds the Home page URL for a given locale and site.
 * By default, when the values of site and locale belongs to the default site,
 * they will be not shown in the url.
 *
 * Adjust the logic here to fit your cases
 *
 * @param homeHref
 * @param options
 * @returns {string}
 */
export const homeUrlBuilder = (homeHref, options = {}) => {
    const {locale, site, urlTemplateLiteral} = options
    const defaultSite = getDefaultSite()
    const isDefaultLocaleOfDefaultSite =
        locale.alias === defaultSite.l10n.defaultLocale ||
        locale.id === defaultSite.l10n.defaultLocale
    const isDefaultSite = site.id === defaultSite.id || site.alias === defaultSite.alias
    const updatedUrl = urlTemplateLiteral(
        homeHref,
        isDefaultLocaleOfDefaultSite && isDefaultSite ? '' : site.alias || site.id,
        isDefaultLocaleOfDefaultSite && isDefaultSite ? '' : locale.alias || locale.id
    )
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
