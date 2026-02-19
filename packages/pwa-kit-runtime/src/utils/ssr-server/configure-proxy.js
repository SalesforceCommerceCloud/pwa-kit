/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {createProxyMiddleware} from 'http-proxy-middleware'
import cookie from 'cookie'
import {rewriteProxyRequestHeaders, rewriteProxyResponseHeaders} from '../ssr-proxying'
import {proxyConfigs} from '../ssr-shared'
import {processExpressResponse} from './process-express-response'
import {isRemote, localDevLog, verboseProxyLogging, isScapiDomain} from './utils'
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
 * Apply the Authorization header with the shopper's access token (Bearer token) to a proxy request.
 *
 * This function is intended to be called from within a proxy's onProxyReq method.
 * It reads the access token from HttpOnly cookies and sets it as the Authorization header
 * for applicable SCAPI endpoints.
 *
 * Logic for determining if Bearer token should be applied:
 * 1. Caching proxies never use auth (skip)
 * 2. siteId must be provided (skip if not)
 * 3. Target must be SCAPI domain (skip if not)
 * 4. For SLAS auth endpoints (/shopper/auth/*): Only apply if they match the regex
 *    - Most use Basic Auth (client credentials), but some like /oauth2/logout need Bearer token
 * 5. For non-SLAS auth endpoints (e.g., /shopper/products, /shopper/baskets): Always apply Bearer token
 *
 * @private
 * @function
 * @param proxyRequest {http.ClientRequest} the request that will be sent to the target host
 * @param incomingRequest {http.IncomingMessage} the request made to this Express app
 * @param caching {Boolean} true for a caching proxy, false for a standard proxy
 * @param siteId {String} the site ID for the current request
 * @param targetHost {String} the target hostname (host+port)
 * @param slasEndpointsRequiringAccessToken {RegExp} regex for SLAS auth endpoints that need Bearer token
 */
export const applyProxyRequestAuthHeader = ({
    proxyRequest,
    incomingRequest,
    caching,
    siteId,
    targetHost,
    slasEndpointsRequiringAccessToken
}) => {
    const url = incomingRequest.url

    // Skip if: caching proxy, no siteId, not SCAPI domain, or no URL
    if (caching || !siteId || !isScapiDomain(targetHost) || !url) {
        return
    }
    if (url.startsWith('/shopper/auth/')) {
        // For SLAS auth endpoints, only apply if they match the configured regex
        // Most SLAS endpoints use Basic Auth, only specific ones like /oauth2/logout need Bearer token
        if (!slasEndpointsRequiringAccessToken || !url.match(slasEndpointsRequiringAccessToken)) {
            return
        }
    }
    // If we reach here, either:
    // 1. It's a SLAS auth endpoint that matched the regex, OR
    // 2. It's a non-SLAS auth endpoint (which always requires Bearer token)

    // Get access token from HttpOnly cookie
    const cookieHeader = incomingRequest.headers.cookie
    if (!cookieHeader) return

    const cookies = cookie.parse(cookieHeader)
    const tokenKey = `access_token_${siteId.trim()}`
    const accessToken = cookies[tokenKey]

    if (accessToken) {
        // Always override - cookie-based auth takes precedence
        proxyRequest.setHeader('authorization', `Bearer ${accessToken}`)
    }
}

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
 * @param siteId {String} the site ID for the current request
 * @param slasEndpointsRequiringAccessToken {RegExp} regex for SLAS auth endpoints that require Bearer token
 * @returns {middleware} function to pass to expressApp.use()
 */
export const configureProxy = ({
    appHostname,
    proxyPath,
    targetProtocol,
    targetHost,
    appProtocol = /* istanbul ignore next */ 'https',
    caching,
    siteId = null,
    slasEndpointsRequiringAccessToken = /\/oauth2\/logout/
}) => {
    // This configuration must match the behaviour of the proxying
    // in CloudFront.
    const targetOrigin = `${targetProtocol}://${targetHost}`
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
            // First, apply standard proxy headers (Host, Origin, etc.)
            applyProxyRequestHeaders({
                proxyRequest,
                incomingRequest,
                caching,
                proxyPath,
                targetHost,
                targetProtocol
            })

            // Apply Authorization header with shopper's access token from HttpOnly cookie
            applyProxyRequestAuthHeader({
                proxyRequest,
                incomingRequest,
                caching,
                siteId,
                targetHost,
                slasEndpointsRequiringAccessToken
            })
        },

        onProxyRes: (proxyResponse, req) => {
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
 * @param {String} siteId - the site ID for the current request
 * @param {RegExp} slasEndpointsRequiringAccessToken - regex for SLAS auth endpoints that require Bearer token
 * @private
 */
export const configureProxyConfigs = (
    appHostname,
    appProtocol,
    siteId = null,
    slasEndpointsRequiringAccessToken = /\/oauth2\/logout/
) => {
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
            caching: false,
            siteId,
            slasEndpointsRequiringAccessToken
        })
        config.cachingProxy = configureProxy({
            proxyPath: config.cachingPath,
            targetProtocol: config.protocol,
            targetHost: config.host,
            appProtocol,
            appHostname,
            caching: true,
            siteId: null // No auth for caching proxy
        })
    })
    localDevLog('')
}
