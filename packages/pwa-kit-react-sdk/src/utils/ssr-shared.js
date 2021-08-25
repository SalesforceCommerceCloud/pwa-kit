/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/**
 * @module pwa-kit-react-sdk/utils/ssr-shared
 * @private
 */
/*
 The ssr-shared-utils module is used in the PWA and in the Express app. It
 should contain ONLY the code that is required in both, to avoid adding
 to the size of vendor.js
 */

const onClient = typeof window !== 'undefined'

/**
 * Set of valid HTTP protocols for proxying
 * @private
 * @type {string[]}
 */
export const validProxyProtocols = ['http', 'https']

// This value is the 'mobify' object from package.json. It should be accessed
// via getPackageMobify() so that test code can update the value to test
// specific functions.
let _packageMobify
export const getPackageMobify = () => _packageMobify || {}
export const getSSRParameters = () => (_packageMobify && _packageMobify.ssrParameters) || {}

/**
 * Maximum number of proxy configs
 * @private
 * @type {number}
 */
export const MAX_PROXY_CONFIGS = 8

/**
 * An Array of objects with protocol, host, path for each configured proxy.
 * This is *only* usable server-side, where it's set when the SSRServer
 * calls updatePackageMobify.
 *
 * The objects in this array also have the following additional properties,
 * added by configureProxyConfigs in utils/ssr-server:
 * proxyPath is the full /mobify/proxy... path
 * proxy is an http-proxy-middleware function that can be used to proxy a
 * request to a target (it's an ExpressJS function taking req, res and next)
 *
 * @private
 * @type {Array}
 */
export let proxyConfigs = []

/**
 * An Array with all the glob patterns from ssrOnly and ssrShared.
 * The names are relative to the 'build' directory.
 * @private
 */
export let ssrFiles = []

/**
 * RegExp that matches a proxy override string
 * match[1] is the protocol
 * match[3] is the host
 * match[5] (optional) is the path
 * match[6] (optional) is '/caching' for a caching proxy, undefined for a standard proxy
 * @private
 * @type {RegExp}
 */
const proxyOverrideRE = /^(http(s)?):\/\/([^/]+)(\/)?([^/]+)?(\/caching)?/

/**
 * Updates the value of _packageMobify and dependent values.
 *
 * @private
 * @param newValue {Object} the new value of the Mobify object
 */
export const updatePackageMobify = (newValue) => {
    _packageMobify = newValue || _packageMobify || {}

    // Clear and update the proxyConfigs array
    proxyConfigs = []
    const ssrParameters = getSSRParameters()
    const newFormatConfigs = ssrParameters.proxyConfigs || []

    if (newFormatConfigs.length && (ssrParameters.proxyHost1 || ssrParameters.proxyHost2)) {
        throw new Error('Cannot use both proxyConfigs and old proxy declarations in ssrParameters')
    }

    if (newFormatConfigs.length > MAX_PROXY_CONFIGS) {
        throw new Error(`Cannot define more than ${MAX_PROXY_CONFIGS} proxy configurations`)
    }

    // Make proxyConfigs an Array containing all the valid proxy configs
    for (let index0 = 0; index0 < MAX_PROXY_CONFIGS; index0++) {
        const index1 = index0 + 1

        let config

        const defaultPath = index0 ? `base${index1}` : 'base'

        // Support the OLD format of proxy configs.
        const oldHost = ssrParameters[`proxyHost${index1}`]
        if (oldHost) {
            config = {
                /* istanbul ignore else */
                protocol: ssrParameters[`proxyProtocol${index1}`],
                host: oldHost,
                /* istanbul ignore else */
                path: ssrParameters[`proxyPath${index1}`]
            }
        } else {
            // New format of proxy configs
            config = newFormatConfigs[index0] // may be undefined
        }

        // Allow override via environment variable
        const overrideKey = `SSR_PROXY${index1}`
        const override = process.env[overrideKey]
        let overridden = ''
        if (override) {
            const match = proxyOverrideRE.exec(override)
            /* istanbul ignore else */
            if (match) {
                config = {
                    protocol: match[1],
                    host: match[3],
                    path: match[5] || (config && config.path)
                }

                overridden = ` (overridden by ${overrideKey}="${override}")`
            }
        }

        // If there's no config for this index, try the next one.
        if (!config) {
            continue
        }

        // Apply defaults
        if (!config.protocol) {
            config.protocol = 'https'
        }
        if (!config.path) {
            config.path = defaultPath
        }

        // Validate
        const msg = `Proxy config ${index1}${overridden}`

        if (!config.host) {
            throw new Error(`${msg} has missing 'host' property`)
        }

        if (validProxyProtocols.indexOf(config.protocol) < 0) {
            throw new Error(`${msg} has invalid protocol '${config.protocol}'`)
        }

        const existing = proxyConfigs.findIndex((conf) => conf.path === config.path)
        if (existing >= 0) {
            throw new Error(
                `${msg} ` +
                    `has path "${config.path}" ` +
                    `but that has already been used in config ${existing}`
            )
        }

        // Generate paths
        config.proxyPath = `/mobify/proxy/${config.path}`
        config.cachingPath = `/mobify/caching/${config.path}`

        proxyConfigs.push(config)
    }

    // Clear and reset the ssrFiles array
    ssrFiles = (_packageMobify.ssrOnly || []).concat(_packageMobify.ssrShared || [])
}

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

// For testing
export const reset = () => {
    _packageMobify = undefined
    proxyConfigs = []
    ssrFiles = []
}
