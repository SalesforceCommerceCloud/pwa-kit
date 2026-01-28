/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/**
 * @module progressive-web-sdk/ssr/universal/utils
 */
import {proxyConfigs} from '@salesforce/pwa-kit-runtime/utils/ssr-shared'
import {getEnvBasePath, bundleBasePath} from '@salesforce/pwa-kit-runtime/utils/ssr-namespace-paths'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

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
    const publicPath = onClient
        ? `${window.Progressive.buildOrigin}`
        : `${getEnvBasePath()}${bundleBasePath}/${process.env.BUNDLE_ID || 'development'}/`
    return path ? `${publicPath}${path}` : publicPath
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
 * Returns the basename (envBasePath) if showBasename is enabled in the app config.
 * This is used for URLs that bypass React Router (e.g., window.location, href attributes).
 * React Router handles basename via its basename prop when showBasename is enabled.
 *
 * @returns {string} - The basename if showBasename is true, otherwise an empty string
 */
export const getBasename = () => {
    const config = getConfig()
    const showBasename = config?.app?.url?.showBasename !== false
    return showBasename ? getEnvBasePath() : ''
}
