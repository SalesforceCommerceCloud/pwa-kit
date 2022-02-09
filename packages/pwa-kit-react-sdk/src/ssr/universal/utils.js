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

let _config

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

/**
 *
 * @param {*} param0
 * @returns
 */
export const getConfig = (opts = {}) => {
    const {fileNameResolver} = opts
    if (_config) {
        return _config
    }

    if (typeof window !== 'undefined') {
        // NOTE: At this point in time the serialized data has not been assigned to the global,
        // so we have to get it directly from the markup. :(
        _config = JSON.parse(document.getElementById('mobify-data').innerHTML).__APPCONFIG__

        return _config
    }

    const _require = eval('require')
    const {cosmiconfigSync} = _require('cosmiconfig')

    // Load the config synchronously using a custom "searchPlaces".

    // By default use the deplayment target as the {moduleName} for your
    // configuration file. This means that on a "Production" names target, you'll load
    // your `config/production.json` file. You can customize how you determine your
    // {moduleName}.
    let moduleName = fileNameResolver && fileNameResolver()
    moduleName = process?.env?.DEPLOY_TARGET || DEFAULT_CONFIG_MODULE_NAME

    // TODO: Move `searchPlaces` out of this function. Don't forget to fix the other
    // unknown place right now where we look for proxy information.
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

    const {config} = explorerSync.search()

    return config
}
