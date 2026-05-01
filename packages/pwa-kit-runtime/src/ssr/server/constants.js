/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export const APPLICATION_OCTET_STREAM = 'application/octet-stream'
export const BUILD = 'build'
export const STATIC_ASSETS = 'static_assets'

/**  * @deprecated Use ssr-namespace-paths proxyBasePath instead  */
export const PROXY_PATH_PREFIX = '/mobify/proxy'

// All these values MUST be lower case
export const CONTENT_TYPE = 'content-type'
export const CONTENT_ENCODING = 'content-encoding'
export const X_ORIGINAL_CONTENT_TYPE = 'x-original-content-type'
export const X_MOBIFY_QUERYSTRING = 'x-mobify-querystring'
export const X_MOBIFY_FROM_CACHE = 'x-mobify-from-cache'
export const X_ENCODED_HEADERS = 'x-encoded-headers'
export const SET_COOKIE = 'set-cookie'
export const CACHE_CONTROL = 'cache-control'
export const NO_CACHE = 'max-age=0, nocache, nostore, must-revalidate'
export const CONTENT_SECURITY_POLICY = 'content-security-policy'
export const STRICT_TRANSPORT_SECURITY = 'strict-transport-security'

/**  * @deprecated Use ssr-namespace-paths.slasPrivateProxyPath instead  */
export const SLAS_CUSTOM_PROXY_PATH = '/mobify/slas/private'

// Default regex patterns for SLAS token endpoints, used for setting httpOnly session cookies
// Users can override these in their project's ssr.js options.
export const SLAS_TOKEN_RESPONSE_ENDPOINTS = /\/oauth2\/(token|passwordless\/token)$/

// Default regex pattern for the SLAS logout endpoint, used when httpOnly session cookies are enabled
// to inject Bearer token and refresh token from HttpOnly cookies.
// Users can override this in their project's ssr.js options.
export const SLAS_LOGOUT_ENDPOINT = /\/oauth2\/logout/

// Custom headers used by the proxy layer for HttpOnly session cookie support.
// These are internal to our proxy and stripped before forwarding to SLAS/SCAPI.
export const DWSID_COOKIE_NAME = 'dwsid'
export const X_SITE_ID = 'x-site-id'
export const X_GRANT_TYPE = 'x-grant-type'
