/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {createProxyMiddleware} from 'http-proxy-middleware'
import {rewriteProxyRequestHeaders, rewriteProxyResponseHeaders} from '../ssr-proxying'
import {proxyConfigs} from '../ssr-shared'
import {processExpressResponse} from './process-express-response'
import {isRemote, localDevLog, verboseProxyLogging} from './utils'
import logger from '../logger-instance'
import {getEnvBasePath} from '../ssr-namespace-paths'
import zlib from 'zlib'
import https from 'https'
import http from 'http'

export const ALLOWED_CACHING_PROXY_REQUEST_METHODS = ['HEAD', 'GET', 'OPTIONS']

/**
 * This path matching RE matches on /mobify/proxy and then skips one path
 * element. For example, /mobify/proxy/heffalump/woozle would be converted to
 * /woozle on whatever host /mobify/proxy/heffalump maps to.
 * Group 2 is the full path on the proxied host.
 * @private
 * @type {RegExp}
 */
const generalProxyPathRE = /^\/mobify\/proxy\/([^/]+)(\/.*)$/

/**
 * Apply proxy headers to a request that is being proxied.
 *
 * This function is intended to be called from within a proxy's
 * onProxyReq method.
 *
 * For more details on the headers being applied,
 * see ssr-proxying.js rewriteProxyRequestHeaders method
 * @private
 * @function
 * @param proxyRequest {http.ClientRequest} the request that will be
 * sent to the target host
 * @param incomingRequest {http.IncomingMessage} the request made to
 * this Express app that prompted the proxying
 * @param caching {Boolean} true for a caching proxy, false for a standard proxy
 * @param logging {Boolean} true to log operations
 * @param proxyPath {String} the path being proxied (e.g. /mobify/proxy/base/
 * or /mobify/caching/base/)
 * @param targetHost {String} the target hostname (host+port)
 * @param targetProtocol {String} the protocol to use to make requests to
 * the target ('http' or 'https')
 */
export const applyProxyRequestHeaders = ({
    proxyRequest,
    incomingRequest,
    caching = false,
    logging = !isRemote() && verboseProxyLogging,
    proxyPath,
    targetHost,
    targetProtocol
}) => {
    const url = incomingRequest.url
    const headers = incomingRequest.headers
    /* istanbul ignore next */
    if (logging) {
        logger.info(
            `Proxy: request for ${proxyPath}${url} => ${targetProtocol}://${targetHost}/${url}`,
            {
                namespace: 'configureProxy.applyProxyRequestHeaders',
                additionalProperties: {
                    proxyPath,
                    targetProtocol,
                    targetHost,
                    url
                }
            }
        )
    }

    const newHeaders = rewriteProxyRequestHeaders({
        caching,
        headers,
        headerFormat: 'http',
        logging,
        proxyPath,
        targetHost,
        targetProtocol
    })

    // Copy any new and updated headers to the proxyRequest
    // using setHeader.
    Object.entries(newHeaders).forEach(
        // setHeader always replaces any current value.
        ([key, value]) => proxyRequest.setHeader(key, value)
    )

    // Handle deletion of headers.
    // Iterate over the keys of incomingRequest.headers - for every
    // key, if the value is not present in newHeaders, we remove
    // that value from proxyRequest's headers.
    Object.keys(headers).forEach((key) => {
        // We delete the header on any falsy value, since
        // there's no use case where we supply an empty header
        // value.
        if (!newHeaders[key]) {
            proxyRequest.removeHeader(key)
        }
    })
}

/**
 * Handle refresh token request directly (CDN simulator mode).
 * This function makes the SLAS call with the refresh_token from HttpOnly cookie
 * and returns the transformed response.
 * @private
 */
