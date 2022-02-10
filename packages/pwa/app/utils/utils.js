/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

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
 * This function return the param (e.g site and locale) from the given url
 * The site will show up before locale if both of them are presented in the pathname
 * @param path {string}
 * @param urlConfig {object}
 * @returns {object}
 */
export const getParamsFromPath = (path, urlConfig = {}) => {
    const result = {}
    const {pathname, search} = new URL(pathToUrl(path))
    const params = new URLSearchParams(search)
    // split the pathname into an array and remove falsy values
    const paths = pathname.split('/').filter(Boolean)
    const sitePosition = urlConfig.site
    if (sitePosition === urlPartPositions.PATH) {
        result.site = paths[0]
    } else if (sitePosition === urlPartPositions.QUERY_PARAM) {
        result.site = params.get('site')
    }

    const localePosition = urlConfig.locale
    if (localePosition === urlPartPositions.PATH) {
        if (sitePosition === urlPartPositions.PATH) {
            result.locale = paths[1]
        } else {
            result.locale = paths[0]
        }
    } else if (localePosition === urlPartPositions.QUERY_PARAM) {
        result.locale = params.get('locale')
    }
    return result
}

/**
 * Dynamically load the applications config object.
 *
 * @returns the application config object.
 */
export const DEFAULT_CONFIG_MODULE_NAME = 'default'
let _config
export const getConfig = (opts = {}) => {
    if (_config) {
        return _config
    }

    if (typeof window !== 'undefined') {
        _config = JSON.parse(document.getElementById('app-config').innerHTML)
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

    console.log(' process.env.DEPLOY_TARGET', process.env.DEPLOY_TARGET)

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
    console.info('================loading the config from===============', filepath)

    // this file store the information about a demandware sites like site id, locales, currencies etc
    const sitesExplorer = cosmiconfigSync(moduleName, {
        searchPlaces: [
            `config/${moduleName}-sites.json`,
            `config/local-sites.json`,
            `config/default-sites.json`
        ]
    })

    const {config: sitesConfig} = sitesExplorer.search()
    // we want to unite all the sites information into one single place to make it easier to use across the app
    const res = {...config, sites: mapSiteObjectToList(config.sites, sitesConfig)}
    return res
}

/**
 * Loop over the array, and use the site id to get the connected object from sitesObject (that has extra info about a site)
 * append those properties into the array's object
 *
 * @param siteList
 * @param sitesObj
 * @return {array} site list - list of site configuration including id, alias, l10n, etc
 *
 * @example
 * const config = {
 *      defaultSite: 'site-1'
 *      sites: [
 *          id: 'site-1',
 *          alias: 'us'
 *      ]
 * }
 * const sitesObject = {
 *     site-1: {
 *         defaultLocale: 'en-US',
 *         defaultCurrency: 'US',
 *         supportedLocales: [
 *             {
 *                 id: 'en-US',
 *                 preferredCurrency: 'USD'
 *             }
 *         ],
 *         anotherProps: 'value-1'
 *     }
 * }
 *
 * mapSiteObjectToList(config.sites, sitesObject)
 * return [
 *      {
 *          id: 'site-1',
 *          alias: 'us',
 *          anotherProps: 'value-1'
 *          defaultLocale: 'en-US',
 *          defaultCurrency: 'US',
 *          supportedLocales: [
 *            {
 *               id: 'en-US',
 *               preferredCurrency: 'USD'
 *            }
 *          ]
 *      }
 * ]
 */
export const mapSiteObjectToList = (siteList, sitesObj) => {
    // if the siteList is a string, it is interpreted as a site id
    if (typeof siteList === 'string') {
        const id = siteList
        const site = sitesObj[id]

        return {
            id,
            ...site
        }
    }
    return siteList.map((site) => {
        const siteObj = sitesObj[site.id]
        return {
            ...site,
            ...siteObj
        }
    })
}

export const extractL10nFromSite = (site) => {
    const {supportedCurrencies, defaultCurrency, defaultLocale, supportedLocales} = site
    return {
        supportedCurrencies,
        defaultCurrency,
        defaultLocale,
        supportedLocales
    }
}
