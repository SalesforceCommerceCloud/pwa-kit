/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {absoluteUrl} from './url'
import {getSites, resolveSiteFromUrl} from './site-utils'
import {getConfig} from 'pwa-kit-runtime/utils/ssr-config'

/**
 * Call requestIdleCallback in supported browsers.
 *
 * https://developers.google.com/web/updates/2015/08/using-requestidlecallback
 * http://caniuse.com/#feat=requestidlecallback
 */
export const requestIdleCallback = (fn) => {
    if ('requestIdleCallback' in window) {
        return window.requestIdleCallback(fn)
    } else {
        return setTimeout(() => fn(), 1)
    }
}

export const watchOnlineStatus = (callback, win = window) => {
    const off = () => callback(false)
    const on = () => callback(true)
    win.addEventListener('offline', off)
    win.addEventListener('online', on)
    const unsubscribe = () => {
        win.removeEventListener('offline', off)
        win.removeEventListener('online', on)
    }
    return unsubscribe
}

/**
 * Compares the primary fields of two address objects to determine if they match.
 * @param {Object} addr1
 * @param {Object} addr2
 * @returns {boolean}
 */
export const isMatchingAddress = (addr1, addr2) => {
    const normalize = (addr) => {
        // eslint-disable-next-line no-unused-vars
        const {id, addressId, _type, preferred, creationDate, lastModified, ...normalized} = addr
        return normalized
    }
    return shallowEquals(normalize(addr1), normalize(addr2))
}

/**
 * Performs a shallow comparison on two objects
 * @param {Object} a
 * @param {Object} b
 * @returns {boolean}
 */
export const shallowEquals = (a, b) => {
    for (let key in a) {
        if (!(key in b) || a[key] !== b[key]) {
            return false
        }
    }
    for (let key in b) {
        if (!(key in a) || a[key] !== b[key]) {
            return false
        }
    }
    return true
}

/**
 * No operation function. You can use this
 * empty function when you wish to pass
 * around a function that will do nothing.
 * Usually used as default for event handlers.
 */
export const noop = () => {}

/**
 * Flattens a tree data structure into an array.
 * @param {*} node
 * @returns
 */
export const flatten = (node, key = 'children') => {
    const children = (node[key] || []).reduce((a, b) => {
        return Array.isArray(b[key]) && !!b[key].length
            ? {...a, ...flatten(b, key)}
            : {...a, [b.id]: b}
    }, {})

    return {
        [node.id]: node,
        ...children
    }
}

/**
 * Check the current execution environment
 * is client side or server side
 * @returns Boolean
 */
export const isServer = typeof window === 'undefined'

/**
 * retrieves an item from session storage
 * @param {string} key
 * @returns JSON | undefined
 */
export const getSessionJSONItem = (key) => {
    if (isServer) {
        return undefined
    }
    const item = window.sessionStorage.getItem(key)
    if (item) {
        return JSON.parse(item)
    } else {
        return undefined
    }
}
/**
 * sets an item in session storage
 * @param {string} key
 * @param {string} value
 */
export const setSessionJSONItem = (key, value) => {
    window.sessionStorage.setItem(key, JSON.stringify(value))
}

/**
 * clears an item in session storage
 * @param {string} key
 */
export const clearSessionJSONItem = (key) => {
    window.sessionStorage.removeItem(key)
}

/**
 * escapes special regex characters
 * @param {string} str
 * @returns escaped string
 */
export const escapeRegexChars = (str) => str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')

/**
 * bolds a substring of a string by adding <b> tags
 * @param {string} str
 * @param {string} substr
 * @returns stringified HTML Node
 */
export const boldString = (str, substr) => {
    return str.replace(RegExp(escapeRegexChars(substr.trim()), 'gi'), '<b>$&</b>')
}

/**
 * Capitalizes the words in a string
 * @param {string} text
 * @returns capitalized text
 */
export const capitalize = (text) => {
    return text
        .toLowerCase()
        .split(' ')
        .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
        .join(' ')
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
 * This function returns the url config from the current configuration
 * @return {object} - url config
 */
export const getUrlConfig = () => {
    const {app} = getConfig()
    if (!app.url) {
        throw new Error('Cannot find `url` key. Please check your configuration file.')
    }
    return app.url
}

/**
 * Given your application's configuration this function returns a set of regular expressions used to match the site
 * and locale references from an url.
 * @param config
 * @return {{searchMatcherForSite: RegExp, searchMatcherForLocale: RegExp, pathMatcher: RegExp}}
 */
export const getConfigMatcher = (config) => {
    if (!config) {
        throw new Error('Config is not defined.')
    }

    const allSites = getSites()
    const siteIds = []
    const siteAliases = []
    const localesIds = []
    const localeAliases = []
    allSites.forEach((site) => {
        siteAliases.push(site.alias)
        siteIds.push(site.id)
        const {l10n} = site
        l10n.supportedLocales.forEach((locale) => {
            localesIds.push(locale.id)
            localeAliases.push(locale.alias)
        })
    })
    const sites = [...siteIds, ...siteAliases].filter(Boolean)
    const locales = [...localesIds, ...localeAliases].filter(Boolean)

    // prettier-ignore
    // eslint-disable-next-line
    const searchPatternForSite = `site=(?<site>${sites.join('|')})`
    // prettier-ignore
    // eslint-disable-next-line
    const pathPattern = `(?:\/(?<site>${sites.join('|')}))?(?:\/(?<locale>${locales.join("|")}))?(?!\\w)`
    // prettier-ignore
    // eslint-disable-next-line
    const searchPatternForLocale = `locale=(?<locale>${locales.join('|')})`
    const pathMatcher = new RegExp(pathPattern)
    const searchMatcherForSite = new RegExp(searchPatternForSite)
    const searchMatcherForLocale = new RegExp(searchPatternForLocale)
    return {
        pathMatcher,
        searchMatcherForSite,
        searchMatcherForLocale
    }
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
