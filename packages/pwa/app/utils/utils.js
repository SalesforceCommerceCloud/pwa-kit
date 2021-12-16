/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import pwaKitConfig from '../../pwa-kit.config.json'
import {getAppOrigin} from 'pwa-kit-react-sdk/utils/url'

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
 * Get the pwa configuration object from pwa-kit.config.json
 * @returns {object} - the configuration object
 */
export const getConfig = () => pwaKitConfig

/**
 * Determine the site from the url
 * @param {string} url
 * @returns {object}
 */
export const resolveSiteFromUrl = (url) => {
    const {
        app: {defaultSiteId, sites: sitesConfig}
    } = getConfig()
    let path = url
    if (!path) {
        path = `${window?.location.pathname}${window?.location.search}`
    }
    let site
    // Step 1: look for the site from the url, if found, return the site
    site = getSiteByUrl(path)
    if (site) {
        return site
    }

    // Step 2: look for the site from the hostname, if found, return it
    const {hostname} = new URL(`${getAppOrigin()}${path}`)
    site = getSiteByHostname(hostname)

    if (site) {
        return site
    }

    // Step 3: use the default if none of above works
    site = sitesConfig.find((site) => site.id === defaultSiteId)

    // Step 4: throw an error if site can't be found by any of the above steps
    if (!site) {
        throw new Error("Can't find any site. Please check you sites configuration.")
    }
    return site
}

/**
 * Get the site Id based on the given hostname
 * @param {string} hostname
 * @returns {string} siteId
 */
export const getSiteByHostname = (hostname) => {
    const {
        app: {sites: sitesConfig}
    } = getConfig()

    if (!sitesConfig.length) throw new Error('No site config found. Please check you configuration')
    if (!hostname) return undefined

    const site = sitesConfig.filter((site) => {
        return site?.hostnames?.some((i) => i.includes(hostname))
    })

    return site?.length === 1 ? site[0] : undefined
}

/**
 * return l10n config for current site
 * @param url
 * @returns {object}
 */
export const getL10nConfig = (url) => {
    const {
        app: {sites: sitesConfig}
    } = getConfig()
    if (!sitesConfig.length) throw new Error('No site config found. Please check you configuration')
    const siteId = resolveSiteFromUrl(url)?.id
    const l10nConfig = sitesConfig.find((site) => site.id === siteId)?.l10n
    return l10nConfig
}

/**
 * get the site by looking for the site value (either site id or alias) from the url
 * @param url
 * @returns {object|undefined}
 */
export const getSiteByUrl = (url) => {
    const {siteIdsRegExp, siteAliasesRegExp} = getSitesRegExp()

    let site
    const aliasMatch = url.match(siteAliasesRegExp)
    const idMatch = url.match(siteIdsRegExp)
    if (aliasMatch) {
        // clean up any non-character
        const siteAlias = aliasMatch[0].replace(/\W/g, '')
        site = getSiteByAlias(siteAlias)
    } else if (idMatch) {
        // clean up any non-character
        const siteId = idMatch[0].replace(/\W/g, '')
        site = getSiteById(siteId)
    }
    return site
}

/**
 * return site by looking through site configuration array by site id
 * @param id - site Id
 * @returns {object|undefined}
 */
const getSiteById = (id) => {
    const {
        app: {sites}
    } = getConfig()
    if (!sites.length) return undefined
    if (!id) throw new Error('id is required')

    return sites.find((site) => site.id === id)
}

/**
 * return site by looking through site configuration array by the alias
 * @param alias - site alias
 * @returns {undefined|object}
 */
const getSiteByAlias = (alias) => {
    const {
        app: {sites}
    } = getConfig()
    if (!sites.length) return undefined
    if (!alias) throw new Error('alias is required')

    return sites.find((site) => site.alias === alias)
}

/**
 * A util to create RegExp for siteId and siteAlias based on site configuration from pwa-kit.config.json
 *
 * @example
 * sites: [{id: 'RefArchGlobal', alias: 'global', l10n: {...}}]
 *
 * getSitesRegExp()
 * // returns {
 *     siteIdsRegExp: /(=RefArchGlobal\b)|/(RefArchGlobal)/?/gi
 *     siteAliasRegExp: /(=global\b)|(/global/)?/gi
 * }
 *
 * @returns {object}
 */
export const getSitesRegExp = () => {
    const {
        app: {sites}
    } = getConfig()
    let idsRegExpPattern = []
    let aliasRegExpPattern = []

    sites.forEach((site) => {
        idsRegExpPattern.push(`(/${site.id}/?)`)
        idsRegExpPattern.push(`(=${site.id}\\b)`)
        aliasRegExpPattern.push(`(/${site.alias}/?)`)
        aliasRegExpPattern.push(`(=${site.alias}\\b)`)
    })
    const siteIdsRegExp = new RegExp(idsRegExpPattern.join('|'), 'g')
    const siteAliasesRegExp = new RegExp(aliasRegExpPattern.join('|'), 'g')
    return {
        siteIdsRegExp,
        siteAliasesRegExp
    }
}
