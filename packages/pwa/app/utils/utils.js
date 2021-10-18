/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import pwaKitConfig from '../../pwa-kit-config.json'
import {HOME_HREF} from '../constants'
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

export const getAppConfig = () => {
    return pwaKitConfig.app
}

/**
 * get siteId based on the site configuration
 * @param appConfig
 * @param originalUrl
 * @param appOrigin
 * @returns {string|undefined|*}
 */
export const getSiteId = (appConfig = {}, originalUrl, appOrigin) => {
    const {sites, defaultSiteId} = appConfig
    let path = originalUrl
    // If there is no originalUrl value in the locals, create it from the window location.
    // This happens when executing on the client.
    if (!path) {
        path = window?.location.href.replace(window.location.origin, '')
    }

    const {hostname, pathname} = new URL(`${appOrigin}${path}`)
    let siteInfo
    siteInfo = sites.filter((site) => {
        return site.hostname.includes(hostname)
    })

    // return the id when there is one match
    if (siteInfo.length === 1) {
        console.log('return by hostname', siteInfo)
        return siteInfo[0].id
    }

    // if there are more than two matches, we need to rely on siteAlias to determine the siteID
    // The home page does not have siteAlias param, we take the default value
    if (path === HOME_HREF) {
        const siteIdArr = sites.map((site) => site.id)
        // check if the default value is in the sites array config
        if (!siteIdArr.includes(defaultSiteId)) {
            throw new Error(
                'The default SiteId does not match any values from the site configuration. Please check your config'
            )
        }
        console.log('homepage default siteId', defaultSiteId)
        return defaultSiteId
    }

    // return site Id based on site alias from the pathname
    const siteAlias = pathname.split('/')[1]
    const siteId = sites.find((site) => {
        return site.alias === siteAlias
    })?.id

    console.log('siteSite from url site alias', siteId)

    return siteId
}

/**
 * returns alias by on siteId
 * @param siteId
 * @param sites
 * @returns {*}
 */
export const getSiteAliasById = (siteId, sites) => {
    if (!siteId) throw new Error('Cannot find siteId')
    return sites.find((site) => site.id === siteId)?.alias
}

/**
 * return alias by on the hostname
 * @param sites
 * @param hostname
 * @returns {*}
 */
export const getSiteAliasByHostname = (hostname, sites) => {
    if (!sites.length) throw new Error('No site config found. Please check you configuration')
    if (!hostname) throw new Error('Hostname is required to find the alias')
    const results = sites.find((site) => site.hostname.includes(hostname))
    // we only want to return the alias when there is one site info as a result
    return results?.length === 1 ? results[0].alias : undefined
}
