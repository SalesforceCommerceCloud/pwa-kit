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

            // CDN Simulator: Inject Authorization header from httpOnly cookie or AsyncLocalStorage
            if (!caching && cdnSimulatorEnabled) {
                let accessToken = null
                let tokenSource = null

                // First, try to get access_token from cookies (browser requests)
                // Cookie names may have siteId suffix (e.g., access_token_RefArchGlobal)
                const cookieHeader = incomingRequest.headers.cookie
                
                // Debug: log all cookies received
                if (cookieHeader) {
                    console.log(`[CDN Sim] 🍪 Cookies received: ${cookieHeader.substring(0, 200)}${cookieHeader.length > 200 ? '...' : ''}`)
                } else {
                    console.log(`[CDN Sim] 🍪 No cookies in request for ${incomingRequest.url}`)
                }
                
                if (cookieHeader) {
                    // Parse cookies to find access_token or access_token_<siteId>
                    const cookies = {}
                    cookieHeader.split(';').forEach(cookie => {
                        const [key, ...valueParts] = cookie.trim().split('=')
                        if (key && valueParts.length > 0) {
                            cookies[key] = decodeURIComponent(valueParts.join('='))
                        }
                    })
                    
                    // Debug: log parsed cookie keys
                    console.log(`[CDN Sim] 🍪 Parsed cookie keys: ${Object.keys(cookies).join(', ')}`)

                    // Try exact match first, then look for access_token_* pattern
                    if (cookies.access_token) {
                        accessToken = cookies.access_token
                        tokenSource = 'cookie'
                    } else {
                        // Find cookie matching access_token_<siteId> pattern
                        const accessTokenKey = Object.keys(cookies).find(key => key.startsWith('access_token_'))
                        if (accessTokenKey) {
                            accessToken = cookies[accessTokenKey]
                            tokenSource = `cookie (${accessTokenKey})`
                        }
                    }
                }

                // Inject Authorization header if access_token found in cookies
                if (accessToken) {
                    proxyRequest.setHeader('Authorization', `Bearer ${accessToken}`)
                    console.log(`[CDN Sim] 🔑 Injected Authorization header from ${tokenSource} for ${incomingRequest.url}`)
                } else {
                    console.log(`[CDN Sim] ⚠️ No access_token found for ${incomingRequest.url}`)
                }
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
            // SSR tokens are used server-side only and discarded (important for caching)
            if (!caching && cdnSimulatorEnabled) {
                const isSlasTokenEndpoint = req.url && req.url.match(/\/oauth2\/(token|authorize|login)/)
                
                // Detect if request is from browser vs SSR (Node.js fetch)
                // Browser indicators:
                // 1. sec-fetch-* headers (modern browsers, standard since 2020)
                // 2. origin header (CORS requests from browser)
                // 3. referer header starting with our app URL (browser navigation)
                const hasSecFetchHeaders = req.headers['sec-fetch-mode'] || 
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
                    console.log(`[CDN Sim]    isBrowserRequest: ${!!isBrowserRequest} (sec-fetch-mode: ${req.headers['sec-fetch-mode']})`)
                }
                
                if (isSlasTokenEndpoint && isBrowserRequest) {
                    console.log(`[CDN Sim] 🎯 Intercepting SLAS token response (browser request): ${req.url}`)

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
                            console.log('[CDN Sim] 📦 Response body length (raw):', responseBody.length)

                            // Decompress if needed
                            if (contentEncoding === 'gzip') {
                                const zlib = require('zlib')
                                responseBody = await new Promise((resolve, reject) => {
                                    zlib.gunzip(responseBody, (err, decompressed) => {
                                        if (err) reject(err)
                                        else resolve(decompressed)
                                    })
                                })
                                console.log('[CDN Sim] Decompressed body length:', responseBody.length)
                            }

                            const responseBodyString = responseBody.toString('utf8')
                            const data = JSON.parse(responseBodyString)
                            console.log('[CDN Sim] 🔍 Response has access_token:', !!data.access_token)

                            if (data && data.access_token) {
                                console.log('[CDN Sim] 🔐 Transforming SLAS token response')

                                // Extract siteId from URL params OR from JWT payload
                                const urlParams = new URLSearchParams(req.url.split('?')[1] || '')
                                let siteId = urlParams.get('siteId') || urlParams.get('channel_id') || ''
                                
                                // If not in URL, extract from JWT (the aux.channel_id field)
                                if (!siteId && data.access_token) {
                                    try {
                                        const [, payloadB64] = data.access_token.split('.')
                                        if (payloadB64) {
                                            // JWT uses URL-safe Base64: replace - with + and _ with /
                                            const base64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/')
                                            // Add padding if needed
                                            const padded = base64 + '='.repeat((4 - base64.length % 4) % 4)
                                            const payload = JSON.parse(Buffer.from(padded, 'base64').toString('utf8'))
                                            // Extract siteId from isb claim (format: ...::chid:RefArchGlobal)
                                            if (payload?.isb) {
                                                const chidMatch = payload.isb.match(/chid:([^:]+)/)
                                                if (chidMatch) {
                                                    siteId = chidMatch[1]
                                                    console.log('[CDN Sim] Extracted siteId from JWT:', siteId)
                                                }
                                            }
                                            // Fallback: try aux.channel_id
                                            if (!siteId) {
                                                siteId = payload?.aux?.channel_id || ''
                                            }
                                        }
                                    } catch (e) {
                                        console.log('[CDN Sim] ⚠️ Failed to extract channel_id from JWT:', e.message)
                                    }
                                }
                                const cookieSuffix = siteId ? `_${siteId}` : ''
                                console.log(`[CDN Sim]   → Using siteId: ${siteId || '(none)'}`)

                                // Extract tokens from response
                                const {access_token, refresh_token, id_token, idp_access_token, ...safeBody} = data

                                const isProduction = process.env.NODE_ENV === 'production'

                                // Set httpOnly cookies with siteId suffix (e.g., access_token_RefArchGlobal)
                                const setCookies = Array.isArray(proxyResponse.headers['set-cookie'])
                                    ? [...proxyResponse.headers['set-cookie']]
                                    : []

                                if (access_token) {
                                    const cookie = [
                                        `access_token${cookieSuffix}=${access_token}`,
                                        'HttpOnly',
                                        isProduction && 'Secure',
                                        'SameSite=Lax',
                                        'Path=/',
                                        'Max-Age=1800'
                                    ].filter(Boolean).join('; ')
                                    setCookies.push(cookie)
                                    console.log(`[CDN Sim]   ✓ Set access_token${cookieSuffix} cookie (httpOnly)`)
                                }

                                if (refresh_token) {
                                    const cookie = [
                                        `refresh_token${cookieSuffix}=${refresh_token}`,
                                        'HttpOnly',
                                        isProduction && 'Secure',
                                        'SameSite=Lax',
                                        'Path=/',
                                        'Max-Age=7776000'
                                    ].filter(Boolean).join('; ')
                                    setCookies.push(cookie)
                                    console.log(`[CDN Sim]   ✓ Set refresh_token${cookieSuffix} cookie (httpOnly)`)
                                }

                                if (id_token) {
                                    const cookie = [
                                        `id_token${cookieSuffix}=${id_token}`,
                                        'HttpOnly',
                                        isProduction && 'Secure',
                                        'SameSite=Lax',
                                        'Path=/',
                                        'Max-Age=1800'
                                    ].filter(Boolean).join('; ')
                                    setCookies.push(cookie)
                                    console.log(`[CDN Sim]   ✓ Set id_token${cookieSuffix} cookie (httpOnly)`)
                                }

                                if (idp_access_token) {
                                    const cookie = [
                                        `idp_access_token${cookieSuffix}=${idp_access_token}`,
                                        'HttpOnly',
                                        isProduction && 'Secure',
                                        'SameSite=Lax',
                                        'Path=/',
                                        'Max-Age=3600000'
                                    ].filter(Boolean).join('; ')
                                    setCookies.push(cookie)
                                    console.log(`[CDN Sim]   ✓ Set idp_access_token${cookieSuffix} cookie (httpOnly)`)
                                }

                                // Set marker cookie so client-side Auth knows CDN sim is active
                                // This cookie is NOT httpOnly so JavaScript can read it
                                const markerCookie = [
                                    `cc_cdn_sim${cookieSuffix}=1`,
                                    isProduction && 'Secure',
                                    'SameSite=Lax',
                                    'Path=/',
                                    'Max-Age=1800'
                                ].filter(Boolean).join('; ')
                                setCookies.push(markerCookie)
                                console.log(`[CDN Sim]   ✓ Set cc_cdn_sim${cookieSuffix} marker cookie`)

                                // STRIP TOKENS FROM RESPONSE BODY
                                // This simulates CDN edge transformer behavior in production
                                // Tokens are now ONLY available in httpOnly cookies
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
                                    const preview = value.length > 100 ? value.substring(0, 100) + '...' : value
                                    console.log(`[CDN Sim]      ${i + 1}. ${name}=${preview}`)
                                })

                                res.writeHead(proxyResponse.statusCode, {
                                    ...responseHeaders,
                                    'set-cookie': setCookies,
                                    'content-length': Buffer.byteLength(strippedResponse)
                                })
                                res.end(strippedResponse)
                                console.log('[CDN Sim]   ✓ Stripped tokens from response body')
                                console.log('[CDN Sim]   → Tokens are now ONLY in httpOnly cookies (not accessible to JavaScript)')
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

    // For a standard proxy, we're done
    if (!caching) {
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
