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
import {matchPath} from 'react-router-dom'

/**
 * Checks if a URL path matches a route inside an array of routes.
 * @param path URL pathname
 * @param routes array of react-router route objects
 * @returns {{route, match}} route object matching the URL pathname, match boolean
 */
export const matchRoute = (path, routes) => {
    let match
    let route

    routes.some((_route) => {
        const _match = matchPath(path, _route)
        if (_match) {
            match = _match
            route = _route
        }
        return !!match
    })

    return {route, match}
}

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

/**
 * Returns the configuration object previous set.
 *
 * @returns {object} - the configuration object.
 */
/* istanbul ignore next */
export const getConfig = () => {
    if (!_config) {
        throw new Error('Ensure that you have set the configuration before getting it.')
    }

    return _config
}

/**
 * Set the configuration object. This is done when the express
 * application is created on the server, and when the react app
 * is started on the client.
 *
 * @param {object} config
 */
export const setConfig = (config) => {
    _config = config
}
