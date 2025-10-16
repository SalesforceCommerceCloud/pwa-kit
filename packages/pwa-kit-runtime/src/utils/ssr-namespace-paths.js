/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getConfig} from './ssr-config'
import logger from './logger-instance'

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
 * Returns an empty string if the base path is not set or is '/'.
 */
export const getEnvBasePath = () => {
    const config = getConfig()
    let basePath = config?.envBasePath || ''

    if (typeof basePath !== 'string') {
        logger.warn('Invalid envBasePath configuration. No base path is applied.', {
            namespace: 'ssr-namespace-paths.getEnvBasePath'
        })
        return ''
    }

    // Normalize the base path
    basePath = basePath
        .trim()
        .replace(/^\/?/, '/') // Ensure leading slash
        .replace(/\/+/g, '/') // Normalize multiple slashes
        .replace(/\/$/, '') // Remove trailing slash

    // Return empty string for root path or empty result
    if (basePath === '/' || !basePath) {
        return ''
    }

    // only allow simple, safe characters
    // eslint-disable-next-line no-useless-escape
    if (!/^\/[a-zA-Z0-9\-_\/]*$/.test(basePath)) {
        logger.warn(
            'Invalid envBasePath configuration. Only letters, numbers, hyphens, underscores, and slashes allowed. No base path is applied.',
            {
                namespace: 'ssr-namespace-paths.getEnvBasePath'
            }
        )
        return ''
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