const handleRefreshTokenRequest = async ({
    req,
    res,
    targetProtocol,
    targetHost,
    appProtocol
    // appHostname - not needed for refresh token handling
}) => {
    // Parse cookies to get refresh_token
    const cookieHeader = req.headers.cookie || ''
    console.log(
        `[CDN Sim] 🔄 Refresh request - cookie header: ${cookieHeader.substring(0, 200)}...`
    )

    const cookies = {}
    cookieHeader.split(';').forEach((cookie) => {
        const [key, ...valueParts] = cookie.trim().split('=')
        if (key && valueParts.length > 0) {
            cookies[key] = decodeURIComponent(valueParts.join('='))
        }
    })

    console.log(
        `[CDN Sim] 🔄 Refresh request - parsed cookie keys: ${Object.keys(cookies).join(', ')}`
    )

    // Find refresh_token (with or without siteId suffix)
    let refreshToken = cookies.refresh_token
    if (!refreshToken) {
        const refreshTokenKey = Object.keys(cookies).find((key) => key.startsWith('refresh_token_'))
        if (refreshTokenKey) {
            refreshToken = cookies[refreshTokenKey]
            console.log(`[CDN Sim] 🔄 Found refresh_token from cookie: ${refreshTokenKey}`)
        }
    }

    if (!refreshToken) {
        console.log('[CDN Sim] ❌ No refresh_token cookie found for refresh request')
        console.log('[CDN Sim] ❌ Available cookies:', Object.keys(cookies))
        res.status(400).json({error: 'No refresh token available'})
        return
    }

    console.log(
        `[CDN Sim] 🔄 Handling refresh token request directly (token length: ${refreshToken.length})`
    )

    // Parse the original request body to get other parameters
    let bodyParams = {}
    if (req.body && typeof req.body === 'object') {
        bodyParams = req.body
    } else if (req.body && typeof req.body === 'string') {
        bodyParams = Object.fromEntries(new URLSearchParams(req.body))
    }

    // Build the request body with refresh_token injected
    const requestBody = new URLSearchParams({
        ...bodyParams,
        refresh_token: refreshToken
    }).toString()

    // Extract the path from the original URL (remove /mobify/proxy/api prefix)
    const targetPath = req.url.replace(/^\/mobify\/proxy\/[^/]+/, '')

    console.log(`[CDN Sim] 🔄 Making refresh request to ${targetHost}${targetPath}`)

    // Make the request to SLAS
    const httpModule = targetProtocol === 'https' ? https : http
    const options = {
        hostname: targetHost,
        port: targetProtocol === 'https' ? 443 : 80,
        path: targetPath,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(requestBody)
        }
    }

    const proxyReq = httpModule.request(options, async (proxyRes) => {
        let body = []
        proxyRes.on('data', (chunk) => body.push(chunk))
        proxyRes.on('end', async () => {
            try {
                let responseBody = Buffer.concat(body)

                // Decompress if needed
                const contentEncoding = proxyRes.headers['content-encoding']
                if (contentEncoding === 'gzip') {
                    responseBody = await new Promise((resolve, reject) => {
                        zlib.gunzip(responseBody, (err, decompressed) => {
                            if (err) reject(err)
                            else resolve(decompressed)
                        })
                    })
                }

                const data = JSON.parse(responseBody.toString('utf8'))
                console.log(
                    '[CDN Sim] 🔄 Refresh response received, has access_token:',
                    !!data.access_token
                )

                if (data.access_token) {
                    // Transform response - same logic as regular token endpoint
                    // Strip all token fields from response (they go in HttpOnly cookies)
                    const {
                        access_token,
                        refresh_token,
                        id_token: _id_token,
                        idp_access_token: _idp_access_token,
                        ...safeBody
                    } = data
                    // Suppress unused variable warnings (we extract to exclude from safeBody)
                    void _id_token
                    void _idp_access_token

                    // Extract siteId from JWT
                    let siteId = ''
                    try {
                        const [, payloadB64] = access_token.split('.')
                        if (payloadB64) {
                            const base64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/')
                            const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
                            const payloadStr = Buffer.from(padded, 'base64').toString('utf8')
                            const payload = JSON.parse(payloadStr)
                            if (payload?.isb) {
                                const chidMatch = payload.isb.match(/chid:([^:]+)/)
                                if (chidMatch) {
                                    siteId = chidMatch[1]
                                }
                            }
                        }
                    } catch (e) {
                        console.log('[CDN Sim] ⚠️ Failed to extract siteId from JWT:', e.message)
                    }

                    const cookieSuffix = siteId ? `_${siteId}` : ''
                    const expiresInSeconds = data.expires_in || 1800
                    const expiryTimestamp = Date.now() + expiresInSeconds * 1000
                    const useSecure = isRemote() || appProtocol === 'https'
                    const secureFlag = useSecure ? '; Secure' : ''

                    const setCookies = []

                    // Set HttpOnly cookies for tokens
                    setCookies.push(
                        [
                            `access_token${cookieSuffix}=${access_token}`,
                            'HttpOnly',
                            useSecure && 'Secure',
                            'SameSite=Lax',
                            'Path=/',
                            `Max-Age=${expiresInSeconds}`
                        ]
                            .filter(Boolean)
                            .join('; ')
                    )

                    setCookies.push(
                        [
                            `access_token_expiry${cookieSuffix}=${expiryTimestamp}`,
                            useSecure && 'Secure',
                            'SameSite=Lax',
                            'Path=/',
                            `Max-Age=${expiresInSeconds}`
                        ]
                            .filter(Boolean)
                            .join('; ')
                    )

                    if (refresh_token) {
                        setCookies.push(
                            [
                                `refresh_token${cookieSuffix}=${refresh_token}`,
                                'HttpOnly',
                                useSecure && 'Secure',
                                'SameSite=Lax',
                                'Path=/',
                                'Max-Age=7776000'
                            ]
                                .filter(Boolean)
                                .join('; ')
                        )
                    }

                    setCookies.push(
                        [
                            `cc_cdn_sim${cookieSuffix}=1`,
                            useSecure && 'Secure',
                            'SameSite=Lax',
                            'Path=/',
                            `Max-Age=${expiresInSeconds}`
                        ]
                            .filter(Boolean)
                            .join('; ')
                    )

                    console.log(
                        `[CDN Sim] 🔄 Refresh successful, set cookies (HttpOnly${secureFlag})`
                    )

                    const strippedResponse = JSON.stringify(safeBody)
                    res.writeHead(200, {
                        'Content-Type': 'application/json',
                        'Set-Cookie': setCookies,
                        'Content-Length': Buffer.byteLength(strippedResponse)
                    })
                    res.end(strippedResponse)
                } else {
                    // Pass through error response
                    console.log('[CDN Sim] 🔄 Refresh failed, passing through error')
                    res.writeHead(proxyRes.statusCode, {'Content-Type': 'application/json'})
                    res.end(responseBody)
                }
            } catch (e) {
                console.log('[CDN Sim] ❌ Error processing refresh response:', e.message)
                res.status(500).json({error: 'Failed to process refresh response'})
            }
        })
    })

    proxyReq.on('error', (e) => {
        console.log('[CDN Sim] ❌ Refresh request error:', e.message)
        res.status(500).json({error: 'Refresh request failed'})
    })

    proxyReq.write(requestBody)
    proxyReq.end()
}

