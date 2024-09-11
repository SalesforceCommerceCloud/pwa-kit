/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * This file defines the /mobify paths used to set up our Express endpoints.
 *
 * If a namespace for the /mobify paths is defined, the methods in here will return the
 * namespaced path. ie. /namespace/mobify/...
 */

const MOBIFY_PATH = '/mobify'
const PROXY_PATH_BASE = `${MOBIFY_PATH}/proxy`
const BUNDLE_PATH_BASE = `${MOBIFY_PATH}/bundle`
const CACHING_PATH_BASE = `${MOBIFY_PATH}/caching`
const HEALTHCHECK_PATH = `${MOBIFY_PATH}/ping`
const SLAS_PRIVATE_CLIENT_PROXY_PATH = `${MOBIFY_PATH}/slas/private`

/**
 * @private
 */
const _getNamespace = () => {
    // TODO - namespaces for /mobify path will be implemented at a later date.
    // Returns an empty string for now.
    // Below is an example of what this implementation might look like.
    /*
        let {namespace = ""} = getConfig()
        namespace = typeof namespace === 'function' ? namespace() : namespace
        return namespace
    */
    return ''
}

export const ssrNamespace = _getNamespace()

export const proxyBasePath = `${ssrNamespace}${PROXY_PATH_BASE}`
export const bundleBasePath = `${ssrNamespace}${BUNDLE_PATH_BASE}`
export const cachingBasePath = `${ssrNamespace}${CACHING_PATH_BASE}`
export const healthCheckPath = `${ssrNamespace}${HEALTHCHECK_PATH}`
export const slasPrivateProxyPath = `${ssrNamespace}${SLAS_PRIVATE_CLIENT_PROXY_PATH}`
