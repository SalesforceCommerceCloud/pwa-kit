/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * DO NOT ADD NEW CONTENT TO THIS FILE! THIS FILE IS DEPRECATED!
 * For all paths related code, use the ssr-path.js file
 */
const MOBIFY_PATH = '/mobify'
const PROXY_PATH_BASE = `${MOBIFY_PATH}/proxy`
const BUNDLE_PATH_BASE = `${MOBIFY_PATH}/bundle`
const CACHING_PATH_BASE = `${MOBIFY_PATH}/caching`
const HEALTHCHECK_PATH = `${MOBIFY_PATH}/ping`
const SLAS_PRIVATE_CLIENT_PROXY_PATH = `${MOBIFY_PATH}/slas/private`

// The following variables were introduced in v3.7,
// before the env base path feature was fully implemented.
// In v3.8, we added the env base path support and the implementation has
// changed from using static variables to functions.
// Thus, we deprecate the following variables to avoid breaking change.
// We will remove the deprecation in future major releases.
/**
 * @deprecated Use getProxyPath() instead. Import from @salesforce/pwa-kit-runtime/utils/ssr-paths
 */
export const proxyBasePath = PROXY_PATH_BASE

/**
 * @deprecated Use getBundlePath() instead. Import from @salesforce/pwa-kit-runtime/utils/ssr-paths
 */
export const bundleBasePath = BUNDLE_PATH_BASE

/**
 * @deprecated Use getCachingPath() instead. Import from @salesforce/pwa-kit-runtime/utils/ssr-paths
 */
export const cachingBasePath = CACHING_PATH_BASE

/**
 * @deprecated Use getHealthCheckPath() instead. Import from @salesforce/pwa-kit-runtime/utils/ssr-paths
 */
export const healthCheckPath = HEALTHCHECK_PATH

/**
 * @deprecated Use getSlasPrivateProxyPath() instead. Import from @salesforce/pwa-kit-runtime/utils/ssr-paths
 */
export const slasPrivateProxyPath = SLAS_PRIVATE_CLIENT_PROXY_PATH

/**
 * @deprecated This variable is no longer used. This variable has always been an empty string.
 * Use getEnvBasePath() instead. Import from @salesforce/pwa-kit-runtime/utils/ssr-paths
 */
export const ssrNamespace = ''
