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
 * Because MRT does not support base paths, there are a few checks we need to do to determine if we should return a base path.
 *
 * 1. All outbound requests to /mobify, whether from the client or server, should be prepended with the base path
 * 2. On local development servers, express endpoints with /mobify are prepended with the base path.
 * 3. On remote servers, express endpoints with /mobify are not prepended with the base path.
 *
 * On remote servers, it is expected that a CDN removes the base path from an incoming request before it reaches the server.
 * The following example illustrates this:
 *
 * Suppose we have a domain of https://www.example.com/ and a base path of /shop
 * A request to the mobify proxy might look like this: https://www.example.com/shop/mobify/proxy/...
 *
 * Also suppose we have an MRT environment deployed to https://example1.mobify-storefront.com
 * The mobify proxy is accessed at https://example1.mobify-storefront.com/mobify/proxy/...
 *
 * When our request from the client reaches a CDN in front of the MRT server, the CDN will remove the /shop from url as part of the request routing.
 * In other words, https://www.example.com/shop/mobify/proxy/... routes to https://example1.mobify-storefront.com/mobify/proxy/...
 *
 */
export const getEnvBasePath = () => {
    const config = getConfig()
    let basePath = config?.envBasePath || ''

    if (typeof basePath !== 'string') {
        logger.warn('Invalid envBasePath configuration. No base path is applied.')
        return ''
    }

    return basePath.replace(/\/$/, '')
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
