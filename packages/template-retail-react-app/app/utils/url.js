/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getAppOrigin} from 'pwa-kit-react-sdk/utils/url'
import {getConfig} from 'pwa-kit-runtime/utils/ssr-config'
import {getDefaultSite, getSiteByReference, getSites} from './site-utils'
import {getConfigMatcher} from './utils'
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

    const site = getSiteByReference(siteRef)

    const locale = getLocaleByReference(site, shortCode)

    // rebuild the url with new locale,
    const newUrl = buildUrl(
        `${pathname}${Array.from(queryString).length !== 0 ? `?${queryString}` : ''}`,
        // By default, as for home page, when the values of site and locale belongs to the default site,
        // they will be not shown in the url just
        defaultSite.alias || defaultSite.id,
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
 * This functions takes an url and returns a site object,
 * an error will be thrown if no url is passed in or no site is found
 * @param {string} url
 * @returns {object} site - a site object
 */
export const resolveSiteFromUrl = (url) => {
    if (!url) {
        throw new Error('URL is required to find a site object.')
    }
    const {pathname, search} = new URL(absoluteUrl(url))
    const path = `${pathname}${search}`
    let site

    // get the site identifier from the url
    const {siteRef} = getParamsFromPath(path)
    const sites = getSites()

    // step 1: use the siteRef to look for the site from the sites in the app config
    // since alias is optional, make sure it is defined before the equality check
    site = sites.find((site) => site.id === siteRef || (site.alias && site.alias === siteRef))
    if (site) {
        return site
    }

    //Step 2: if step 1 does not work, use the defaultSite value to get the default site
    site = getDefaultSite()
    // Step 3: throw an error if site can't be found by any of the above steps
    if (!site) {
        throw new Error(
            "Can't find a matching default site. Please check your sites configuration."
        )
    }
    return site
}

/**
 * Given a site and a locale reference, return the locale object
 * @param site - site to look for the locale
 * @param localeRef - the locale ref to look for in site supported locales
 * @return {object|undefined}
 */
export const getLocaleByReference = (site, localeRef) => {
    if (!site) {
        throw new Error('Site is not defined. It is required to look for locale object')
    }
    return site.l10n.supportedLocales.find(
        (locale) => locale.id === localeRef || locale.alias === localeRef
    )
}

/**
 * This function return the identifiers (site and locale) from the given url
 * The site will always go before locale if both of them are presented in the pathname
 * @param path {string}
 * @returns {{siteRef: string, localeRef: string}} - site and locale reference (it could either be id or alias)
 */
export const getParamsFromPath = (path) => {
    const {pathname, search} = new URL(absoluteUrl(path))

    const config = getConfig()
    const {pathMatcher, searchMatcherForSite, searchMatcherForLocale} = getConfigMatcher(config)
    const pathMatch = pathname.match(pathMatcher)
    const searchMatchForSite = search.match(searchMatcherForSite)
    const searchMatchForLocale = search.match(searchMatcherForLocale)

    // the value can only either in the path or search query param, there will be no overridden
    const siteRef = pathMatch?.groups.site || searchMatchForSite?.groups.site

    const localeRef = pathMatch?.groups.locale || searchMatchForLocale?.groups.locale
    return {siteRef, localeRef}
}

/**
 * Determine the locale object from an url
 * If the localeRef is not found from the url, set it to default locale of the current site
 * and use it to find the locale object
 *
 * @param url
 * @return {Object} locale object
 */
export const resolveLocaleFromUrl = (url) => {
    if (!url) {
        throw new Error('URL is required to look for the locale object')
    }
    let {localeRef} = getParamsFromPath(url)
    const site = resolveSiteFromUrl(url)
    const {supportedLocales} = site.l10n
    // if no localeRef is found, use the default value of the current site
    if (!localeRef) {
        localeRef = site.l10n.defaultLocale
    }
    const locale = supportedLocales.find(
        (locale) => locale.alias === localeRef || locale.id === localeRef
    )
    if (locale) {
        return locale
    }
    // if locale is not defined, use default locale as fallback value
    const defaultLocale = site.l10n.defaultLocale
    return supportedLocales.find(
        (locale) => locale.alias === defaultLocale || locale.id === defaultLocale
    )
}
