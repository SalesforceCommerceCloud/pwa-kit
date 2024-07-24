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
            applyProxyRequestHeaders({
                proxyRequest,
                incomingRequest,
                caching,
                proxyPath,
                targetHost,
                targetProtocol
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

        // Rewrite the request's path to remove the /mobify/proxy/...
        // prefix.
        pathRewrite: {
            [`^${proxyPath}`]: ''
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
