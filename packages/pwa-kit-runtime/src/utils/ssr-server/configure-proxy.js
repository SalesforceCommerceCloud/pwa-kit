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
import {X_SITE_ID, DWSID_COOKIE_NAME} from '../../ssr/server/constants'
import {
    SESSION_COOKIE_CONFIG,
    getCookieName,
    getCookieNamesToStripFromProxy,
    getSiteId
} from '../../ssr/server/httponly-cookie-config'

/**
 * Error thrown when the access token HttpOnly cookie is not found on an SCAPI proxy request.
 * Handled in onProxyReq to return a 400 instead of forwarding an unauthenticated request to SCAPI.
 */
export class AccessTokenNotFoundError extends Error {
    constructor(message) {
        super(message)
        this.name = 'AccessTokenNotFoundError'
    }
}

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
 * Apply the Authorization header for an SCAPI proxy request.
 *
 * Intended to be called from within a proxy's onProxyReq method. Decides
 * what Authorization to forward to SCAPI based on the incoming header and
 * the HttpOnly access-token cookie.
 *
 * Skipped entirely when:
 * 1. caching is true (caching proxies never use auth);
 * 2. the target is not an SCAPI domain;
 * 3. the x-site-id header is missing (logged as a warning).
 *
 * Otherwise the Authorization precedence is:
 *
 * 1. Incoming `Authorization: Bearer <jwt>` — re-emitted with the canonical
 *    `Bearer` scheme. The caller (typically the SDK during SSR after a fresh
 *    SLAS token fetch) is trusted to have set a valid bearer. Scheme match is
 *    case-insensitive and requires at least one non-whitespace character
 *    after the scheme. The token is forwarded unchanged, but the scheme case
 *    and separator are normalized to `Bearer <jwt>` so SCAPI — which rejects
 *    a lowercase `bearer` — accepts it.
 *
 * 2. Access-token cookie present — set `Authorization: Bearer <cookie>`,
 *    overwriting whatever was there. Covers:
 *      - no incoming Authorization (client-side navigation in HttpOnly
 *        mode, where JS can't read the cookie);
 *      - empty `Bearer ` (no value);
 *      - `Basic <…>` (the Protected Storefronts pattern — swap Basic
 *        page-level credentials for the JWT bearer SCAPI expects).
 *
 * 3. No cookie and no incoming Authorization — throw
 *    {@link AccessTokenNotFoundError}.
 *
 * 4. No cookie but a non-bearer (or value-less `Bearer`) incoming
 *    Authorization (Basic, custom, etc.) — pass through unchanged. SCAPI
 *    will reject it; we don't actively rewrite it.
 *
 * @private
 * @function
 * @param proxyRequest {http.ClientRequest} the request that will be sent to the target host
 * @param incomingRequest {http.IncomingMessage} the request made to this Express app
 * @param caching {Boolean} true for a caching proxy, false for a standard proxy
 * @param targetHost {String} the target hostname (host+port)
 * @throws {AccessTokenNotFoundError} when this is an SCAPI request with no access-token cookie and no incoming Authorization.
 */
export const setScapiAuthRequestHeaders = ({
    proxyRequest,
    incomingRequest,
    caching,
    targetHost
}) => {
    const url = incomingRequest.url
    const resolvedSiteId = getSiteId(incomingRequest)

    // Skip if: caching proxy, not SCAPI domain, or no URL
    if (caching || !isScapiDomain(targetHost) || !url) {
        return
    }

    if (!resolvedSiteId) {
        logger.warn(
            'x-site-id header is missing on SCAPI proxy request. Bearer token injection skipped.',
            {namespace: 'configureProxy.setScapiAuthRequestHeaders'}
        )
        return
    }

    // Get access token from HttpOnly cookie
    const cookieHeader = incomingRequest.headers.cookie
    const cookies = cookieHeader ? cookie.parse(cookieHeader) : {}
    const tokenKey = getCookieName(SESSION_COOKIE_CONFIG.accessToken, resolvedSiteId)
    const accessToken = cookies[tokenKey]

    const existingAuth = incomingRequest.headers.authorization
    // A `Bearer <token>` header (case-insensitive scheme, requires at least
    // one non-whitespace character after the separator) is treated as already
    // authenticated. Capture the token so we can re-emit it with the canonical
    // scheme: SCAPI rejects a lowercase `bearer`, and an incoming header may
    // arrive with any scheme case or a tab separator. An empty `Bearer ` has
    // no token and falls through to the cookie path.
    const bearerMatch = /^bearer\s+(\S.*?)\s*$/i.exec(existingAuth || '')

    if (bearerMatch) {
        // The caller — typically the SDK during SSR after obtaining a fresh
        // token from SLAS — is trusted to have set a valid token. Re-emit it
        // under the canonical `Bearer` scheme (normalizing scheme case and the
        // separator) so SCAPI accepts it. Only the scheme/separator is
        // normalized — the token is forwarded as-is, so a fresh SSR token still
        // wins over a stale cookie.
        proxyRequest.setHeader('authorization', `Bearer ${bearerMatch[1]}`)
    } else if (accessToken) {
        // No incoming Authorization, an empty `Bearer `, or `Basic <…>` (the
        // Protected Storefronts pattern). Inject the cookie-derived JWT.
        proxyRequest.setHeader('authorization', `Bearer ${accessToken}`)
    } else if (!existingAuth) {
        // No cookie and no incoming auth — nothing to forward.
        throw new AccessTokenNotFoundError(
            'Access token cookie not found. Cannot proceed with SCAPI request.'
        )
    }

    // Transform dwsid cookie into sfdc_dwsid header (same as MRT)
    if (cookies[DWSID_COOKIE_NAME]) {
        proxyRequest.setHeader('sfdc_dwsid', cookies[DWSID_COOKIE_NAME])
    }

    // Strip session cookies — the proxy has already extracted the tokens
    // it needs. These cookies should not be forwarded to SCAPI.
    stripSessionCookies(proxyRequest, incomingRequest)
    // Strip internal header — only used by our proxy, not by SCAPI.
    proxyRequest.removeHeader(X_SITE_ID)
}

/**
 * Strip HttpOnly session cookies from a proxy request after the proxy has already
 * extracted the tokens it needs (e.g., to set Authorization headers).
 *
 * This mirrors the MRT CloudFront Lambda@Edge logic in transformHttpOnlyCookies
 * (cloudfront-proxy-origin-rewriter.js), using exact cookie names based on siteId
 * rather than prefix matching.
 *
 * Removes: cc-at_{siteId}, cc-nx-g_{siteId}, cc-nx_{siteId}, idp_access_token_{siteId}, idp_refresh_token_{siteId}, and dwsid.
 * Any remaining cookies are preserved and forwarded.
 *
 * @private
 * @param proxyRequest {http.ClientRequest} the outgoing proxy request
 * @param incomingRequest {http.IncomingMessage} the original incoming request
 */
export const stripSessionCookies = (proxyRequest, incomingRequest) => {
    const cookieHeader = incomingRequest.headers.cookie
    if (!cookieHeader) return

    const cookies = cookie.parse(cookieHeader)
    const siteId = getSiteId(incomingRequest)

    // Build the exact list of cookies to delete, matching MRT's approach
    const cookiesToDelete = new Set(getCookieNamesToStripFromProxy(siteId))

    const filtered = Object.entries(cookies).filter(([name]) => !cookiesToDelete.has(name))

    if (filtered.length === 0) {
        proxyRequest.removeHeader('cookie')
    } else {
        proxyRequest.setHeader(
            'cookie',
            filtered.map(([name, value]) => cookie.serialize(name, value)).join('; ')
        )
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

            if (!res.headersSent) {
                res.writeHead(500, {
                    'Content-Type': 'text/plain'
                })
                res.end(`Error in proxy request to ${req.url}: ${err}`)
            }
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
        onProxyReq: (proxyRequest, incomingRequest, res) => {
            // First, apply standard proxy headers (Host, Origin, etc.)
            applyProxyRequestHeaders({
                proxyRequest,
                incomingRequest,
                caching,
                proxyPath,
                targetHost,
                targetProtocol
            })

            // For SCAPI proxy requests with HttpOnly cookies enabled:
            // inject auth headers from cookies, strip session cookies, and
            // remove internal headers. Non-SCAPI proxies are left untouched.
            if (process.env.MRT_ENABLE_HTTPONLY_SESSION_COOKIES === 'true') {
                try {
                    setScapiAuthRequestHeaders({
                        proxyRequest,
                        incomingRequest,
                        caching,
                        targetHost
                    })
                } catch (error) {
                    if (error instanceof AccessTokenNotFoundError) {
                        logger.warn(error.message, {
                            namespace: 'configureProxy.setScapiAuthRequestHeaders'
                        })
                        if (!res.headersSent) {
                            proxyRequest.destroy()
                            res.status(400).json({
                                message: 'access_token_cookie_missing'
                            })
                        }
                        return
                    }
                    throw error
                }
            }
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