/**
 * Handle direct token request (non-refresh) from browser in CDN simulator mode.
 * This passes the request body as-is to SLAS and transforms the response.
 * @private
 */
const handleDirectTokenRequest = async ({
    req,
    res,
    rawBody,
    targetProtocol,
    targetHost,
    appProtocol
}) => {
    console.log('[CDN Sim] 📤 Making direct token request to SLAS')

    // Extract the path from the original URL (remove /mobify/proxy/api prefix)
    const targetPath = req.url.replace(/^\/mobify\/proxy\/[^/]+/, '')

    console.log(`[CDN Sim] 📤 Direct token request to ${targetHost}${targetPath}`)

    // Make the request to SLAS
    const httpModule = targetProtocol === 'https' ? https : http
    const options = {
        hostname: targetHost,
        port: targetProtocol === 'https' ? 443 : 80,
        path: targetPath,
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(rawBody)
        }
    }

    const proxyReq = httpModule.request(options, async (proxyRes) => {
        let body = []
        proxyRes.on('data', (chunk) => body.push(chunk))
        proxyRes.on('end', async () => {
            try {
                let responseBody = Buffer.concat(body)

                // Decompress if needed
                const contentEncoding = proxyRes.headers['content-encoding']
                if (contentEncoding === 'gzip') {
                    responseBody = await new Promise((resolve, reject) => {
                        zlib.gunzip(responseBody, (err, decompressed) => {
                            if (err) reject(err)
                            else resolve(decompressed)
                        })
                    })
                }

                const data = JSON.parse(responseBody.toString('utf8'))
                console.log(
                    '[CDN Sim] 📤 Direct token response, has access_token:',
                    !!data.access_token
                )

                if (data.access_token) {
                    // Transform response - same logic as in onProxyRes
                    // Strip all token fields from response (they go in HttpOnly cookies)
                    const {
                        access_token,
                        refresh_token,
                        id_token: _id_token,
                        idp_access_token: _idp_access_token,
                        ...safeBody
                    } = data
                    // Suppress unused variable warnings (we extract to exclude from safeBody)
                    void _id_token
                    void _idp_access_token

                    // Extract siteId from JWT
                    let siteId = ''
                    try {
                        const [, payloadB64] = access_token.split('.')
                        if (payloadB64) {
                            const base64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/')
                            const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
                            const payloadStr = Buffer.from(padded, 'base64').toString('utf8')
                            const payload = JSON.parse(payloadStr)
                            if (payload?.isb) {
                                const chidMatch = payload.isb.match(/chid:([^:]+)/)
                                if (chidMatch) {
                                    siteId = chidMatch[1]
                                }
                            }
                        }
                    } catch (e) {
                        console.log('[CDN Sim] ⚠️ Failed to extract siteId from JWT:', e.message)
                    }

                    const cookieSuffix = siteId ? `_${siteId}` : ''
                    const expiresInSeconds = data.expires_in || 1800
                    const expiryTimestamp = Date.now() + expiresInSeconds * 1000
                    const useSecure = isRemote() || appProtocol === 'https'
                    const secureFlag = useSecure ? '; Secure' : ''

                    const setCookies = []

                    // Set HttpOnly cookies for tokens
                    setCookies.push(
                        [
                            `access_token${cookieSuffix}=${access_token}`,
                            'HttpOnly',
                            useSecure && 'Secure',
                            'SameSite=Lax',
                            'Path=/',
                            `Max-Age=${expiresInSeconds}`
                        ]
                            .filter(Boolean)
                            .join('; ')
                    )

                    setCookies.push(
                        [
                            `access_token_expiry${cookieSuffix}=${expiryTimestamp}`,
                            useSecure && 'Secure',
                            'SameSite=Lax',
                            'Path=/',
                            `Max-Age=${expiresInSeconds}`
                        ]
                            .filter(Boolean)
                            .join('; ')
                    )

                    if (refresh_token) {
                        setCookies.push(
                            [
                                `refresh_token${cookieSuffix}=${refresh_token}`,
                                'HttpOnly',
                                useSecure && 'Secure',
                                'SameSite=Lax',
                                'Path=/',
                                'Max-Age=7776000'
                            ]
                                .filter(Boolean)
                                .join('; ')
                        )
                    }

                    setCookies.push(
                        [
                            `cc_cdn_sim${cookieSuffix}=1`,
                            useSecure && 'Secure',
                            'SameSite=Lax',
                            'Path=/',
                            `Max-Age=${expiresInSeconds}`
                        ]
                            .filter(Boolean)
                            .join('; ')
                    )

                    console.log(
                        `[CDN Sim] 📤 Direct token successful, set cookies (HttpOnly${secureFlag})`
                    )

                    const strippedResponse = JSON.stringify(safeBody)
                    res.writeHead(200, {
                        'Content-Type': 'application/json',
                        'Set-Cookie': setCookies,
                        'Content-Length': Buffer.byteLength(strippedResponse)
                    })
                    res.end(strippedResponse)
                } else {
                    // Pass through error response
                    console.log('[CDN Sim] 📤 Direct token failed, passing through')
                    res.writeHead(proxyRes.statusCode, {'Content-Type': 'application/json'})
                    res.end(responseBody)
                }
            } catch (e) {
                console.log('[CDN Sim] ❌ Error processing direct token response:', e.message)
                res.status(500).json({error: 'Failed to process token response'})
            }
        })
    })

    proxyReq.on('error', (e) => {
        console.log('[CDN Sim] ❌ Direct token request error:', e.message)
        res.status(500).json({error: 'Token request failed'})
    })

    proxyReq.write(rawBody)
    proxyReq.end()
}

