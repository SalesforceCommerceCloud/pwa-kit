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

// TODO - Allow projects to define this function?
export const getEnvBasePath = () => {
    const config = getConfig()
    return config?.envBasePath ? config.envBasePath : ''
}

export const getProxyPath = () => `${getEnvBasePath()}${PROXY_PATH_BASE}`
export const getBundlePath = () => `${getEnvBasePath()}${BUNDLE_PATH_BASE}`
export const getCachingPath = () => `${getEnvBasePath()}${CACHING_PATH_BASE}`
export const getHealthCheckPath = () => `${getEnvBasePath()}${HEALTHCHECK_PATH}`
export const getSlasPrivateProxyPath = () => `${getEnvBasePath()}${SLAS_PRIVATE_CLIENT_PROXY_PATH}`

// Keeping these around as their removal might be a breaking change?
/**  * @deprecated   */
export const proxyBasePath = `${getEnvBasePath()}${PROXY_PATH_BASE}`
export const bundleBasePath = `${getEnvBasePath()}${BUNDLE_PATH_BASE}`
export const cachingBasePath = `${getEnvBasePath()}${CACHING_PATH_BASE}`
export const healthCheckPath = `${getEnvBasePath()}${HEALTHCHECK_PATH}`
export const slasPrivateProxyPath = `${getEnvBasePath()}${SLAS_PRIVATE_CLIENT_PROXY_PATH}`


