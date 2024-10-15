/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'path'
import {
    BUILD,
    CONTENT_TYPE,
    X_MOBIFY_QUERYSTRING,
    SET_COOKIE,
    CACHE_CONTROL,
    NO_CACHE,
    X_ENCODED_HEADERS
} from './constants'
import {
    catchAndLog,
    getHashForString,
    isRemote,
    MetricsSender,
    outgoingRequestHook,
    processLambdaResponse,
    responseSend,
    configureProxyConfigs,
    setQuiet,
    localDevLog
} from '../../utils/ssr-server'
import dns from 'dns'
import express from 'express'
import {PersistentCache} from '../../utils/ssr-cache'
import merge from 'merge-descriptors'
import URL from 'url'
import {Headers, X_HEADERS_TO_REMOVE_ORIGIN, X_MOBIFY_REQUEST_CLASS} from '../../utils/ssr-proxying'
import assert from 'assert'
import semver from 'semver'
import pkg from '../../../package.json'
import fs from 'fs'
import {RESOLVED_PROMISE} from './express'
import http from 'http'
import https from 'https'
import {proxyConfigs, updatePackageMobify} from '../../utils/ssr-shared'
import {
    proxyBasePath,
    bundleBasePath,
    healthCheckPath,
    slasPrivateProxyPath
} from '../../utils/ssr-namespace-paths'
import {applyProxyRequestHeaders} from '../../utils/ssr-server/configure-proxy'
import awsServerlessExpress from 'aws-serverless-express'
import expressLogging from 'morgan'
import logger from '../../utils/logger-instance'
import {createProxyMiddleware} from 'http-proxy-middleware'

/**
 * An Array of mime-types (Content-Type values) that are considered
 * as binary by awsServerlessExpress when processing responses.
 * We intentionally exclude all text/* values since we assume UTF8
 * encoding and there's no reason to bulk up the response by base64
 * encoding the result.
 *
 * We can use '*' in these types as a wildcard - see
 * https://www.npmjs.com/package/type-is#type--typeisismediatype-types
 *
 * @private
 */
const binaryMimeTypes = ['application/*', 'audio/*', 'font/*', 'image/*', 'video/*']

/**
 * Environment variables that must be set for the Express app to run remotely.
 *
 * @private
 */
export const REMOTE_REQUIRED_ENV_VARS = [
    'BUNDLE_ID',
    'DEPLOY_TARGET',
    'EXTERNAL_DOMAIN_NAME',
    'MOBIFY_PROPERTY_ID'
]

const METRIC_DIMENSIONS = {
    Project: process.env.MOBIFY_PROPERTY_ID,
    Target: process.env.DEPLOY_TARGET
}

/**
 * @private
 */