/**
 * Configure proxying for a path.
 * @private
 * @function
 * @param appHostname {String} the hostname (host+port) under which the
 * Express app is running (e.g. localhost:3443 for a local dev server)
 * @param proxyPath {String} the path being proxied (e.g. /mobify/proxy/base/
 * or /mobify/caching/base/)
 * @param targetProtocol {String} the protocol to use to make requests to
 * the target ('http' or 'https')
 * @param targetHost {String} the target hostname (host+port)
 * @param appProtocol {String} the protocol to use to make requests to
 * the origin ('http' or 'https', defaults to 'https')
 * @param caching {Boolean} true for a caching proxy, false for a
 * standard proxy.
 * @returns {middleware} function to pass to expressApp.use()
 */
export const configureProxy = ({
    appHostname,
    proxyPath,
    targetProtocol,
    targetHost,
    appProtocol = /* istanbul ignore next */ 'https',
    caching
}) => {
    // This configuration must match the behaviour of the proxying
    // in CloudFront.
    const targetOrigin = `${targetProtocol}://${targetHost}`
    const cdnSimulatorEnabled = process.env.ENABLE_CDN_SIMULATOR === 'true'

    const config = {
        // The name of the changeOrigin option is misleading - it configures
        // the proxying code in http-proxy to rewrite the Host header (not
        // any Origin header) of the outgoing request. The Host header is
        // also fixed up in rewriteProxyRequestHeaders, but that
        // doesn't work correctly with http-proxy, because the https
        // connection to the target is made *before* the request headers
        // are modified by the onProxyReq event handler. So we set this
        // flag true to get correct behaviour.
        changeOrigin: true,

        // Rewrite the domain in set-cookie headers in responses, if it
        // matches the targetHost.
        cookieDomainRewrite: {
            targetHost: appHostname
        },

        // We don't do cookie *path* rewriting - it's complex.
        cookiePathRewrite: false,

        // Neither CloudFront nor the local Express app will follow redirect
        // responses to proxy requests. The responses are returned to the
        // client.
        followRedirects: false,

        logLevel: 'warn',

        // When CDN simulator is enabled, we need to manually handle responses
        // to transform SLAS token responses
        selfHandleResponse: cdnSimulatorEnabled && !caching,

        onError: (err, req, res) => {
            /* istanbul ignore next */
            if (!isRemote() && verboseProxyLogging) {
                logger.error(`Proxy: error ${err} for request ${proxyPath}/${req.url}`, {
                    namespace: 'configureProxy.onError',
                    additionalProperties: {
                        proxyPath,
                        url: req.url,
                        error: err
                    }
                })
            }

            res.writeHead(500, {
                'Content-Type': 'text/plain'
            })
            res.end(`Error in proxy request to ${req.url}: ${err}`)
        },

        /**
         * Handler for all outgoing proxied requests. This is called
         * irrespective of the source of the request (i.e., it could
         * be from fetch, XmlHttpRequest or an external request to
         * a /mobify/proxy path).
         *
         * Note also that this is called *after* a request is intercepted
         * in outgoingRequestHook.
         *
         * @private
         * @param proxyRequest {http.ClientRequest} the request that will be
         * sent to the target host
         * @param incomingRequest {http.IncomingMessage} the request made to
         * this Express app that prompted the proxying
         */
        onProxyReq: (proxyRequest, incomingRequest) => {
            applyProxyRequestHeaders({
                proxyRequest,
                incomingRequest,
                caching,
                proxyPath,
                targetHost,
                targetProtocol
            })

            // CDN Simulator: Inject Authorization header from httpOnly cookie
            if (!caching && cdnSimulatorEnabled) {
                let accessToken = null
                let tokenSource = null

                // First, try to get access_token from cookies (browser requests)
                // Cookie names may have siteId suffix (e.g., access_token_RefArchGlobal)
                const cookieHeader = incomingRequest.headers.cookie

                // Debug: log all cookies received
                if (cookieHeader) {
                    console.log(
                        `[CDN Sim] 🍪 Cookies received: ${cookieHeader.substring(0, 200)}${
                            cookieHeader.length > 200 ? '...' : ''
                        }`
                    )
                } else {
                    console.log(`[CDN Sim] 🍪 No cookies in request for ${incomingRequest.url}`)
                }

                if (cookieHeader) {
                    // Parse cookies to find access_token or access_token_<siteId>
                    const cookies = {}
                    cookieHeader.split(';').forEach((cookie) => {
                        const [key, ...valueParts] = cookie.trim().split('=')
                        if (key && valueParts.length > 0) {
                            cookies[key] = decodeURIComponent(valueParts.join('='))
                        }
                    })

                    // Debug: log parsed cookie keys
                    console.log(
                        `[CDN Sim] 🍪 Parsed cookie keys: ${Object.keys(cookies).join(', ')}`
                    )

                    // Try exact match first, then look for access_token_* pattern
                    if (cookies.access_token) {
                        accessToken = cookies.access_token
                        tokenSource = 'cookie'
                    } else {
                        // Find cookie matching access_token_<siteId> pattern
                        const accessTokenKey = Object.keys(cookies).find((key) =>
                            key.startsWith('access_token_')
                        )
                        if (accessTokenKey) {
                            accessToken = cookies[accessTokenKey]
                            tokenSource = `cookie (${accessTokenKey})`
                        }
                    }
                }

                // Inject Authorization header if access_token found in cookies
                if (accessToken) {
                    proxyRequest.setHeader('Authorization', `Bearer ${accessToken}`)
                    console.log(
                        `[CDN Sim] 🔑 Injected Authorization header from ${tokenSource} for ${incomingRequest.url}`
                    )
                } else {
                    console.log(`[CDN Sim] ⚠️ No access_token found for ${incomingRequest.url}`)
                }

                // Note: Refresh token requests are handled in the middleware wrapper
                // (before reaching this proxy) via handleRefreshTokenRequest()
            }
        },

        onProxyRes: (proxyResponse, req, res) => {
            /* istanbul ignore next */
            if (!isRemote() && verboseProxyLogging) {
                logger.info(
                    `Proxy: ${proxyResponse.statusCode} response from ${proxyPath}${req.url}`,
                    {
                        namespace: 'configureProxy.onProxyRes',
                        additionalProperties: {
                            statusCode: proxyResponse.statusCode,
                            proxyPath,
                            url: req.url
                        }
                    }
                )
            }

            // In this function, req.originalUrl is the path
            // part of the original incoming request URL, containing
            // the /mobify/proxy/.../ part. We need to strip that off
            // before passing it to rewriteProxyResponseHeaders. If we
            // match, group 2 is the full path on the target host, including
            // query parameters.
            const matchedUrl = generalProxyPathRE.exec(req.originalUrl)

            // CDN Simulator: When enabled, transform SLAS token responses
            // ONLY for browser-initiated requests (not SSR requests)
            // NOTE: This is only added as hybrid-auth is enabled on zzrf
            if (!caching && cdnSimulatorEnabled) {
                const isSlasTokenEndpoint =
                    req.url && req.url.match(/\/oauth2\/(token|authorize|login)/)

                // Helper function to filter old-format token cookies from ANY response
                // This prevents duplicate token storage that causes session conflicts
                const filterOldTokenCookies = (cookies) => {
                    if (!cookies) return []
                    const cookieArray = Array.isArray(cookies) ? cookies : [cookies]
                    const oldTokenCookiePatterns = [
                        /^cc-nx-g/i, // Old guest refresh token
                        /^cc-nx[^-]/i, // Old registered refresh token (but not cc-nx-g)
                        /^cc-nx=/i, // Old registered refresh token (exact)
                        /^cc-at/i // Old access token (SFRA hybrid)
                    ]
                    return cookieArray.filter((cookie) => {
                        const cookieName = cookie.split('=')[0].trim()
                        const isOldTokenCookie = oldTokenCookiePatterns.some((pattern) =>
                            pattern.test(cookieName)
                        )
                        if (isOldTokenCookie) {
                            console.log(
                                `[CDN Sim] ⛔ Filtered out old-format cookie: ${cookieName}`
                            )
                        }
                        return !isOldTokenCookie
                    })
                }

                // ALWAYS filter old-format cookies from all responses in CDN sim mode
                if (proxyResponse.headers['set-cookie']) {
                    proxyResponse.headers['set-cookie'] = filterOldTokenCookies(
                        proxyResponse.headers['set-cookie']
                    )
                }
                // Detect if request is from browser vs SSR (Node.js fetch)
                // Browser indicators:
                // 1. sec-fetch-* headers (modern browsers, standard since 2020)
                // 2. origin header (CORS requests from browser)
                // 3. referer header starting with our app URL (browser navigation)
                const hasSecFetchHeaders =
                    req.headers['sec-fetch-mode'] ||
                    req.headers['sec-fetch-site'] ||
                    req.headers['sec-fetch-dest']
                const hasOriginHeader = req.headers['origin']
                const isBrowserRequest = hasSecFetchHeaders || hasOriginHeader

                // Rewrite headers first (before body transformation)
                proxyResponse.headers = rewriteProxyResponseHeaders({
                    appHostname,
                    caching,
                    targetHost,
                    targetProtocol,
                    appProtocol,
                    proxyPath,
                    statusCode: proxyResponse.statusCode,
                    headers: proxyResponse.headers,
                    headerFormat: 'http',
                    logging: !isRemote() && verboseProxyLogging,
                    requestUrl: matchedUrl && matchedUrl[2]
                })

                if (isSlasTokenEndpoint) {
                    console.log(`[CDN Sim] 🎯 SLAS token endpoint detected: ${req.url}`)
                    console.log(
                        `[CDN Sim]    isBrowserRequest: ${!!isBrowserRequest} (sec-fetch-mode: ${
                            req.headers['sec-fetch-mode']
                        })`
                    )
                }

                if (isSlasTokenEndpoint && isBrowserRequest) {
                    console.log(
                        `[CDN Sim] 🎯 Intercepting SLAS token response (browser request): ${req.url}`
                    )

                    // Check if response is compressed
                    const contentEncoding = proxyResponse.headers['content-encoding']
                    console.log('[CDN Sim] Content-Encoding:', contentEncoding)

                    // Intercept the response body for SLAS token endpoints
                    let body = []
                    proxyResponse.on('data', (chunk) => {
                        body.push(chunk)
                    })

                    proxyResponse.on('end', async () => {
                        try {
                            let responseBody = Buffer.concat(body)
                            console.log(
                                '[CDN Sim] 📦 Response body length (raw):',
                                responseBody.length
                            )

                            // Decompress if needed
                            if (contentEncoding === 'gzip') {
                                responseBody = await new Promise((resolve, reject) => {
                                    zlib.gunzip(responseBody, (err, decompressed) => {
                                        if (err) reject(err)
                                        else resolve(decompressed)
                                    })
                                })
                                console.log(
                                    '[CDN Sim] Decompressed body length:',
                                    responseBody.length
                                )
                            }

                            const responseBodyString = responseBody.toString('utf8')
                            const data = JSON.parse(responseBodyString)
                            console.log(
                                '[CDN Sim] 🔍 Response has access_token:',
                                !!data.access_token
                            )

                            if (data && data.access_token) {
                                console.log('[CDN Sim] 🔐 Transforming SLAS token response')

                                // Extract siteId from URL params OR from JWT payload
                                const urlParams = new URLSearchParams(req.url.split('?')[1] || '')
                                let siteId =
                                    urlParams.get('siteId') || urlParams.get('channel_id') || ''

                                // If not in URL, extract from JWT (the aux.channel_id field)
                                if (!siteId && data.access_token) {
                                    try {
                                        const [, payloadB64] = data.access_token.split('.')
                                        if (payloadB64) {
                                            // JWT uses URL-safe Base64: replace - with + and _ with /
                                            const base64 = payloadB64
                                                .replace(/-/g, '+')
                                                .replace(/_/g, '/')
                                            // Add padding if needed
                                            const padded =
                                                base64 + '='.repeat((4 - (base64.length % 4)) % 4)
                                            const payload = JSON.parse(
                                                Buffer.from(padded, 'base64').toString('utf8')
                                            )
                                            // Extract siteId from isb claim (format: ...::chid:RefArchGlobal)
                                            if (payload?.isb) {
                                                const chidMatch = payload.isb.match(/chid:([^:]+)/)
                                                if (chidMatch) {
                                                    siteId = chidMatch[1]
                                                    console.log(
                                                        '[CDN Sim] Extracted siteId from JWT:',
                                                        siteId
                                                    )
                                                }
                                            }
                                            // Fallback: try aux.channel_id
                                            if (!siteId) {
                                                siteId = payload?.aux?.channel_id || ''
                                            }
                                        }
                                    } catch (e) {
                                        console.log(
                                            '[CDN Sim] ⚠️ Failed to extract channel_id from JWT:',
                                            e.message
                                        )
                                    }
                                }
                                const cookieSuffix = siteId ? `_${siteId}` : ''
                                console.log(`[CDN Sim]   → Using siteId: ${siteId || '(none)'}`)

                                // Extract tokens from response
                                const {
                                    access_token,
                                    refresh_token,
                                    id_token,
                                    idp_access_token,
                                    ...safeBody
                                } = data

                                // Set httpOnly cookies with siteId suffix (e.g., access_token_RefArchGlobal)
                                // Old-format cookies were already filtered at the top of CDN sim block
                                const setCookies = Array.isArray(
                                    proxyResponse.headers['set-cookie']
                                )
                                    ? [...proxyResponse.headers['set-cookie']]
                                    : []

                                // Calculate expiry timestamp for browser to know when to refresh
                                // expires_in is in seconds, we convert to absolute timestamp
                                const expiresInSeconds = data.expires_in || 1800
                                const expiryTimestamp = Date.now() + expiresInSeconds * 1000

                                // Only add Secure attribute in production (HTTPS)
                                // In local dev (HTTP), Secure cookies work on localhost but not other domains
                                const useSecure = isRemote() || appProtocol === 'https'
                                const secureFlag = useSecure ? '; Secure' : ''

                                if (access_token) {
                                    // HttpOnly cookie for access token (+ Secure in production)
                                    const cookie = [
                                        `access_token${cookieSuffix}=${access_token}`,
                                        'HttpOnly',
                                        useSecure && 'Secure',
                                        'SameSite=Lax',
                                        'Path=/',
                                        `Max-Age=${expiresInSeconds}`
                                    ]
                                        .filter(Boolean)
                                        .join('; ')
                                    setCookies.push(cookie)
                                    console.log(
                                        `[CDN Sim]   ✓ Set access_token${cookieSuffix} (HttpOnly${secureFlag})`
                                    )

                                    // Non-HttpOnly expiry cookie so browser JS can proactively refresh
                                    const expiryCookie = [
                                        `access_token_expiry${cookieSuffix}=${expiryTimestamp}`,
                                        useSecure && 'Secure',
                                        'SameSite=Lax',
                                        'Path=/',
                                        `Max-Age=${expiresInSeconds}`
                                    ]
                                        .filter(Boolean)
                                        .join('; ')
                                    setCookies.push(expiryCookie)
                                    console.log(
                                        `[CDN Sim]   ✓ Set access_token_expiry${cookieSuffix} cookie (readable by JS)`
                                    )
                                }

                                if (refresh_token) {
                                    // HttpOnly cookie for refresh token (+ Secure in production)
                                    const cookie = [
                                        `refresh_token${cookieSuffix}=${refresh_token}`,
                                        'HttpOnly',
                                        useSecure && 'Secure',
                                        'SameSite=Lax',
                                        'Path=/',
                                        'Max-Age=7776000'
                                    ]
                                        .filter(Boolean)
                                        .join('; ')
                                    setCookies.push(cookie)
                                    console.log(
                                        `[CDN Sim]   ✓ Set refresh_token${cookieSuffix} (HttpOnly${secureFlag})`
                                    )
                                }

                                if (id_token) {
                                    const cookie = [
                                        `id_token${cookieSuffix}=${id_token}`,
                                        'HttpOnly',
                                        useSecure && 'Secure',
                                        'SameSite=Lax',
                                        'Path=/',
                                        `Max-Age=${expiresInSeconds}`
                                    ]
                                        .filter(Boolean)
                                        .join('; ')
                                    setCookies.push(cookie)
                                    console.log(
                                        `[CDN Sim]   ✓ Set id_token${cookieSuffix} (HttpOnly${secureFlag})`
                                    )
                                }

                                if (idp_access_token) {
                                    const cookie = [
                                        `idp_access_token${cookieSuffix}=${idp_access_token}`,
                                        'HttpOnly',
                                        useSecure && 'Secure',
                                        'SameSite=Lax',
                                        'Path=/',
                                        'Max-Age=3600000'
                                    ]
                                        .filter(Boolean)
                                        .join('; ')
                                    setCookies.push(cookie)
                                    console.log(
                                        `[CDN Sim]   ✓ Set idp_access_token${cookieSuffix} (HttpOnly${secureFlag})`
                                    )
                                }

                                // Set marker cookie so client-side Auth knows CDN sim is active
                                // This cookie is NOT httpOnly so JavaScript can read it
                                const markerCookie = [
                                    `cc_cdn_sim${cookieSuffix}=1`,
                                    useSecure && 'Secure',
                                    'SameSite=Lax',
                                    'Path=/',
                                    `Max-Age=${expiresInSeconds}`
                                ]
                                    .filter(Boolean)
                                    .join('; ')
                                setCookies.push(markerCookie)
                                console.log(
                                    `[CDN Sim]   ✓ Set cc_cdn_sim${cookieSuffix} marker cookie`
                                )

                                // STRIP TOKENS FROM RESPONSE BODY
                                // This simulates CDN edge transformer behavior in production
                                // Tokens are now ONLY available in httpOnly cookies
                                console.log(
                                    '[CDN Sim]   📋 safeBody keys:',
                                    Object.keys(safeBody).join(', ')
                                )
                                console.log(
                                    '[CDN Sim]   📋 safeBody.customer_id:',
                                    safeBody.customer_id || '(missing!)'
                                )
                                const strippedResponse = JSON.stringify(safeBody)

                                // Remove transfer-encoding and content-encoding headers
                                // since we're sending uncompressed content with content-length
                                const responseHeaders = {...proxyResponse.headers}
                                delete responseHeaders['transfer-encoding']
                                delete responseHeaders['content-encoding']

                                // Log the full Set-Cookie headers for debugging
                                console.log('[CDN Sim]   📋 Set-Cookie headers:')
                                setCookies.forEach((cookie, i) => {
                                    // Only show first 100 chars of cookie value for security
                                    const [name, ...rest] = cookie.split('=')
                                    const value = rest.join('=')
                                    const preview =
                                        value.length > 100 ? value.substring(0, 100) + '...' : value
                                    console.log(`[CDN Sim]      ${i + 1}. ${name}=${preview}`)
                                })

                                res.writeHead(proxyResponse.statusCode, {
                                    ...responseHeaders,
                                    'set-cookie': setCookies,
                                    'content-length': Buffer.byteLength(strippedResponse)
                                })
                                res.end(strippedResponse)
                                console.log('[CDN Sim]   ✓ Stripped tokens from response body')
                                console.log(
                                    '[CDN Sim]   → Tokens are now ONLY in httpOnly cookies (not accessible to JavaScript)'
                                )
                                return
                            }
                        } catch (e) {
                            console.log('[CDN Sim] ⚠️  Failed to parse response:', e.message)
                        }

                        // Pass through original response
                        res.writeHead(proxyResponse.statusCode, proxyResponse.headers)
                        res.end(Buffer.concat(body))
                    })

                    return
                }

                // For non-SLAS endpoints, just pipe the response through
                res.writeHead(proxyResponse.statusCode, proxyResponse.headers)
                proxyResponse.pipe(res)
                return
            }

            // Rewrite key headers
            proxyResponse.headers = rewriteProxyResponseHeaders({
                appHostname,
                caching,
                targetHost,
                targetProtocol,
                appProtocol,
                proxyPath,
                statusCode: proxyResponse.statusCode,
                headers: proxyResponse.headers,
                headerFormat: 'http',
                logging: !isRemote() && verboseProxyLogging,
                requestUrl: matchedUrl && matchedUrl[2]
            })

            // Also handle binary responses
            if (isRemote()) {
                processExpressResponse(proxyResponse)
            }
        },

        // Rewrite the request's path to remove the /mobify/proxy/... prefix.
        // This cannot be modified by any express middleware
        // So we need to use the built in pathRewrite to remove the base path if present
        pathRewrite: (path) => {
            const basePathRegexEntry = getEnvBasePath() ? `${getEnvBasePath()}?` : ''
            const regex = new RegExp(`^${basePathRegexEntry}${proxyPath}`)
            return path.replace(regex, '')
        },

        // The origin (protocol + host) to which we proxy
        target: targetOrigin
    }

    const proxyFunc = createProxyMiddleware(config)

    // For a standard proxy, wrap with refresh token handler if CDN simulator is enabled
    if (!caching) {
        if (cdnSimulatorEnabled) {
            // Wrap proxy to intercept refresh token requests from browser
            return (req, res, next) => {
                // Check if this is a token endpoint POST from browser
                const isTokenEndpoint = req.url && req.url.includes('/oauth2/token')
                const isPostRequest = req.method === 'POST'
                const hasSecFetchHeaders =
                    req.headers['sec-fetch-mode'] ||
                    req.headers['sec-fetch-site'] ||
                    req.headers['sec-fetch-dest']
                const hasOriginHeader = req.headers['origin']
                const isBrowserRequest = hasSecFetchHeaders || hasOriginHeader

                if (isTokenEndpoint && isPostRequest && isBrowserRequest) {
                    console.log('[CDN Sim] 🔍 Detected browser POST to token endpoint')
                    // Read the raw body to check for refresh_token grant type
                    // Body-parser may not have run for proxy routes
                    const chunks = []
                    req.on('data', (chunk) => chunks.push(chunk))
                    req.on('end', () => {
                        const rawBody = Buffer.concat(chunks).toString('utf8')
                        console.log(`[CDN Sim] 🔍 Token endpoint body: ${rawBody}`)

                        const isRefreshGrant = rawBody.includes('grant_type=refresh_token')
                        console.log(`[CDN Sim] 🔍 Is refresh grant: ${isRefreshGrant}`)

                        if (isRefreshGrant) {
                            console.log('[CDN Sim] 🔄 Intercepting REFRESH token request')
                            // Store parsed body for handleRefreshTokenRequest
                            req.body = Object.fromEntries(new URLSearchParams(rawBody))
                            console.log('[CDN Sim] 🔄 Parsed body:', req.body)
                            return handleRefreshTokenRequest({
                                req,
                                res,
                                targetProtocol,
                                targetHost,
                                appProtocol
                            })
                        } else {
                            // For authorization_code grants, let proxy handle it
                            // But we need to re-create the request since we consumed the body
                            console.log('[CDN Sim] 📤 Passing through non-refresh token request')

                            // Make direct request to SLAS (same as refresh but different handling)
                            handleDirectTokenRequest({
                                req,
                                res,
                                rawBody,
                                targetProtocol,
                                targetHost,
                                appProtocol
                            })
                        }
                    })
                    return
                }

                // Not a token endpoint POST, proceed with normal proxy
                return proxyFunc(req, res, next)
            }
        }
        return proxyFunc
    }

    // For caching proxies, we need to validate the request method. We can't
    // do that in the onProxyReq handler, because there's no way to send
    // an HTTP error response from that function. Instead, we do it here,
    // in a wrapper around the actual proxying function.
    return (req, res, next) => {
        // This function will only be called for requests for the
        // current proxy config.
        if (!ALLOWED_CACHING_PROXY_REQUEST_METHODS.includes(req.method)) {
            return res
                .status(405)
                .send(`Method ${req.method} not supported for caching proxy`)
                .end()
        }
        return proxyFunc(req, res, next)
    }
}

/**
 * Called by the Express app after updatePackageMobify has modified the
 * proxyConfigs list, to create the actual proxying objects.
 * @param {String} appHostname - the application hostname (the hostname
 * to which requests are sent to the Express app)
 * @param {String} appProtocol {String} the protocol to use to make requests to
 * the origin ('http' or 'https', defaults to 'https')
 * @private
 */
export const configureProxyConfigs = (appHostname, appProtocol) => {
    localDevLog('')
    proxyConfigs.forEach((config) => {
        localDevLog(
            `Proxying ${config.proxyPath} and ${config.cachingPath} to ${config.protocol}://${config.host}`
        )
        config.proxy = configureProxy({
            proxyPath: config.proxyPath,
            targetProtocol: config.protocol,
            targetHost: config.host,
            appProtocol,
            appHostname,
            caching: false
        })
        config.cachingProxy = configureProxy({
            proxyPath: config.cachingPath,
            targetProtocol: config.protocol,
            targetHost: config.host,
            appProtocol,
            appHostname,
            caching: true
        })
    })
    localDevLog('')
}
