/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/**
 * @module progressive-web-sdk/ssr/universal/utils
 */
import {proxyConfigs} from '../../utils/ssr-shared'

const onClient = typeof window !== 'undefined'

/**
 * Get the URL that should be used to load an asset from the bundle.
 *
 * @param {string} path - relative path from the build directory to the asset
 * @function
 * @returns {string}
 */
export const getAssetUrl = (path) => {
    /* istanbul ignore next */
    return onClient
        ? `${window.Progressive.buildOrigin}${path}`
        : `/mobify/bundle/${process.env.BUNDLE_ID || 'development'}/${path}`
}

/**
 * @typedef {Object} ProxyConfig
 * @property {String} protocol - http or https
 * @property {String} host - the hostname
 * @property {String} path - the path element that follows "mobify/proxy"
 */

/**
 * Return the set of proxies configured for the app.
 *
 * The result is an array of objects, each of which has 'protocol'
 * (either 'http' or 'https'), 'host' (the hostname) and 'path' (the
 * path element that follows "/mobify/proxy/", defaulting to 'base' for
 * the first proxy, and 'base2' for the next).
 *
 * @function
 * @returns {Array<ProxyConfig>}
 */
export const getProxyConfigs = () => {
    const configs = onClient
        ? (window.Progressive.ssrOptions || {}).proxyConfigs || []
        : proxyConfigs

    // Clone to avoid accidental mutation of important configuration variables.
    return configs.map((config) => ({...config}))
}

export const DEFAULT_CONFIG_MODULE_NAME = 'DEFAULT'

// TODO: Might have to split this universal function into client/server utils since
// its kind of hard to explain with all the conditions.
/**
 *
 * @param {*} param0
 * @returns
 */
export const getConfig = (moduleName = DEFAULT_CONFIG_MODULE_NAME) => {
    if (typeof window !== 'undefined') {
        return (
            window.__APPCONFIG__ ||
            JSON.parse(document.getElementById('mobify-data').innerHTML).__APPCONFIG__
        )
    }

    // Synchronously load the `cosmiconfig` so we don't get errors from webpack in the
    // browser bundle.
    const _require = eval('require')
    const {cosmiconfigSync} = _require('cosmiconfig')

    // Mack config files based on the matching below from most specific to most general.
    const explorerSync = cosmiconfigSync(moduleName, {
        packageProp: 'mobify',
        searchPlaces: [
            `config/${moduleName}.yml`,
            `config/${moduleName}.yaml`,
            `config/${moduleName}.json`,
            `config/local.yml`,
            `config/local.yaml`,
            `config/local.json`,
            `config/default.yml`,
            `config/default.yaml`,
            `config/default.json`,
            'package.json'
        ]
    })

    // Load the config synchronously using a custom "searchPlaces".
    const {config} = explorerSync.search()

    return config
}