export const RemoteServerFactory = {
    /**
     * @private
     */
    _configure(options) {
        /**
         * Not all of these options are documented. Some exist to allow for
         * testing, or to handle non-standard projects.
         */
        const defaults = {
            // For test only – allow the project dir to be overridden.
            projectDir: process.cwd(),

            // Absolute path to the build directory
            buildDir: path.resolve(process.cwd(), BUILD),

            // The cache time for SSR'd pages (defaults to 600 seconds)
            defaultCacheTimeSeconds: 600,

            // The port that the local dev server listens on
            port: 3443,

            // The protocol that the local dev server listens on
            protocol: 'https',

            // Whether or not to use a keep alive agent for proxy connections.
            proxyKeepAliveAgent: true,

            // Quiet flag (suppresses output if true)
            quiet: false,

            // Suppress SSL checks - can be used for local dev server
            // test code. Undocumented at present because there should
            // be no use-case for SDK users to set this.
            strictSSL: true,

            mobify: undefined,

            // Toggle cookies being passed and set
            localAllowCookies: false,

            // Toggle for setting up the custom SLAS private client secret handler
            useSLASPrivateClient: false,

            // A regex for identifying which SLAS endpoints the custom SLAS private
            // client secret handler will inject an Authorization header.
            // Do not modify unless a project wants to customize additional SLAS
            // endpoints that we currently do not support (ie. /oauth2/passwordless/token)
            applySLASPrivateClientToEndpoints: /\/oauth2\/token/
        }

        options = Object.assign({}, defaults, options)

        setQuiet(options.quiet || process.env.SSR_QUIET)

        // Set the protocol for the Express app listener - defaults to https on remote
        options.protocol = this._getProtocol(options)

        // Local dev server doesn't cache by default
        options.defaultCacheControl = this._getDefaultCacheControl(options)

        // Ensure this is a boolean, and is always true for a remote server.
        options.strictSSL = this._strictSSL(options)

        // This is the external HOSTNAME under which we are serving the page.
        // The EXTERNAL_DOMAIN_NAME value technically only applies to remote
        // operation, but we allow it to be used for a local dev server also.
        options.appHostname = process.env.EXTERNAL_DOMAIN_NAME || `localhost:${options.port}`

        options.devServerHostName = process.env.LISTEN_ADDRESS || `localhost:${options.port}`

        // This is the ORIGIN under which we are serving the page.
        // because it's an origin, it does not end with a slash.
        options.appOrigin = process.env.APP_ORIGIN = `${options.protocol}://${options.appHostname}`

        // Toggle cookies being passed and set. Can be overridden locally,
        // always uses MRT_ALLOW_COOKIES env remotely
        options.allowCookies = this._getAllowCookies(options)

        // For test only – configure the SLAS private client secret proxy endpoint
        options.slasHostName = this._getSlasEndpoint(options)
        options.slasTarget = options.slasTarget || `https://${options.slasHostName}`

        return options
    },

    /**
     * @private
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _logStartupMessage(options) {
        // Hook for the DevServer
    },

    /**
     * @private
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _getAllowCookies(options) {
        return 'MRT_ALLOW_COOKIES' in process.env ? process.env.MRT_ALLOW_COOKIES == 'true' : false
    },

    /**
     * @private
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _getProtocol(options) {
        return 'https'
    },

    /**
     * @private
     */
    _getDefaultCacheControl(options) {
        return `max-age=${options.defaultCacheTimeSeconds}, s-maxage=${options.defaultCacheTimeSeconds}`
    },

    /**
     * @private
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _strictSSL(options) {
        return true
    },

    /**
     * @private
     */
    _isBundleOrProxyPath(url) {
        return url.startsWith(proxyBasePath) || url.startsWith(bundleBasePath)
    },

    /**
     * @private
     */
    _getSlasEndpoint(options) {
        if (!options.useSLASPrivateClient) return undefined
        const shortCode = options.mobify?.app?.commerceAPI?.parameters?.shortCode
        return `${shortCode}.api.commercecloud.salesforce.com`
    },

    /**
     * @private
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _setCompression(app) {
        // Let the CDN do it
    },

    /**
     * @private
     */

    _setupLogging(app) {
        const morganLoggerFormat = function (tokens, req, res) {
            const contentLength = tokens.res(req, res, 'content-length')
            return [
                `(${res.locals.requestId})`,
                tokens.method(req, res),
                tokens.url(req, res),
                tokens.status(req, res),
                tokens['response-time'](req, res),
                'ms',
                contentLength && `- ${contentLength}`
            ].join(' ')
        }

        // Morgan stream for logging status codes less than 400
        app.use(
            expressLogging(morganLoggerFormat, {
                skip: function (req, res) {
                    return res.statusCode >= 400
                },
                stream: {
                    write: (message) => {
                        logger.info(message, {
                            namespace: 'httprequest'
                        })
                    }
                }
            })
        )

        // Morgan stream for logging status codes 400 and above
        app.use(
            expressLogging(morganLoggerFormat, {
                skip: function (req, res) {
                    return res.statusCode < 400
                },
                stream: {
                    write: (message) => {
                        logger.error(message, {
                            namespace: 'httprequest'
                        })
                    }
                }
            })
        )
    },

    /**
     * Passing the correlation Id from MRT to locals
     * @private
     */
    _setRequestId(app) {
        app.use((req, res, next) => {
            const correlationId = req.headers['x-correlation-id']
            const requestId = correlationId ? correlationId : req.headers['x-apigateway-event']
            if (!requestId) {
                logger.error('Both x-correlation-id and x-apigateway-event headers are missing', {
                    namespace: '_setRequestId'
                })
                next()
                return
            }
            res.locals.requestId = requestId
            next()
        })
    },

    /**
     * @private
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _setupMetricsFlushing(app) {
        // Hook for the dev-server
    },

    /**
     * @private
     */
    _updatePackageMobify(options) {
        updatePackageMobify(options.mobify)
    },

    /**
     * @private
     */
    _configureProxyConfigs(options) {
        configureProxyConfigs(options.appHostname, options.protocol)
    },

    /**
     * @private
     */
    _createApp(options) {
        options = this._configure(options)
        this._logStartupMessage(options)

        // To gain a small speed increase in the event that this
        // server needs to make a proxy request back to itself,
        // we kick off a DNS lookup for the appHostname. We don't
        // wait for it to complete, or care if it fails, so the
        // callback is a no-op.
        dns.lookup(options.appHostname, () => null)

        this._validateConfiguration(options)
        this._updatePackageMobify(options)
        this._configureProxyConfigs(options)

        const app = this._createExpressApp(options)

        // Do this first – we want compression applied to
        // everything when it's enabled at all.
        this._setCompression(app)
        this._setRequestId(app)
        // this._addEventContext(app)
        // Ordering of the next two calls are vital - we don't
        // want request-processors applied to development views.
        this._addSDKInternalHandlers(app)
        this._setupSSRRequestProcessorMiddleware(app)
        this._setForwardedHeaders(app, options)

        this._setupLogging(app)
        this._setupMetricsFlushing(app)
        this._setupHealthcheck(app)
        this._setupProxying(app, options)

        this._setupSlasPrivateClientProxy(app, options)

        // Beyond this point, we know that this is not a proxy request
        // and not a bundle request, so we can apply specific
        // processing.
        this._setupCommonMiddleware(app, options)

        this._addStaticAssetServing(app)
        this._addDevServerGarbageCollection(app)
        return app
    },

    /**
     * @private
     */
    _createExpressApp(options) {
        const app = express()
        app.disable('x-powered-by')

        const mixin = {
            options,

            _collectGarbage() {
                // Do global.gc in a separate 'then' handler so
                // that all major variables are out of scope and
                // eligible for garbage collection.

                /* istanbul ignore next */
                let gcTime = 0
                /* istanbul ignore next */
                if (global.gc) {
                    const start = Date.now()
                    global.gc()
                    gcTime = Date.now() - start
                }
                this.sendMetric('GCTime', gcTime, 'Milliseconds')
            },

            _requestMonitor: new RequestMonitor(),

            metrics: MetricsSender.getSender(),

            /**
             * Send a metric with fixed dimensions. See MetricsSender.send for more details.
             *
             * @private
             * @param name {String} metric name
             * @param [value] {Number} metric value (defaults to 1)
             * @param [unit] {String} defaults to 'Count'
             * @param [dimensions] {Object} optional extra dimensions
             */
            sendMetric(name, value = 1, unit = 'Count', dimensions) {
                this.metrics.send([
                    {
                        name,
                        value,
                        timestamp: Date.now(),
                        unit,
                        dimensions: Object.assign({}, dimensions || {}, METRIC_DIMENSIONS)
                    }
                ])
            },

            get applicationCache() {
                if (!this._applicationCache) {
                    this._applicationCache = new PersistentCache()
                }
                return this._applicationCache
            }
        }
        merge(app, mixin)
        return app
    },

    /**
     * @private
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _addSDKInternalHandlers(app) {
        // This method is used by the dev server, but is not needed here.
    },

    /**
     * Set x-forward-* headers into locals, this is primarily used to facilitate react sdk hook `useOrigin`
     * @private
     */
    _setForwardedHeaders(app, options) {
        app.use((req, res, next) => {
            const xForwardedHost = req.headers?.['x-forwarded-host']
            const xForwardedProto = req.headers?.['x-forwarded-proto']
            if (xForwardedHost) {
                // prettier-ignore
                res.locals.xForwardedOrigin = `${xForwardedProto || options.protocol}://${xForwardedHost}`
            }

            next()
        })
    },

    /**
     * @private
     */
    _setupSSRRequestProcessorMiddleware(app) {
        // Attach this middleware as early as possible. It does timing
        // and applies some early processing that must occur before
        // anything else.

        /**
         * Incoming request processing.
         *
         * For the local dev server, if there is a request processor, use it to
         * process all non-proxy, non-bundle requests, in the same way that
         * CloudFront will do for a deployed bundle.
         *
         * If there is an x-querystring header in the incoming request, use
         * that as the definitive querystring.
         *
         * @param req {express.req} the incoming request - modified in-place
         * @param res {express.res} the response object
         * @private
         */
        const processIncomingRequest = (req, res) => {
            const options = req.app.options
            // If the request is for a proxy or bundle path, do nothing
            if (this._isBundleOrProxyPath(req.originalUrl)) {
                return
            }

            // Apply the request processor
            // `this` is bound to the calling context, usually RemoteServerFactory
            const requestProcessor = this._getRequestProcessor(req)
            const parsed = URL.parse(req.url)
            const originalQuerystring = parsed.query
            let updatedQuerystring = originalQuerystring
            let updatedPath = req.path

            // If there's an x-querystring header, use that as the definitive
            // querystring. This header is used in production, not in local dev,
            // but we always handle it here to allow for testing.
            const xQueryString = req.headers[X_MOBIFY_QUERYSTRING]
            if (xQueryString) {
                updatedQuerystring = xQueryString
                // Hide the header from any other code
                delete req.headers[X_MOBIFY_QUERYSTRING]
            }

            if (requestProcessor) {
                // Allow the processor to handle this request. Because this code
                // runs only in the local development server, we intentionally do
                // not swallow errors - we want them to happen and show up on the
                // console because that's how developers can test the processor.
                const headers = new Headers(req.headers, 'http')

                const processed = requestProcessor.processRequest({
                    headers,
                    path: req.path,
                    querystring: updatedQuerystring,

                    getRequestClass: () => headers.getHeader(X_MOBIFY_REQUEST_CLASS),
                    setRequestClass: (value) => headers.setHeader(X_MOBIFY_REQUEST_CLASS, value),

                    // This matches the set of parameters passed in the
                    // Lambda@Edge context.
                    parameters: {
                        deployTarget: `${process.env.DEPLOY_TARGET || 'local'}`,
                        appHostname: options.appHostname,
                        proxyConfigs
                    }
                })

                // Aid debugging by checking the return value
                assert(
                    processed && 'path' in processed && 'querystring' in processed,
                    'Expected processRequest to return an object with ' +
                        '"path" and "querystring" properties, ' +
                        `but got ${JSON.stringify(processed, null, 2)}`
                )

                // Update the request.
                updatedQuerystring = processed.querystring
                updatedPath = processed.path

                if (headers.modified) {
                    req.headers = headers.toObject()
                }
            }

            // Update the request.
            if (updatedQuerystring !== originalQuerystring) {
                // Update the string in the parsed URL
                parsed.search = updatedQuerystring ? `?${updatedQuerystring}` : ''

                // Let Express re-parse the parameters
                if (updatedQuerystring) {
                    const queryStringParser = req.app.set('query parser fn')
                    req.query = queryStringParser(updatedQuerystring)
                } else {
                    req.query = {}
                }
            }

            parsed.pathname = updatedPath

            // This will update the request's URL with the new path
            // and querystring.
            req.url = URL.format(parsed)

            // Get the request class and store it for general use. We
            // must do this AFTER the request-processor, because that's
            // what may set the request class.
            res.locals.requestClass = req.headers[X_MOBIFY_REQUEST_CLASS]
        }

        const ssrRequestProcessorMiddleware = (req, res, next) => {
            const locals = res.locals
            locals.requestStart = Date.now()
            locals.afterResponseCalled = false
            locals.responseCaching = {}

            locals.originalUrl = req.originalUrl

            // Track this response
            req.app._requestMonitor._responseStarted(res)

            // If the path is /, we enforce that the only methods
            // allowed are GET, HEAD or OPTIONS. This is a restriction
            // imposed by API Gateway: we enforce it here so that the
            // local dev server has the same behaviour.
            if (req.path === '/' && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
                res.sendStatus(405)
                return
            }

            // Apply custom query parameter parsing.
            processIncomingRequest(req, res)

            const afterResponse = () => {
                /* istanbul ignore else */
                if (!locals.afterResponseCalled) {
                    locals.afterResponseCalled = true
                    // Emit timing unless the request is for a proxy
                    // or bundle path. We don't want to emit metrics
                    // for those requests. We test req.originalUrl
                    // because it is consistently available across
                    // different types of the 'req' object, and will
                    // always contain the original full path.
                    /* istanbul ignore else */
                    if (!this._isBundleOrProxyPath(req.originalUrl)) {
                        req.app.sendMetric(
                            'RequestTime',
                            Date.now() - locals.requestStart,
                            'Milliseconds'
                        )
                        // We count 4xx and 5xx as errors, everything else is
                        // a success. 404 is a special case.
                        let metricName = 'RequestSuccess'
                        if (res.statusCode === 404) {
                            metricName = 'RequestFailed404'
                        } else if (res.statusCode >= 400 && res.statusCode <= 499) {
                            metricName = 'RequestFailed400'
                        } else if (res.statusCode >= 500 && res.statusCode <= 599) {
                            metricName = 'RequestFailed500'
                        }
                        req.app.sendMetric(metricName)
                    }
                }
            }

            // Attach event listeners to the Response (we need to attach
            // both to handle all possible cases)
            res.on('finish', afterResponse)
            res.on('close', afterResponse)

            // Strip out API Gateway headers from the incoming request. We
            // do that now so that the rest of the code don't have to deal
            // with these headers, which can be large and may be accidentally
            // forwarded to other servers.
            X_HEADERS_TO_REMOVE_ORIGIN.forEach((key) => {
                delete req.headers[key]
            })

            // Hand off to the next middleware
            next()
        }

        app.use(ssrRequestProcessorMiddleware)
    },

    /**
     * @private
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _setupProxying(app, options) {
        app.all(`${proxyBasePath}/*`, (_, res) => {
            return res.status(501).json({
                message:
                    'Environment proxies are not set: https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/proxying-requests.html'
            })
        })
    },

    /**
     * @private
     */
    _handleMissingSlasPrivateEnvVar(app) {
        app.use(slasPrivateProxyPath, (_, res) => {
            return res.status(501).json({
                message:
                    'Environment variable PWA_KIT_SLAS_CLIENT_SECRET not set: Please set this environment variable to proceed.'
            })
        })
    },

    /**
     * @private
     */
    _setupSlasPrivateClientProxy(app, options) {
        if (!options.useSLASPrivateClient) {
            return
        }

        localDevLog(`Proxying ${slasPrivateProxyPath} to ${options.slasTarget}`)

        const clientId = options.mobify?.app?.commerceAPI?.parameters?.clientId
        const clientSecret = process.env.PWA_KIT_SLAS_CLIENT_SECRET
        if (!clientSecret) {
            this._handleMissingSlasPrivateEnvVar(app, slasPrivateProxyPath)
            return
        }

        const encodedSlasCredentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

        app.use(
            slasPrivateProxyPath,
            createProxyMiddleware({
                target: options.slasTarget,
                changeOrigin: true,
                pathRewrite: {[slasPrivateProxyPath]: ''},
                onProxyReq: (proxyRequest, incomingRequest) => {
                    applyProxyRequestHeaders({
                        proxyRequest,
                        incomingRequest,
                        proxyPath: slasPrivateProxyPath,
                        targetHost: options.slasHostName,
                        targetProtocol: 'https'
                    })

                    // We pattern match and add client secrets only to endpoints that
                    // match the regex specified by options.applySLASPrivateClientToEndpoints.
                    // By default, this regex matches only calls to SLAS /oauth2/token
                    // (see option defaults at the top of this file).
                    // Other SLAS endpoints, ie. SLAS authenticate (/oauth2/login) and
                    // SLAS logout (/oauth2/logout), use the Authorization header for a different
                    // purpose so we don't want to overwrite the header for those calls.
                    if (incomingRequest.path?.match(options.applySLASPrivateClientToEndpoints)) {
                        proxyRequest.setHeader('Authorization', `Basic ${encodedSlasCredentials}`)
                    }
                },
                onProxyRes: (proxyRes, req) => {
                    if (proxyRes.statusCode && proxyRes.statusCode >= 400) {
                        logger.error(
                            `Failed to proxy SLAS Private Client request - ${proxyRes.statusCode}`,
                            {
                                namespace: '_setupSlasPrivateClientProxy',
                                additionalProperties: {statusCode: proxyRes.statusCode}
                            }
                        )
                        logger.error(
                            `Please make sure you have enabled the SLAS Private Client Proxy in your ssr.js and set the correct environment variable PWA_KIT_SLAS_CLIENT_SECRET.`,
                            {namespace: '_setupSlasPrivateClientProxy'}
                        )
                        logger.error(
                            `SLAS Private Client Proxy Request URL - ${req.protocol}://${req.get(
                                'host'
                            )}${req.originalUrl}`,
                            {
                                namespace: '_setupSlasPrivateClientProxy',
                                additionalProperties: {
                                    protocol: req.protocol,
                                    originalUrl: req.originalUrl
                                }
                            }
                        )
                    }
                }
            })
        )
    },

    /**
     * @private
     */
    _setupHealthcheck(app) {
        app.get(`${healthCheckPath}`, (_, res) =>
            res.set('cache-control', NO_CACHE).sendStatus(200).end()
        )
    },

    /**
     * @private
     */
    _setupCommonMiddleware(app, options) {
        app.use(prepNonProxyRequest)

        // Apply the SSR middleware to any subsequent routes that we expect users
        // to add in their projects, like in any regular Express app.
        app.use(ssrMiddleware)
        app.use(errorHandlerMiddleware)

        if (options?.encodeNonAsciiHttpHeaders) {
            app.use(encodeNonAsciiMiddleware)
        }

        applyPatches(options)
    },

    /**
     * @private
     */
    _validateConfiguration(options) {
        // Check that we are running under a compatible version of node
        /* istanbul ignore next */
        const requiredNode = new semver.Range(pkg.engines.node)
        /* istanbul ignore next */
        if (
            !semver.satisfies(
                process.versions.node, // A string like '8.10.0'
                requiredNode
            )
        ) {
            /* istanbul ignore next */
            console.warn(
                `Warning: You are using Node ${process.versions.node}. ` +
                    `Your app may not work as expected when deployed to Managed ` +
                    `Runtime servers which are compatible with Node ${requiredNode}`
            )
        }

        // Verify the remote environment
        if (isRemote()) {
            const notFound = []
            REMOTE_REQUIRED_ENV_VARS.forEach((envVar) => {
                if (!process.env[envVar]) {
                    notFound.push(envVar)
                }
            })
            if (notFound.length) {
                throw new Error(
                    `SSR server cannot initialize: missing environment values: ${notFound.join(
                        ', '
                    )}`
                )
            }
        }

        if (['http', 'https'].indexOf(options.protocol) < 0) {
            throw new Error(
                `Invalid local development server protocol ${options.protocol}. ` +
                    `Valid protocols are http and https.`
            )
        }

        if (!options.buildDir) {
            throw new Error(
                'The buildDir option passed to the SSR server must be a non-empty string'
            )
        }

        // Fix up the path in case we were passed a relative one
        options.buildDir = path.resolve(process.cwd(), options.buildDir)

        if (!(options.mobify instanceof Object)) {
            throw new Error('The mobify option passed to the SSR server must be an object')
        }

        const {sslFilePath} = options
        if (
            !isRemote() &&
            sslFilePath &&
            (!sslFilePath.endsWith('.pem') || !fs.existsSync(sslFilePath))
        ) {
            throw new Error(
                'The sslFilePath option passed to the SSR server constructor ' +
                    'must be a path to an SSL certificate file ' +
                    'in PEM format, whose name ends with ".pem". ' +
                    'See the "cert" and "key" options on ' +
                    'https://nodejs.org/api/tls.html#tls_tls_createsecurecontext_options'
            )
        }

        if (!options.strictSSL) {
            console.warn('The SSR Server has _strictSSL turned off for https requests')
        }
    },

    /**
     * @private
     */
    _addStaticAssetServing() {
        // Handled by the CDN on remote
    },

    /**
     * @private
     */
    _addDevServerGarbageCollection() {
        // This is a hook for the dev-server. The remote-server
        // does GC in a way that is awkward to extract. See _createHandler.
    },

    /**
     * Serve the service worker at `req.path`
     *
     * For best results, serve the service worker at the root of the site and
     * it must not be a redirect. We set a long value for s-maxage (to allow CDN
     * caching), plus a strong etag (for CDN-only revalidation), and to set
     * maxage to 0 to prevent browser caching.
     *
     * See https://developer.chrome.com/blog/fresher-sw/ for details on
     * efficiently serving service workers.
     *
     */
    serveServiceWorker(req, res) {
        const options = req.app.options
        // We apply this cache-control to all responses (200 and 404)
        res.set(
            CACHE_CONTROL,
            // The CDN can cache for 24 hours. The browser may not cache
            // the file.
            's-maxage=86400, max-age=0'
        )

        const workerFilePath = path.join(options.buildDir, req.path)

        // If there is no file, send a 404
        if (!fs.existsSync(workerFilePath)) {
            res.status(404).send()
            return
        }

        const content = fs.readFileSync(workerFilePath, {encoding: 'utf8'})

        // Serve the file, with a strong ETag
        res.set('etag', getHashForString(content))
        res.set(CONTENT_TYPE, 'application/javascript')
        res.send(content)
    },

    /**
     * Serve static files from the app's build directory and set default
     * cache-control headers.
     * @since v2.0.0
     *
     * @param {String} filePath - the location of the static file relative to the build directory
     * @param {Object} opts - the options object to pass to the original `sendFile` method
     */
    serveStaticFile(filePath, opts = {}) {
        return (req, res) => {
            const baseDir = req.app.options.buildDir
            return this._serveStaticFile(req, res, baseDir, filePath, opts)
        }
    },

    /**
     * @private
     */
    _serveStaticFile(req, res, baseDir, filePath, opts = {}) {
        const options = req.app.options
        const file = path.resolve(baseDir, filePath)
        res.sendFile(file, {
            headers: {
                [CACHE_CONTROL]: options.defaultCacheControl
            },
            ...opts
        })
    },

    /**
     * Server side rendering entry.
     *
     * @since v2.0.0
     *
     * This is a wrapper around the Express `res.sendFile` method.
     *
     * @param {Object} req - the req object
     * @param {Object} req - the res object
     * @param {function} next - the callback function for middleware chain
     */
    render(req, res, next) {
        const app = req.app
        if (!app.__renderer) {
            // See - https://www.npmjs.com/package/webpack-hot-server-middleware#usage
            const {buildDir} = app.options
            const _require = eval('require')
            const serverRenderer = _require(path.join(buildDir, 'server-renderer.js')).default
            const stats = _require(path.join(buildDir, 'loadable-stats.json'))
            app.__renderer = serverRenderer(stats)
        }
        app.__renderer(req, res, next)
    },

    /**
     * Builds a Lambda handler function from an Express app.
     *
     * See: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-handler.html
     *
     * @param app {Express} - an Express App
     * @private
     */
    _createHandler(app, options) {
        // This flag is initially false, and is set true on the first request
        // handled by a Lambda. If it is true on entry to the handler function,
        // it indicates that the Lambda container has been reused.
        let lambdaContainerReused = false

        const server = awsServerlessExpress.createServer(app, null, binaryMimeTypes)

        const handler = (event, context, callback) => {
            // encode non ASCII request headers
            if (options?.encodeNonAsciiHttpHeaders) {
                Object.keys(event.headers).forEach((key) => {
                    if (!isASCII(event.headers[key])) {
                        event.headers[key] = encodeURIComponent(event.headers[key])
                        // x-encoded-headers keeps track of which headers have been modified and encoded
                        if (event.headers[X_ENCODED_HEADERS]) {
                            // append header key
                            event.headers[
                                X_ENCODED_HEADERS
                            ] = `${event.headers[X_ENCODED_HEADERS]},${key}`
                        } else {
                            event.headers[X_ENCODED_HEADERS] = key
                        }
                    }
                })
            }

            // We don't want to wait for an empty event loop once the response
            // has been sent. Setting this to false will "send the response
            // right away when the callback executes", but any pending events
            // may be executed if the Lambda container is then reused for
            // another invocation (which we expect will happen under all
            // but very low load). This means two things:
            // 1. Any code that we have *after* the callback MAY be executed
            // if the Lambda container is reused, but there's no guarantee
            // it will be.
            // 2. There is no way to have code do cleanup work (such as sending
            // metrics) after the response is sent to the browser. We have
            // to accept that doing such work delays the response.
            // It would be good if we could set this to true and do work like sending
            // metrics after calling the callback, but that doesn't work - API Gateway
            // will wait for the Lambda invocation to complete before sending
            // the response to the browser.
            context.callbackWaitsForEmptyEventLoop = false

            if (lambdaContainerReused) {
                // DESKTOP-434 If this Lambda container is being reused,
                // clean up memory now, so that we start with low usage.
                // These regular GC calls take about 80-100 mS each, as opposed
                // to forced GC calls, which occur randomly and can take several
                // hundred mS.
                app._collectGarbage()
                app.sendMetric('LambdaReused')
            } else {
                // This is the first use of this container, so set the
                // reused flag for next time.
                lambdaContainerReused = true
                app.sendMetric('LambdaCreated')
            }

            // Proxy the request through to the server. When the response
            // is done, context.succeed will be called with the response
            // data.
            awsServerlessExpress.proxy(
                server,
                event, // The incoming event
                context, // The event context
                'CALLBACK', // How the proxy signals completion
                (err, response) => {
                    // The 'response' parameter here is NOT the same response
                    // object handled by ExpressJS code. The awsServerlessExpress
                    // middleware works by sending an http.Request to the Express
                    // server and parsing the HTTP response that it returns.
                    // Wait util all pending metrics have been sent, and any pending
                    // response caching to complete. We have to do this now, before
                    // sending the response; there's no way to do it afterwards
                    // because the Lambda container is frozen inside the callback.

                    // We return this Promise, but the awsServerlessExpress object
                    // doesn't make any use of it.
                    return (
                        app._requestMonitor
                            ._waitForResponses()
                            .then(() => app.metrics.flush())
                            // Now call the Lambda callback to complete the response
                            .then(() => callback(err, processLambdaResponse(response, event)))
                        // DON'T add any then() handlers here, after the callback.
                        // They won't be called after the response is sent, but they
                        // *might* be called if the Lambda container running this code
                        // is reused, which can lead to odd and unpredictable
                        // behaviour.
                    )
                }
            )
        }
        return {handler, server, app}
    },

    /**
     * Create an SSR (Server-Side Rendering) Server.
     *
     * @constructor
     * @param {Object} options
     * @param {String} [options.buildDir] - The build directory path, either as an
     * absolute path, or relative to the current working directory. Defaults
     * to 'build'.
     * @param {Number} [options.defaultCacheTimeSeconds=600] - The cache time
     * for rendered pages and assets (not used in local development mode).
     * @param {Object} options.mobify - The 'mobify' object from the project's
     * package.json file, containing the SSR parameters.
     * @param {Number} [options.port=3443] - the localhost port on which the local
     * development Express app listens.
     * @param {String} [options.protocol='https'] - the protocol on which the development
     * Express app listens.
     * @param {Boolean} [options.proxyKeepAliveAgent] - This boolean value indicates
     * whether or not we are using a keep alive agent for proxy connections. Defaults
     * to 'true'. NOTE: This keep alive agent will only be used on remote.
     * @param {String} options.sslFilePath - the absolute path to a PEM format
     * certificate file to be used by the local development server. This should
     * contain both the certificate and the private key.
     * @param {function} customizeApp - a callback that takes an express app
     * as an argument. Use this to customize the server.
     * @param {Boolean} [options.allowCookies] - This boolean value indicates
     * whether or not we strip cookies from requests and block setting of cookies. Defaults
     * to 'false'.
     */
    createHandler(options, customizeApp) {
        process.on('unhandledRejection', catchAndLog)
        const app = this._createApp(options)
        customizeApp(app, options)
        return this._createHandler(app, options)
    },

    /**
     * @private
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _getRequestProcessor(req) {
        return null
    }
}

/**
 * ExpressJS middleware that processes any non-proxy request passing
 * through the Express app.
 *
 * If allowCookies is false, strips Cookie headers from incoming requests, and
 * configures the Response so that it cannot have cookies set on it.
 *
 * Sets the Host header to the application host.
 * If there's an Origin header, rewrites it to be the application
 * Origin.
 *
 * This function should not be called for proxied requests, which
 * MAY allow use of cookies.
 *
 * @private
 */
const prepNonProxyRequest = (req, res, next) => {
    const options = req.app.options
    if (!options.allowCookies) {
        // Strip cookies from the request
        delete req.headers.cookie
        // In an Express Response, all cookie setting ends up
        // calling setHeader, so we override that to allow us
        // to intercept and discard cookie setting.
        const setHeader = Object.getPrototypeOf(res).setHeader
        const remote = isRemote()
        res.setHeader = function (header, value) {
            /* istanbul ignore else */
            if (header && header.toLowerCase() !== SET_COOKIE && value) {
                setHeader.call(this, header, value)
            } /* istanbul ignore else */ else if (!remote) {
                logger.warn(
                    `Req ${res.locals.requestId}: ` +
                        `Cookies cannot be set on responses sent from ` +
                        `the SSR Server. Discarding "Set-Cookie: ${value}"`,
                    {
                        namespace: 'RemoteServerFactory.prepNonProxyRequest'
                    }
                )
            }
        }
    }

    // Set the Host header
    req.headers.host = options.appHostname

    // Replace any Origin header
    if (req.headers.origin) {
        req.headers.origin = options.appOrigin
    }

    next()
}

/**
 * Express Middleware applied to requests that require rendering of a response.
 *
 * @private
 */
const ssrMiddleware = (req, res, next) => {
    setDefaultHeaders(req, res)
    const renderStartTime = Date.now()

    const done = () => {
        const elapsedRenderTime = Date.now() - renderStartTime
        req.app.sendMetric('RenderTime', elapsedRenderTime, 'Milliseconds')
    }

    res.on('finish', done)
    res.on('close', done)
    next()
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorHandlerMiddleware = (err, req, res, next) => {
    catchAndLog(err)
    req.app.sendMetric('RenderErrors')
    res.sendStatus(500)
}

/**
 * Helper function that checks if a string is composed of ASCII characters
 * We only check printable ASCII characters and not special ASCII characters
 * such as NULL
 *
 * @private
 */
const isASCII = (str) => {
    return /^[\x20-\x7E]*$/.test(str)
}

/**
 * Express Middleware applied to responses that encode any non ASCII headers
 *
 * @private
 */
const encodeNonAsciiMiddleware = (req, res, next) => {
    const originalSetHeader = res.setHeader

    res.setHeader = function (key, value) {
        if (!isASCII(value)) {
            originalSetHeader.call(this, key, encodeURIComponent(value))

            let encodedHeaders = res.getHeader(X_ENCODED_HEADERS)
            encodedHeaders = encodedHeaders ? `${encodedHeaders},${key}` : key
            originalSetHeader.call(this, X_ENCODED_HEADERS, encodedHeaders)
        } else {
            originalSetHeader.call(this, key, value)
        }
    }

    next()
}

/**
 * Wrap the function fn in such a way that it will be called at most once. Subsequent
 * calls will always return the same value.
 *
 * @private
 */
export const once = (fn) => {
    let result
    return (...args) => {
        if (fn) {
            result = fn(...args)
            fn = null
        }
        return result
    }
}

const applyPatches = once((options) => {
    // If we're running remotely, we also override the send()
    // method for ExpressJS's Response class (which is actually
    // a function). See responseSend for details.
    if (isRemote()) {
        // http.ServerResponse.prototype
        const expressResponse = express.response
        expressResponse.send = responseSend(expressResponse.send)
    }

    // Patch the http.request/get and https.request/get
    // functions to allow us to intercept them (since
    // there are multiple ways to make requests in Node).
    http.request = outgoingRequestHook(http.request, options)
    http.get = outgoingRequestHook(http.get, options)
    https.request = outgoingRequestHook(https.request, options)
    https.get = outgoingRequestHook(https.get, options)

    // Patch the ExpressJS Response class's redirect function to suppress
    // the creation of a body (DESKTOP-485). Including the body may
    // trigger a parsing error in aws-serverless-express.
    express.response.redirect = function (status, url) {
        let workingStatus = status
        let workingUrl = url

        if (typeof status === 'string') {
            workingUrl = status
            workingStatus = 302
        }

        // Duplicate behaviour in node_modules/express/lib/response.js
        const address = this.location(workingUrl).get('Location')

        // Send a minimal response with just a status and location
        this.status(workingStatus).location(address).end()
    }

    // Patch the whatwg-encoding decode function so that it will accept plain
    // JS strings and return them as-is.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const whatWGEncoding = require('whatwg-encoding')
    const originalDecode = whatWGEncoding.decode
    whatWGEncoding.decode = (buffer, fallbackEncodingName) => {
        /* istanbul ignore else */
        if (typeof buffer === 'string') {
            return buffer
        }
        /* istanbul ignore next */
        return originalDecode(buffer, fallbackEncodingName)
    }

    // The 'http-proxy-middleware' module pollutes global by adding a lodash
    // reference to it as '_' (this global reference is not used). We kill
    // that reference here because otherwise it can hold on to references
    // to other objects.
    /* istanbul ignore next */
    if (global._) {
        delete global._
    }
})

/**
 * Set default headers on a response. The arguments to this function
 * are the same as those for the responseHook function.
 *
 * @private
 */
const setDefaultHeaders = (req, res) => {
    const requestClass = res.locals.requestClass
    if (requestClass) {
        res.set(X_MOBIFY_REQUEST_CLASS, requestClass)
    }
}

/**
 * Tracks in-flight requests.
 *
 * @private
 */
class RequestMonitor {
    constructor() {
        this._pendingResponses = {
            ids: [],
            promise: null,
            resolve: null
        }
    }
    /**
     * Returns a Promise that wil resolve when the server has completed
     * handling of any current requests. If the server is idle, returns
     * a Promise that is already resolved.
     *
     * This method is safe to use at any point. If there are any responses
     * in progress when it's called, then the returned Promise will not
     * resolve until all responses complete, even if those responses start
     * after this method is called.
     *
     * @private
     * @returns {Promise}
     */
    _waitForResponses() {
        const pending = this._pendingResponses
        if (pending.ids.length === 0) {
            return RESOLVED_PROMISE
        }
        if (!pending.promise) {
            pending.promise = new Promise((resolve) => {
                pending.resolve = resolve
            })
        }
        return pending.promise
    }

    /**
     * Works with waitForCompletion: when invoked by the initial request
     * handler, adds the id of the response to the set of pending ids.
     * @param res {express.response} the response that has started
     * @private
     */
    _responseStarted(res) {
        this._pendingResponses.ids.push(res.locals.requestId)
        const finish = () => this._responseFinished(res)
        // We hook both the 'finished' and 'close' events, so that
        // we properly complete any responses that fail (in which case
        // 'close' will fire, but 'finish' may not).
        res.once('finish', finish)
        res.once('close', finish)
    }

    /**
     * Works with waitForCompletion: when invoked by the 'finish' event of
     * any response, removes the response from the list of those pending
     * (using the id, so that multiple calls to this method will work
     * correctly). If there are no more responses pending, resolves any
     * Promise that is waiting for responses to complete.
     * @param res {express.response} the response that has finished
     * @private
     */
    _responseFinished(res) {
        const pending = this._pendingResponses
        if (pending.ids.length) {
            const requestId = res.locals.requestId
            pending.ids = pending.ids.filter((id) => id !== requestId)
            if (pending.ids.length === 0 && pending.resolve) {
                pending.resolve()
                pending.resolve = pending.promise = null
            }
        }
    }
}
