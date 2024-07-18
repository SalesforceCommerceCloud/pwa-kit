/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { getConfig } from './ssr-config'

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


export const getNamespace = () => {
    // TODO - namespaces for /mobify path will be implemented at a later date.
    // Returns an empty string for now.
    // Below is an example of what this implementation might look like.

    // Problem:
    // getConfig is undefined client side when we call it in public-path.js and ssr-shared.js
    // because they execute before we call main.js start() in webpack config
    const config = getConfig()

    // Possible solution: what if instead of config, we use an env var?
    // I don't think this will work client side?

    // const config = {
    //     ssrNamespace: '/local'
    // }

    let ssrNamespace = config?.ssrNamespace ? config.ssrNamespace : ''
    ssrNamespace = typeof ssrNamespace === 'function' ? namespace() : ssrNamespace
    return ssrNamespace

    // return '/local'
    // return ''
}

// TODO: something is breaking when namespace is applied to proxy - it causes the app to freeze
// Solved: the break is because the AppConfig proxy in default.js was not namespaced
export const proxyBasePath = () => `${getNamespace()}${PROXY_PATH_BASE}`

// this needs to be a function. if it is a value, this value gets resolved
// before the config is hydrated so namespace becomes undefined and assets don't load
export const bundleBasePath = () => `${getNamespace()}${BUNDLE_PATH_BASE}`

// these 3 just work as is - they are all server side paths
export const cachingBasePath = `${getNamespace()}${CACHING_PATH_BASE}`
export const healthCheckPath = `${getNamespace()}${HEALTHCHECK_PATH}`
export const slasPrivateProxyPath = `${getNamespace()}${SLAS_PRIVATE_CLIENT_PROXY_PATH}`
