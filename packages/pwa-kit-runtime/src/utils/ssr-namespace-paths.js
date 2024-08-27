/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getConfig} from './ssr-config'

/**
 * This file defines the /mobify paths used to set up our Express endpoints.
 *
 * If a namespace for the /mobify paths is defined, the methods in here will return the
 * namespaced path. ie. /namespace/mobify/...
 */

// The MOBIFY_PATH is defined separately in preparation for the future eventual removal or
// replacement of the 'mobify' part of these paths
const MOBIFY_PATH = '/mobify'
const PROXY_PATH_BASE = `${MOBIFY_PATH}/proxy`
const BUNDLE_PATH_BASE = `${MOBIFY_PATH}/bundle`
const CACHING_PATH_BASE = `${MOBIFY_PATH}/caching`
const HEALTHCHECK_PATH = `${MOBIFY_PATH}/ping`
const SLAS_PRIVATE_CLIENT_PROXY_PATH = `${MOBIFY_PATH}/slas/private`

export const getEnvBasePath = () => {
    // getConfig is memoized on the server so we are not needing to make
    // multiple reads of the config file
    // on the client, this will initially not return anything as
    // window.__config__ first needs to be hydrated
    // we cannot memoize getEnvBasePath as it's value may change once
    // window.__config__ is hydrated
    const config = getConfig()
    let basePath = config?.envBasePath || ''

    if (typeof basePath !== 'string') {
        console.log('Invalid environment base path configuration. Using default base path.')
        basePath = ''
    }

    return basePath
}

export const getProxyPath = () => `${getEnvBasePath()}${PROXY_PATH_BASE}`
export const getBundlePath = () => `${getEnvBasePath()}${BUNDLE_PATH_BASE}`
export const getCachingPath = () => `${getEnvBasePath()}${CACHING_PATH_BASE}`
export const getHealthCheckPath = () => `${getEnvBasePath()}${HEALTHCHECK_PATH}`
export const getSlasPrivateProxyPath = () => `${getEnvBasePath()}${SLAS_PRIVATE_CLIENT_PROXY_PATH}`

// The following variables were introduced in v3.6,
// before the env base path feature was fully implemented.
// In v3.7, we added the env base path support and the implementation has
// changed from using static variables to functions.
// Thus, we deprecate the following variables to avoid breaking change.
// We will remove the deprecation in future major releases.
/**
 * @deprecated Use getProxyPath() instead.
 */
export const proxyBasePath = PROXY_PATH_BASE

/**
 * @deprecated Use getBundlePath() instead.
 */
export const bundleBasePath = BUNDLE_PATH_BASE

/**
 * @deprecated Use getCachingPath() instead.
 */
export const cachingBasePath = CACHING_PATH_BASE

/**
 * @deprecated Use getHealthCheckPath() instead.
 */
export const healthCheckPath = HEALTHCHECK_PATH

/**
 * @deprecated Use getSlasPrivateProxyPath() instead.
 */
export const slasPrivateProxyPath = SLAS_PRIVATE_CLIENT_PROXY_PATH

/**
 * @deprecated This variable is no longer used. This variable has always been an empty string.
 * Use getEnvBasePath() instead.
 */
export const ssrNamespace = ''
