/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * This file defines the /mobify paths used to set up our Express endpoints.
 *
 * If a base path for the /mobify paths is defined, the methods in here will return the
 * basepath. ie. /basepath/mobify/...
 */

// The MOBIFY_PATH is defined separately in preparation for the future eventual removal or
// replacement of the 'mobify' part of these paths
const MOBIFY_PATH = '/mobify'
const PROXY_PATH_BASE = `${MOBIFY_PATH}/proxy`
const BUNDLE_PATH_BASE = `${MOBIFY_PATH}/bundle`
const CACHING_PATH_BASE = `${MOBIFY_PATH}/caching`
const HEALTHCHECK_PATH = `${MOBIFY_PATH}/ping`
const SLAS_PRIVATE_CLIENT_PROXY_PATH = `${MOBIFY_PATH}/slas/private`

/*
 * Returns the base path. This is prepended to a /mobify path.
 * Returns an empty string if the base path is not set.
 * Throws an error if the base path is not valid.
 *
 * Use this function if you are working with an express route
 * (ie. The route is defined in ssr.js).
 *
 * Use getRouterBasePath (pwa-kit-react-sdk) if you are working
 * with a React Router route
 * (ie. The route is defined in routes.jsx).
 */
export const getEnvBasePath = () => {
    let basePath = ''

    if (typeof window !== 'undefined') {
        basePath = window.__MRT_ENV_BASE_PATH__ || ''
    } else {
        basePath = process.env.MRT_ENV_BASE_PATH || ''
    }

    // Return empty string if no base path is set
    if (!basePath) {
        return ''
    }

    // MRT will throw an error on bundle upload if the base path does not match
    // the following regex: /^\/[a-zA-Z0-9_.+$~"'@:-]{1,63}$/
    // This validates:
    // - Starts with /
    // - Followed by 1-63 characters (letters, numbers, and special chars: - _ . + $ ~ " ' @ :)
    // - No additional slashes (multi-part paths not allowed, no trailing slashes)
    // - No spaces
    // - Total max length of 64 characters (1 slash + 63 chars)
    if (!/^\/[a-zA-Z0-9_.+$~"'@:-]{1,63}$/.test(basePath)) {
        throw new Error(
            "Invalid envBasePath configuration. Base path must start with '/' followed by 1-63 characters. Only letters, numbers, and the following special characters are allowed: - _ . + $ ~ \" ' @ :"
        )
    }

    return basePath
}

export const proxyBasePath = PROXY_PATH_BASE
export const bundleBasePath = BUNDLE_PATH_BASE
export const cachingBasePath = CACHING_PATH_BASE
export const healthCheckPath = HEALTHCHECK_PATH
export const slasPrivateProxyPath = SLAS_PRIVATE_CLIENT_PROXY_PATH

/**
 * @deprecated This variable is no longer used. This variable has always been an empty string.
 * Use getEnvBasePath() instead. Import from @salesforce/pwa-kit-runtime/utils/ssr-namespace-paths
 */
export const ssrNamespace = ''
