/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {pathToUrl} from './url'
import {getSites} from './site-utils'
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
 * bolds a substring of a string by adding <b> tags
 * @param {string} str
 * @param {string} substr
 * @returns stringified HTML Node
 */
export const boldString = (str, substr) => {
    return str.replace(RegExp(substr, 'g'), `<b>${substr}</b>`)
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
 * @param urlConfig {object}
 * @returns {object}
 */
export const getParamsFromPath = (path) => {
    const {pathname, search} = new URL(pathToUrl(path))

    const config = getConfig()
    const {pathMatcher, searchMatcherForSite, searchMatcherForLocale} = getConfigMatcher(config)

    const pathMatch = pathname.match(pathMatcher)
    const searchMatchForSite = search.match(searchMatcherForSite)
    const searchMatchForLocale = search.match(searchMatcherForLocale)

    // the value can only either in the path or search query param, there will be no overridden
    const site =
        pathMatch?.groups.siteAlias ||
        pathMatch?.groups.siteId ||
        searchMatchForSite?.groups.siteAlias ||
        searchMatchForSite?.groups.siteId

    const locale =
        pathMatch?.groups.localeAlias ||
        pathMatch?.groups.localeId ||
        searchMatchForLocale?.groups.localeAlias ||
        searchMatchForLocale?.groups.localeId

    return {site, locale}
}

/**
 * Dynamically load the applications config object.
 *
 * @returns the application config object.
 */
//TODO: Remove this when the work from SDK is merged
export const getConfig = (opts = {}) => {
    let _config

    if (typeof window !== 'undefined') {
        _config = window.__CONFIG__ || JSON.parse(document.getElementById('app-config').innerHTML)
        return _config
    }

    // doing this to force Webpack to ignore a
    // `require()` call that is not meant for the browser
    const _require = eval('require')
    const {cosmiconfigSync} = _require('cosmiconfig')

    // Load the config synchronously using a custom "searchPlaces".

    // By default, use the deployment target as the {moduleName} for your
    // configuration file. This means that on a "Production" names target, you'll load
    // your `config/production.json` file. You can customize how you determine your
    // {moduleName}.
    const {moduleNameResolver} = opts
    const moduleName = (moduleNameResolver && moduleNameResolver()) || process.env.DEPLOY_TARGET

    const explorerSync = cosmiconfigSync(moduleName, {
        packageProp: 'mobify',
        searchPlaces: [
            `config/${moduleName}.json`,
            `config/local.json`,
            `config/default.json`,
            'package.json'
        ]
    })
    const {config, filepath} = explorerSync.search()
    console.info('=========loading the config from=====', filepath)

    return config
}

/**
 * This function returns the url config from the current configuration
 * @return {object} - url config
 */
export const getUrlConfig = () => {
    const {app} = getConfig()
    if (!app.url) {
        throw new Error("Can't find any valid url config. Please check your configuration file.")
    }
    return app.url
}

/**
 * This function return the regex for matching site and locale
 * @param config
 * @return {{searchMatcherForSite: RegExp, searchMatcherForLocale: RegExp, pathMatcher: RegExp}}
 */
export const getConfigMatcher = (config) => {
    if (!config) {
        throw new Error('Config is not defined.')
    }

    const allSites = getSites()

    // get a collection of all site-id and site alias from the config of the current host
    // remove any duplicates by using [...new Set([])]
    const siteIds = allSites.map((site) => site.id)
    const siteAliases = allSites.map((site) => site.alias).filter(Boolean)
    // get a collection of all locale-id and locale alias from the config of the current host
    // remove any duplicates by using [...new Set([])]

    let localeIds = []
    let localeAliases = []
    allSites.forEach((site) => {
        const {l10n} = site
        l10n.supportedLocales.forEach((locale) => {
            localeIds.push(locale.id)
            localeAliases.push(locale.alias)
        })
    })

    localeAliases = localeAliases.filter(Boolean)
    localeIds = localeIds.filter(Boolean)
    // prettier-ignore
    // eslint-disable-next-line
    const pathPattern = `\/*(?<siteId>${siteIds.join('|')})*\/*(?<siteAlias>${siteAliases.join('|')})*\/*(?<localeId>${localeIds.join('|')})*\/*(?<localeAlias>${localeAliases.join('|')})*`
    // prettier-ignore
    // eslint-disable-next-line
    const searchPatternForSite = `site=(?<siteAlias>${siteAliases.join('|')})|site=(?<siteId>${siteIds.join("|")})`

    // prettier-ignore
    // eslint-disable-next-line
    const searchPatternForLocale = `locale=(?<localeAlias>${localeAliases.join('|')})|locale=(?<localeId>${localeIds.join("|")})`
    const pathMatcher = new RegExp(pathPattern)
    const searchMatcherForSite = new RegExp(searchPatternForSite)
    const searchMatcherForLocale = new RegExp(searchPatternForLocale)
    return {
        pathMatcher,
        searchMatcherForSite,
        searchMatcherForLocale
    }
}
