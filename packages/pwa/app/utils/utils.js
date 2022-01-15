/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import pwaKitConfig from '../../pwa-kit.config.json'
import {urlPartPositions} from '../constants'
import {pathToUrl} from './url'
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
 * @param path - path to your target item from pwaKitConfig
 *
 * @example
 * getConfig('app.url') => {locale: 'path', site: 'path'}
 * getConfig('app.sites[0]') => {
                "id": "RefArch",
                "alias": "us",
                "hostnames": [],
                "l10n": {...}
            }
 * @returns {object} - the targeted config value
 */
export const getConfig = (path) => {
    return getObjectProperty(pwaKitConfig, path)
}

/**
 * a function to return url config from pwa config file
 * If a customise funtion is passed, it will use that function.
 * Otherwise, it will look for the url config based on the current host
 * If none is found, it will return the default url config at the top level of the config file
 */
export const getUrlConfig = (path) => {
    const paths = path.split('/')
    // the first part of the paths is eu, I want to url config to have site as in path, none for  locale
    if (paths[1] === 'eu') {
        return {
            site: 'path',
            locale: 'none'
        }
    }
    // a pattern of locale in pathname
    const regExp = /en-\w\w/g
    // if the first part fit the reg ex pattern, it is the locale,
    // I want to url config to set locale as path, none for site
    if (regExp.test(paths[1])) {
        return {
            site: 'none',
            locale: 'path'
        }
    }

    // otherwise, use the default config from the file
    return getConfig('app.url')
}

/**
 * Get the url config base on hostname
 * @param {string} hostname
 * @returns {object|undefined} - url config from the input host
 */
export const getUrlConfigByHostname = (hostname) => {
    const hosts = getConfig('app.hosts')
    const host = hosts.find((host) => host.domain === hostname)
    return host?.url
}

export const isObject = (o) => o?.constructor === Object

/**
 * Get an object property by a string path separated by dot
 * https://stackoverflow.com/questions/6491463/accessing-nested-javascript-objects-and-arrays-by-string-path
 * @param {object} obj - source object to get data from
 * @param {string} path - a string path separated each hierarchy by a dot
 *
 * @example
 * const data = {a: 'string 1', b: [{name: 'name 1'}], c: {id: 'abc', child: {id: 1}}}
 *
 * getObjectProperty(data, 'a') // return 'string 1'
 * getObjectProperty(data, 'c.child') // return [{name: 'name 1'}]
 * getObjectProperty(data, 'b[0].name') // return 'name 1'
 *
 * @returns {array|object|string|undefined}
 */
export const getObjectProperty = (obj, path) => {
    if (!path) return obj
    // remove any leading dot
    path = path.replace(/^\./, '')
    // convert indexes to properties. eg obj[0] => obj.0
    path = path.replace(/\[(\w+)\]/g, '.$1')
    const paths = path.split('.')
    if (!paths.length) return obj
    let result = Object.assign({}, obj)
    for (let i = 0; i < paths.length; i++) {
        const prop = paths[i]
        if ((isObject(result) || Array.isArray(result)) && prop in result) {
            result = result[prop]
        } else {
            return
        }
    }
    return result
}

/**
 * This functions return the param (e.g site and locale) from the given url
 * The site will show up before locale if both of them are presented in the pathname
 * @param path
 * @returns {object}
 */
export const getParamsFromPath = (path) => {
    const {locale: localePosition, site: sitePosition} = getUrlConfig(path)
    const {pathname, search} = new URL(pathToUrl(path))
    const params = new URLSearchParams(search)
    const result = {}
    switch (sitePosition) {
        case urlPartPositions.NONE:
            break
        case urlPartPositions.PATH:
            result.site = pathname.split('/')[1]
            break
        case urlPartPositions.QUERY_PARAM: {
            result.site = params.get('site')
            break
        }
    }

    switch (localePosition) {
        case urlPartPositions.NONE:
            break
        case urlPartPositions.PATH: {
            if (sitePosition === urlPartPositions.PATH) {
                result.locale = pathname.split('/')[2]
            } else {
                result.locale = pathname.split('/')[1]
            }
            break
        }
        case urlPartPositions.QUERY_PARAM: {
            result.locale = params.get('locale')
            break
        }
    }
    return result
}
