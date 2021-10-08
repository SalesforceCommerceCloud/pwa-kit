/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/**
 * @module progressive-web-sdk/ssr/server/express
 */

import assert from 'assert'
import dns from 'dns'
import http from 'http'
import https from 'https'
import fs from 'fs'
import path from 'path'

import awsServerlessExpress from 'aws-serverless-express'
import bodyParser from 'body-parser'
import compression from 'compression'
import express from 'express'
import mimeTypes from 'mime-types'
import expressLogging from 'morgan'
import pkg from '../../../package.json'
import semver from 'semver'
import URL from 'url'
import merge from 'merge-descriptors'
import {PersistentCache} from '../../utils/ssr-cache'

import {
    CachedResponse,
    catchAndLog,
    configureProxyConfigs,
    getHashForString,
    getBundleBaseUrl,
    isQuiet,
    localDevLog,
    MetricsSender,
    outgoingRequestHook,
    parseCacheControl,
    parseEndParameters,
    PerformanceTimer,
    processLambdaResponse,
    responseSend,
    setQuiet,
    isRemote,
    shouldCompress,
    wrapResponseWrite,
    detectDeviceType
} from '../../utils/ssr-server'
import {proxyConfigs, updatePackageMobify} from '../../utils/ssr-shared'

import {
    BUILD,
    CONTENT_ENCODING,
    CONTENT_TYPE,
    X_MOBIFY_QUERYSTRING,
    X_MOBIFY_FROM_CACHE
} from '../../ssr/server/constants'

import {
    Headers,
    parseHost,
    X_HEADERS_TO_REMOVE,
    X_MOBIFY_REQUEST_CLASS
} from '../../utils/ssr-proxying'

const SET_COOKIE = 'set-cookie'

const CACHE_CONTROL = 'cache-control'
export const NO_CACHE = 'max-age=0, nocache, nostore, must-revalidate'

// Resolved promise const
export const RESOLVED_PROMISE = Promise.resolve()

const METRIC_DIMENSIONS = {
    Project: process.env.MOBIFY_PROPERTY_ID,
    Target: process.env.DEPLOY_TARGET
}

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
 * @param {String} options.faviconPath - The path to the favicon.ico file,
 * either as an absolute path, or relative to the build directory. If this
 * value is not supplied, requests for a favicon will return a 404 and
 * log a warning to the console.
 * @param {Object} options.mobify - The 'mobify' object from the project's
 * package.json file, containing the SSR parameters.
 * @param {Number} [options.port=3443] - the localhost port on which the local
 * development Express app listens.
 * @param {String} [options.protocol='https'] - the protocol on which the development
 * Express app listens.
 * @param {String} options.sslFilePath - the absolute path to a PEM format
 * certificate file to be used by the local development server. This should
 * contain both the certificate and the private key.
 */

export const createApp = (options) => {
    /**
     * Not all of these options are documented. Some exist to allow for
     * testing, or to handle non-standard projects.
     */
    const defaults = {
        // Absolute path to the build directory
        buildDir: path.resolve(process.cwd(), BUILD),

        // The cache time for SSR'd pages (defaults to 600 seconds)
        defaultCacheTimeSeconds: 600,

        // The port that the local dev server listens on
        port: 3443,

        // The protocol that the local dev server listens on
        protocol: 'https',

        // Quiet flag (suppresses output if true)
        quiet: false,

        // Suppress SSL checks - can be used for local dev server
        // test code. Undocumented at present because there should
        // be no use-case for SDK users to set this.
        strictSSL: true
    }

    // Build the options, filling in default values
    options = Object.assign({}, defaults, options)

    setQuiet(options.quiet || process.env.SSR_QUIET)

    // Set the protocol for the Express app listener - defaults to https on remote
    options.protocol = isRemote() ? 'https' : process.env.DEV_SERVER_PROTOCOL || options.protocol

    validateConfiguration(options)

    // Local dev server doesn't cache by default
    options.defaultCacheControl = isRemote()
        ? `max-age=${options.defaultCacheTimeSeconds}, s-maxage=${options.defaultCacheTimeSeconds}`
        : NO_CACHE

    // Ensure this is a boolean, and is always true for a remote server.
    options.strictSSL = !!(isRemote() || options.strictSSL)
    if (!options.strictSSL) {
        console.warn('The SSR Server has strictSSL turned off for https requests')
    }

    // This is the external HOSTNAME under which we are serving the page.
    // The EXTERNAL_DOMAIN_NAME value technically only applies to remote
    // operation, but we allow it to be used for a local dev server also.
    options.appHostname = process.env.EXTERNAL_DOMAIN_NAME || `localhost:${options.port}`

    // To gain a small speed increase in the event that this
    // server needs to make a proxy request back to itself,
    // we kick off a DNS lookup for the appHostname. We don't
    // wait for it to complete, or care if it fails, so the
    // callback is a no-op.
    dns.lookup(options.appHostname, () => null)

    // This is the ORIGIN under which we are serving the page.
    // because it's an origin, it does not end with a slash.
    options.appOrigin = process.env.APP_ORIGIN = `${options.protocol}://${options.appHostname}`

    // Configure the server with the basic options
    updatePackageMobify(options.mobify)

    // Set up the proxies
    configureProxyConfigs(options.appHostname, options.protocol)

    const app = createExpressApp(options)

    // Attach built in routes and middleware

    // Attach this middleware as early as possible. It does timing
    // and applies some early processing that must occur before
    // anything else.
    app.use(ssrRequestProcessorMiddleware)

    if (!isRemote()) {
        // For local dev, we compress responses (for remote, we let the
        // CDN do it).
        app.use(
            compression({
                level: 9,
                filter: shouldCompress
            })
        )

        // Configure logging
        if (!isQuiet()) {
            app.use(
                expressLogging(
                    ':method :url :status :response-time ms - :res[content-length] :res[content-type]'
                )
            )
        }

        // Proxy bundle asset requests to the local
        // build directory.
        app.use(
            '/mobify/bundle/development',
            express.static(options.buildDir, {
                dotFiles: 'deny',
                setHeaders: setLocalAssetHeaders,
                fallthrough: false
            })
        )

        // Flush metrics at the end of sending. We do this here to
        // keep the code paths consistent between local and remote
        // servers. For the remote server, the flushing is done
        // by the Lambda integration.
        app.use((req, res, next) => {
            res.on('finish', () => app.metrics.flush())
            next()
        })
    }

    // The /mobify/ping path provides a very fast and lightweight
    // healthcheck response.
    app.get('/mobify/ping', (req, res) =>
        res
            .set('cache-control', NO_CACHE)
            .sendStatus(200)
            .end()
    )

    // Both local and remote modes can perform proxying. A remote
    // server usually only does proxying for development deployments
    // that use a VPC. In production, the CDN will usually handle it,
    // but there are exceptions to that rule.
    proxyConfigs.forEach((config) => {
        // Standard proxy
        app.use(config.proxyPath, config.proxy)

        // Caching proxy
        app.use(config.cachingPath, config.cachingProxy)
    })

    // Beyond this point, we know that this is not a proxy request
    // and not a bundle request, so we can apply specific
    // processing.
    app.use(prepNonProxyRequest)

    // Serve this asset directly (in both remote and local modes)
    app.get('/worker.js*', serveServiceWorker)

    // Any path
    const rootWildcard = '/*'

    // Because the app can accept POST requests, we need to include body-parser middleware.
    app.post(rootWildcard, [
        // application/json
        bodyParser.json(),
        // text/plain (defaults to utf-8)
        bodyParser.text(),
        // */x-www-form-urlencoded
        bodyParser.urlencoded({
            extended: true,
            type: '*/x-www-form-urlencoded'
        })
    ])

    // Map favicon requests to the configured path. We always map
    // this route, because if there's no favicon configured we want
    // to return a 404.
    app.get('/favicon.ico', serveFavicon)

    // Apply the SSR middleware to any subsequent routes that we expect users
    // to add in their projects, like in any regular Express app.
    app.use(ssrMiddleware)
    app.use(errorHandlerMiddleware)

    applyPatches(options)

    return app
}

/**
 * Validate options and environment variables.
 *
 * @private
 */
const validateConfiguration = (options) => {
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
                `Your app may not work as expected when deployed to Mobify's ` +
                `servers which are compatible with Node ${requiredNode}`
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
                `SSR server cannot initialize: missing environment values: ${notFound.join(', ')}`
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
            'The buildDir option passed to the SSR server ' + 'must be a non-empty string'
        )
    }

    // Fix up the path in case we were passed a relative one
    options.buildDir = path.resolve(process.cwd(), options.buildDir)
    if (!fs.existsSync(options.buildDir)) {
        throw new Error(`The build directory ${options.buildDir} was not found`)
    }

    if (options.faviconPath) {
        options.faviconPath = path.resolve(options.buildDir, options.faviconPath)
        if (!fs.existsSync(options.faviconPath)) {
            console.warn(`Favicon file ${options.faviconPath} not found`)
            options.faviconPath = undefined
        }
    }

    if (!(options.mobify instanceof Object)) {
        throw new Error(
            'The mobify option passed to the SSR server must be an object (from package.json)'
        )
    }

    const {sslFilePath} = options
    if (
        !isRemote() &&
        (sslFilePath && (!sslFilePath.endsWith('.pem') || !fs.existsSync(sslFilePath)))
    ) {
        throw new Error(
            'The sslFilePath option passed to the SSR server constructor ' +
                'must be a path to an SSL certificate file ' +
                'in PEM format, whose name ends with ".pem". ' +
                'See the "cert" and "key" options on ' +
                'https://nodejs.org/api/tls.html#tls_tls_createsecurecontext_options'
        )
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

/**
 * Use properties of the request, such as URL and querystring, to generate
 * a cache key string suitable for passing to sendResponseFromCache or
 * storeResponseInCache.
 *
 * This method is provided as a convenience: you do not have to use it,
 * but it should cover the most common use cases. It is the default
 * cache key generator used by sendResponseFromCache and
 * storeResponseInCache. If you override the cache key function
 * in the options for storeResponseInCache, you may call this function
 * and then further modify the returned key.
 *
 * The cache key is based on the request's path (case-independent) and
 * querystring (case-dependent). The order of parameters in the querystring
 * is important: if the order changes, the cache key changes. This is done
 * because the order of query parameters is important for some systems.
 *
 * To allow for simple extension of the default algorithm, the optional
 * 'options.extras' parameter may be used to pass an array of strings that
 * will also be used (in the order they are passed) to build the key.
 * Undefined values are allowed in the extras array.
 *
 * By default, the key generation does NOT consider the Accept,
 * Accept-Charset or Accept-Language request header values. If it's
 * appropriate to include these, the caller should add their values
 * (or values based on them) to the options.extras array.
 *
 * Requests that come to a deployed Express app contain headers that
 * identify the device type. By default, this method generates different
 * cache keys for different device types (effectively, the values of the
 * headers used by getBrowserSize are included in 'options.extras'). To
 * suppress this, pass true for options.ignoreDeviceType
 * Note: CloudFront will pass 4 device type headers, and ALL of them will
 * be present in the request headers, they are 'CloudFront-Is-Desktop-Viewer',
 * 'CloudFront-Is-Mobile-Viewer', 'CloudFront-Is-SmartTV-Viewer' and
 * 'CloudFront-Is-Tablet-Viewer'. The values can be 'true' or 'false', and it
 * is possible that a device falls into more than one device type category
 * and multiple device type headers can be 'true' at the same time.
 *
 * By default, method will generate different cache keys for requests with
 * different request classes (effectively, the value of the request-class
 * string is included in 'extras'). To suppress this, pass true for
 * options.ignoreRequestClass
 *
 * @param req {IncomingMessage} the request to generate the key for.
 * @param [options] {Object} values that affect the cache key generation.
 * @param [options.extras] {Array<String|undefined>} extra string values
 * to be included in the key.
 * @param [options.ignoreDeviceType] {Boolean} set this to true to suppress
 * automatic variation of the key by device type.
 * @param [options.ignoreRequestClass] {Boolean} set this to true to suppress
 * automatic variation of the key by request class.
 * @returns {String} the generated key.
 *
 * @private
 */
export const generateCacheKey = (req, options = {}) => {
    let {pathname, query} = URL.parse(req.url)

    // remove the trailing slash
    if (pathname.charAt(pathname.length - 1) === '/') {
        pathname = pathname.substring(0, pathname.length - 1)
    }

    const elements = []

    if (query) {
        const filteredQueryStrings = query
            .split('&')
            .filter((querystring) => !/^mobify_devicetype=/.test(querystring))
        elements.push(...filteredQueryStrings)
    }

    if (!options.ignoreDeviceType) {
        elements.push(`device=${detectDeviceType(req)}`)
    }

    if (!options.ignoreRequestClass) {
        const requestClass = req.get(X_MOBIFY_REQUEST_CLASS)
        if (requestClass) {
            elements.push(`class=${requestClass}`)
        }
    }

    if (options.extras) {
        options.extras.forEach((extra, index) => elements.push(`ex${index}=${extra}`))
    }

    return pathname.toLowerCase() + '/' + getHashForString(elements.join('-'))
}

/**
 * Internal handler that is called on completion of a response
 * that is to be cached.
 *
 * @param req {http.IncomingMessage} the request
 * @param res {http.ServerResponse} the response
 * @returns {Promise} resolved when caching is done (also
 * stored in locals.responseCaching.promise
 * @private
 */
const storeResponseInCache = (req, res) => {
    const locals = res.locals
    const caching = locals.responseCaching

    const metadata = {
        status: res.statusCode,
        headers: res.getHeaders()
    }

    // ADN-118 When the response is created, we intercept the data
    // as it's written, and store it so that we can cache it here.
    // However, ExpressJS will apply compression *after* we store
    // the data, but will add a content-encoding header *before*
    // this method is called. If we store the headers unchanged,
    // we'll cache a response with an uncompressed body, but
    // a content-encoding header. We therefore remove the content-
    // encoding at this point, so that the response is stored
    // in a consistent way.
    // The exception is if the contentEncodingSet flag is set on
    // the response. If it's truthy, then project code set a
    // content-encoding before the Express compression code was
    // called; in that case, we must leave the content-encoding
    // unchanged.
    if (!locals.contentEncodingSet) {
        delete metadata.headers[CONTENT_ENCODING]
    }

    const cacheControl = parseCacheControl(res.get('cache-control'))
    const expiration = parseInt(
        caching.expiration || cacheControl['s-maxage'] || cacheControl['max-age'] || 7 * 24 * 3600
    )

    // Return a Promise that will be resolved when caching is complete.
    let dataToCache
    /* istanbul ignore else */
    if (caching.chunks.length) {
        // Concat the body into a single buffer.\
        // caching.chunks will be an Array of Buffer
        // values, and may be empty.
        dataToCache = Buffer.concat(caching.chunks)
    }
    return (
        req.app.applicationCache
            .put({
                key: caching.cacheKey,
                namespace: caching.cacheNamespace,
                data: dataToCache,
                metadata,
                expiration: expiration * 1000 // in mS
            })
            // If an error occurs,we don't want to prevent the
            // response being sent, so we just log.
            .catch((err) => {
                console.warn(`Unexpected error in cache put: ${err}`)
            })
    )
}

/**
 * Configure a response so that it will be cached when it has been sent.
 * Caching ExpressJS responses requires intercepting of all the header
 * and body setting calls on it, which may occur at any point in the
 * response lifecycle, so this call must be made before the response
 * is generated.
 *
 * If no key is provided, it's generated by generateCacheKey.
 * Project code may call generateCacheKey with extra options to affect
 * the key, or may use custom key generation logic. If code has
 * previously called getResponseFromCache, the key and namespace are
 * available as properties on the CachedResponse instance returned
 * from that method.
 *
 * When caching response, the cache expiration time is set by
 * the expiration parameter. The cache expiration time may be
 * different to the response expiration time as set by the cache-control
 * header. See the documentation for the 'expiration' parameter for
 * details.
 *
 * @param req {express.request}
 * @param res {express.response}
 * @param [expiration] {Number} the number of seconds
 * that a cached response should persist in the cache. If this is
 * not provided, then the expiration time is taken from the
 * Cache-Control header; the s-maxage value is used if available,
 * then the max-age value. If no value can be found in the
 * Cache-Control header, the default expiration time is
 * one week.
 * @param [key] {String} the key to use - if this is not supplied,
 * generateCacheKey will be called to derive the key.
 * @param [namespace] {String|undefined} the cache namespace to use.
 * @param [shouldCacheResponse] {Function} an optional callback that is passed a
 * Response after it has been sent but immediately before it is stored in
 * the cache, and can control whether or not caching actually takes place.
 * The function takes the request and response as parameters and should
 * return true if the response should be cached, false if not.
 * @private
 */
export const cacheResponseWhenDone = ({
    req,
    res,
    expiration,
    key,
    namespace,
    shouldCacheResponse
}) => {
    const locals = res.locals
    const caching = locals.responseCaching

    // If we have a key passed in, use that.
    // If we have a key already generated by getResponseFromCache, use that.
    // Otherwise generate the key from the request
    /* istanbul ignore next */
    caching.cacheKey = key || caching.cacheKey || generateCacheKey(req)

    // Save values that will be needed when we store the response
    caching.cacheNamespace = namespace
    caching.expiration = expiration

    // Set a flag that we use to detect a double call to end().
    // Because we delay the actual call to end() until after
    // caching is complete, we also delay when the response's 'finished'
    // flag becomes true, and when the 'finished' event is emitted.
    // This means that code may call end() more than once. We need
    // to ignore any second call.
    caching.endCalled = false

    /*
     Headers can be retrieved at any point, so there's no need to
     intercept them. They're still present after the response ends
     (contrary to some StackOverflow responses).
     The response body can be sent in multiple chunks, at any time,
     so we need a way to store references to those chunks so that
     we can access the whole body to store it in the cache.
     We patch the write() method on the response (which is a subclass of
     node's ServerResponse, implementing the stream.Writeable interface)
     and record the chunks as they are sent.
     */
    wrapResponseWrite(res)

    /*
     Patch the end() method of the response to call _storeResponseInCache.
     We use this patching method instead of firing on the 'finished' event
     because we want to guarantee that caching is complete before we
     send the event. If we use the event, then caching may happen after
     the event is complete, but in a Lambda environment processing is
     halted once the event is sent, so caching might not occur.
     */
    const originalEnd = res.end
    res.end = (...params) => {
        // Check the cached flag - in some cases, end() may be
        // called twice and we want to ignore the second call.
        if (caching.endCalled) {
            return
        }
        caching.endCalled = true

        // Handle any data writing that must be done before end()
        // is called.
        const {data, encoding, callback} = parseEndParameters(params)
        if (data) {
            // We ignore the return value from write(), because we
            // don't care whether the data is queued in user memory
            // or is accepted by the OS, as long as we call write()
            // before we call end()
            res.write(data, encoding)
        }

        // The response has been sent. If there is a shouldCacheResponse
        // callback, we call it to decide whether to cache or not.
        if (shouldCacheResponse) {
            if (!shouldCacheResponse(req, res)) {
                localDevLog(`Req ${locals.requestId}: not caching response for ${req.url}`)
                return originalEnd.call(res, callback)
            }
        }

        // We know that all the data has been written, so we
        // can now store the response in the cache and call
        // end() on it.
        const timer = res.locals.timer
        req.app.applicationCache._cacheDeletePromise
            .then(() => {
                localDevLog(`Req ${locals.requestId}: caching response for ${req.url}`)
                timer.start('cache-response')
                return storeResponseInCache(req, res).then(() => {
                    timer.end('cache-response')
                })
            })
            .finally(() => {
                originalEnd.call(res, callback)
            })
    }
}

/**
 * Given a CachedResponse that represents a response from the
 * cache, send it. Once this method has been called, the response
 * is sent and can no longer be modified. If this method is
 * called from the requestHook, the caller should return, and
 * should not call next()
 *
 * @param cached {CachedResponse} the cached response to send
 * @private
 */
export const sendCachedResponse = (cached) => {
    if (!(cached && cached.found)) {
        throw new Error(`Cannot send a non-cached CachedResponse`)
    }
    cached._send()
    cached._res.end()
}

/**
 * Look up a cached response for the given request in the persistent cache
 * and return a CachedResponse that represents what was found.
 *
 * This method would generally be called in the requestHook. The caller
 * should check the result of resolving the Promise returned by this
 * method. The returned object's 'found' property is true if a response
 * was found, 'false' if no response was found.
 *
 * The CachedResponse instance returned has details of any cached response
 * found, and project code can then choose whether to send it or not. For
 * example, the headers may be checked. To send that cached response, call
 * sendCachedResponse with it.
 *
 * If there is no cached response found, or the project code does not
 * choose to send it, then the code can also choose whether the
 * response generated by the server should be cached. If so, it
 * should call cacheResponseWhenDone.
 *
 * If no key is provided, it's generated by generateCacheKey.
 * Project code may call generateCacheKey with extra options to affect
 * the key, or may use custom key generation logic.
 *
 * By default, all cache entries occupy the same namespace, so responses
 * cached for a given URL/querystring/headers by one version of the UPWA
 * may be retrieved and used by other, later versions. If this is not
 * the required behaviour, the options parameter may be used to pass a
 * 'namespace' value. The same cache key may be used in different
 * namespaces to cache different responses. For example, passing the
 * bundle id as the namespace will result in each publish bundle starting
 * with a cache that is effectively per-bundle. The namespace value
 * may be any string, or an array of strings.
 *
 * @param req {express.request}
 * @param res {express.response}
 * @param [key] {String} the key to use - if this is not supplied,
 * generateCacheKey will be called to derive the key.
 * @param [namespace] {String|undefined} the cache namespace to use.
 * @returns {Promise<CachedResponse>} resolves to a CachedResponse
 * that represents the result of the cache lookup.
 * @private
 */
export const getResponseFromCache = ({req, res, namespace, key}) => {
    /* istanbul ignore next */
    const locals = res.locals
    const workingKey = key || generateCacheKey(req)

    // Save the key as the default for caching
    locals.responseCaching.cacheKey = workingKey

    // Return a Promise that handles the asynchronous cache lookup
    const timer = res.locals.timer
    timer.start('check-response-cache')
    return req.app.applicationCache.get({key: workingKey, namespace}).then((entry) => {
        timer.end('check-response-cache')

        localDevLog(
            `Req ${locals.requestId}: ${
                entry.found ? 'Found' : 'Did not find'
            } cached response for ${req.url}`
        )

        if (!entry.found) {
            res.setHeader(X_MOBIFY_FROM_CACHE, 'false')
        }

        return new CachedResponse({
            entry,
            req,
            res
        })
    })
}

/**
 * Crash the app with a user-friendly message when the port is already in use.
 *
 * @private
 * @param {*} proc - Node's process module
 * @param {*} server - the server to attach the listener to
 * @param {*} log - logging function
 */
export const makeErrorHandler = (proc, server, log) => {
    return (e) => {
        if (e.code === 'EADDRINUSE') {
            log(`This port is already being used by another process.`)
            server.close()
            proc.exit(2)
        }
    }
}

let _nextRequestId = 1

// Configure the global last-chance error handler
process.on('unhandledRejection', catchAndLog)

/**
 * We're keeping this to preserve the API of the SSR server and its
 * faviconPath parameter. New code should use `serveStaticFile`
 * instead.
 *
 * @private
 */
const serveFavicon = (req, res) => {
    const options = req.app.options
    if (!options.faviconPath) {
        const msg = 'No faviconPath configured'
        console.warn(msg)
        res.status(404).send(msg)
    } else {
        res.sendFile(options.faviconPath, {
            headers: {
                [CACHE_CONTROL]: options.defaultCacheControl
            },
            cacheControl: false
        })
    }
}

/**
 * Serve static files from the app's build directory and set default
 * cache-control headers.
 * @since v2.1.0
 *
 * This is a wrapper around the Express `res.sendFile` method.
 *
 * @param {String} filePath - the location of the static file relative to the build directory
 * @param {Object} opts - the options object to pass to the original `sendFile` method
 */
export const serveStaticFile = (filePath, opts = {}) => {
    return (req, res) => {
        const options = req.app.options
        const file = path.resolve(options.buildDir, filePath)
        res.sendFile(file, {
            headers: {
                [CACHE_CONTROL]: options.defaultCacheControl
            },
            ...opts
        })
    }
}

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
    if (req.originalUrl.startsWith('/mobify/')) {
        return
    }

    // If the request has an X-Amz-Cf-Id header, log it now
    // to make it easier to associated CloudFront requests
    // with Lambda log entries. Generally we avoid logging
    // because it increases the volume of log data, but this
    // is important for log analysis.
    const cloudfrontId = req.headers['x-amz-cf-id']
    if (cloudfrontId) {
        // Log the Express app request id plus the cloudfront
        // x-edge-request-id value. The resulting line in the logs
        // will automatically include the lambda RequestId, so
        // one line links all ids.
        console.log(`Req ${res.locals.requestId} for x-edge-request-id ${cloudfrontId}`)
    }

    // Apply the request processor
    const requestProcessor = !isRemote() && getRequestProcessor(req)
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

/**
 * ExpressJS middleware that processes any non-proxy request passing
 * through the Express app.
 *
 * Strips Cookie headers from incoming requests, and configures the
 * Response so that it cannot have cookies set on it.
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
    // Strip cookies from the request
    delete req.headers.cookie

    // Set the Host header
    req.headers.host = options.appHostname

    // Replace any Origin header
    if (req.headers.origin) {
        req.headers.origin = options.appOrigin
    }

    // In an Express Response, all cookie setting ends up
    // calling setHeader, so we override that to allow us
    // to intercept and discard cookie setting.
    const setHeader = Object.getPrototypeOf(res).setHeader
    const remote = isRemote()
    res.setHeader = function(header, value) {
        /* istanbul ignore else */
        if (header && header.toLowerCase() !== SET_COOKIE && value) {
            setHeader.call(this, header, value)
        } /* istanbul ignore else */ else if (!remote) {
            console.warn(
                `Req ${res.locals.requestId}: ` +
                    `Cookies cannot be set on responses sent from ` +
                    `the SSR Server. Discarding "Set-Cookie: ${value}"`
            )
        }
    }
    next()
}

/**
 * Load any request processor code if running locally in order to emulate in the
 * dev server the code that would run on a Lambda Edge function.
 *
 * @private
 */
export const getRequestProcessor = (req) => {
    const options = req.app.options
    const requestProcessorPath = path.join(options.buildDir, 'request-processor.js')
    if (!isRemote() && fs.existsSync(requestProcessorPath)) {
        // At this point, buildDir will always be absolute
        // Dynamically require() in the script, which gives us a module.
        // We can't just use require, since this code is webpack'd, which
        // replaces require with a webpack-module-loading function.
        // We use the actual node require via this interesting hack
        const nodeRequire = eval('require') // eslint-disable-line no-eval
        const requestProcessor = nodeRequire(requestProcessorPath)
        // Verify that the module has a processRequest export
        /* istanbul ignore next */
        if (!requestProcessor.processRequest) {
            throw new Error(
                `Request processor module ${requestProcessorPath} ` +
                    `does not export processRequest`
            )
        }
        return requestProcessor
    } else {
        return null
    }
}

const ssrRequestProcessorMiddleware = (req, res, next) => {
    const locals = res.locals
    locals.requestStart = Date.now()
    locals.afterResponseCalled = false
    locals.responseCaching = {}
    locals.requestId = _nextRequestId++
    locals.timer = new PerformanceTimer(`req${locals.requestId}`)
    locals.originalUrl = req.originalUrl

    // Track this response
    req.app._requestMonitor._responseStarted(res)

    // Start timing
    locals.timer.start('express-overall')

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
            locals.timer.end('express-overall')
            locals.timingResponse && locals.timer.end('express-response')
            locals.afterResponseCalled = true
            // Emit timing unless the request is for a proxy
            // or bundle path. We don't want to emit metrics
            // for those requests. We test req.originalUrl
            // because it is consistently available across
            // different types of the 'req' object, and will
            // always contain the original full path.
            /* istanbul ignore else */
            if (!req.originalUrl.startsWith('/mobify/')) {
                req.app.sendMetric('RequestTime', Date.now() - locals.requestStart, 'Milliseconds')
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
            locals.timer.finish()
            // Release reference to timer
            locals.timer = null
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
    X_HEADERS_TO_REMOVE.forEach((key) => {
        delete req.headers[key]
    })

    // Hand off to the next middleware
    next()
}

/**
 * Set the headers for a bundle asset. This is used only in local
 * dev server mode.
 *
 * @private
 * @param res - the response object
 * @param assetPath - the path to the asset file (with no query string
 * or other URL elements)
 */
const setLocalAssetHeaders = (res, assetPath) => {
    const base = path.basename(assetPath)
    const contentType = mimeTypes.lookup(base)

    res.set(CONTENT_TYPE, contentType) // || 'application/octet-stream'

    // Stat the file and return the last-modified Date
    // in RFC1123 format. Also use that value as the ETag
    // and Last-Modified
    const mtime = fs.statSync(assetPath).mtime
    const mtimeRFC1123 = mtime.toUTCString()
    res.set('date', mtimeRFC1123)
    res.set('last-modified', mtimeRFC1123)
    res.set('etag', mtime.getTime())

    // We don't cache local bundle assets
    res.set('cache-control', NO_CACHE)
}

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
 * Provided for use by requestHook overrides.
 *
 * Call this to return a res that is a redirect to a bundle asset.
 * Be careful with res caching - 301 responses can be cached. You
 * can call res.set to set the 'Cache-Control' header before
 * calling this function.
 *
 * This function returns a Promise that resolves when the res
 * has been sent. The caller does not need to wait on this Promise.
 *
 * @param {Object} options
 * @param {Request} options.req - the ExpressJS request object
 * @param {Response} options.res - the ExpressJS res object
 * @param {String} [options.path] - the path to the bundle asset (relative
 * to the bundle root/build directory). If this is falsy, then
 * request.path is used (i.e. '/robots.txt' would be the path for
 * 'robots.txt' at the top level of the build directory).
 * @param {Number} [options.redirect] a 301 or 302 status code, which
 * will be used to respond with a redirect to the bundle asset.
 * @private
 */
export const respondFromBundle = ({req, res, path, redirect = 301}) => {
    // The path *may* start with a slash
    const workingPath = path || req.path

    // Validate redirect
    const workingRedirect = Number.parseInt(redirect)
    /* istanbul ignore next */
    if (workingRedirect < 301 || workingRedirect > 307) {
        throw new Error('The redirect parameter must be a number between 301 and 307 inclusive')
    }

    // assetPath will not start with a slash
    /* istanbul ignore next */
    const assetPath = workingPath.startsWith('/') ? workingPath.slice(1) : workingPath

    // This is the relative or absolute location of the asset via the
    // /mobify/bundle path
    const location = `${getBundleBaseUrl()}${assetPath}`

    localDevLog(
        `Req ${res.locals.requestId}: redirecting ${assetPath} to ${location} (${workingRedirect})`
    )
    res.redirect(workingRedirect, location)
}

/**
 * Serve the /worker.js file.
 *
 * Unlike other bundle assets, the worker cannot be served from a
 * bundle path. It must be served at the root of the site, so
 * that it can control all pages and requests. This presents some
 * challenges in caching. If we set a long age in the cache-control
 * header, then CloudFront and/or browsers may continue to use
 * outdated worker code. If we set a short value, we have to serve
 * more requests. We cannot solve this by returning a redirect to the
 * location of the worker file under the bundle path, because redirects
 * are not valid responses to the request to load a service worker
 * file for registration.
 *
 * The solution is to set a long value for s-maxage (CDN caching), plus
 * a strong etag (to allow CDN-only revalidation), and to set maxage
 * to 0 to prevent browser caching.
 *
 * See https://developers.google.com/web/updates/2018/06/fresher-sw
 * for useful background information about how service workers are
 * cached and updated by browsers.
 *
 * The worker file is loaded on-demand, but is not cached in memory. We
 * do not expect that we will get many requests for it (because it is
 * cached in the CDN) and the chances of one single Lambda getting multiple
 * requests for that file are extremely low - so we would never expect to
 * get a hit for any in-memory caching.
 *
 * There is a minor risk of a race condition:
 * 1. UPWA A starts, using bundle 1, and loads the worker for bundle 1
 * 2. Bundle 2 is published while UPWA A is running.
 * 3. UPWA A runs for 24 hours and thus the browser refreshes /worker.js,
 * getting the worker for bundle 2.
 *
 * If the workers for bundles 1 & 2 are incompatible, the UPWA running
 * bundle 1 might fail. Refreshing the UPWA will fix the issue (because
 * it will then load all the code for bundle 2).
 *
 * This race condition has always been present in our projects.
 *
 * @private
 */
const serveServiceWorker = (req, res) => {
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
}

/**
 * Express Middleware applied to requests that require rendering of a response.
 *
 * @private
 */
const ssrMiddleware = (req, res, next) => {
    const timer = res.locals.timer
    timer.start('ssr-overall')

    setDefaultHeaders(req, res)
    const renderStartTime = Date.now()

    const done = () => {
        const elapsedRenderTime = Date.now() - renderStartTime
        req.app.sendMetric('RenderTime', elapsedRenderTime, 'Milliseconds')
        timer.end('ssr-overall')
    }

    res.on('finish', done)
    res.on('close', done)
    next()
}

// eslint-disable-next-line no-unused-vars
const errorHandlerMiddleware = (err, req, res, next) => {
    catchAndLog(err)
    req.app.sendMetric('RenderErrors')
    res.sendStatus(500)
}

const createExpressApp = (options) => {
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
                const bucket = process.env.CACHE_BUCKET_NAME
                const useLocalCache = !(isRemote() || bucket)
                this._applicationCache = new PersistentCache({
                    useLocalCache,
                    bucket,
                    prefix: process.env.CACHE_BUCKET_PREFIX,
                    sendMetric: app.sendMetric.bind(app)
                })
            }
            return this._applicationCache
        }
    }
    merge(app, mixin)
    return app
}

export const createDevServer = (app) => {
    const options = app.options
    // Configure hostname and port.
    // Custom values are supported via environment variables.
    let hostname = process.env.LISTEN_ADDRESS || process.env.EXTERNAL_DOMAIN_NAME || 'localhost'
    let port = options.port

    app.use((req, res, next) => {
        const done = () => {
            // We collect garbage because when a Lambda environment is
            // re-used, we want to start with minimal memory usage. This
            // call typically takes less than 100mS, and can dramatically
            // reduce memory usage, so we accept the runtime cost.
            // For the local dev server, we do this now. For a remote
            // server, we use a different strategy (see createLambdaHandler).
            /* istanbul ignore else */
            if (!isRemote()) {
                req.app._collectGarbage()
            }
        }
        res.on('finish', done)
        res.on('close', done)
        next()
    })

    const parsedHost = parseHost(hostname)
    /* istanbul ignore next */
    if (parsedHost.port) {
        // hostname has a port in it. Rewrite hostname so it does not
        // include the port, and override the options.port with this
        // new port value
        hostname = parsedHost.hostname
        port = parsedHost.port
    }

    let server

    if (options.protocol === 'https') {
        const sslFile = fs.readFileSync(options.sslFilePath)
        server = https.createServer(
            {
                // See https://nodejs.org/api/tls.html#tls_tls_createsecurecontext_options
                // for information about these options.
                key: sslFile,
                cert: sslFile
            },
            app
        )
    } else {
        // Create a local dev server listening on HTTP, as to not use a self-signed certificate
        server = http.createServer(app)
    }

    server.on('error', makeErrorHandler(process, server, localDevLog))

    server.on('close', () => app.applicationCache.close())

    server.listen({hostname, port}, () => {
        localDevLog(
            `${options.protocol.toUpperCase()} development server listening on ` +
                `${options.protocol}://${hostname}:${port}`
        )
    })
    return {handler: undefined, server}
}

/**
 * Builds a Lambda handler function from an Express app.
 *
 * See: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-handler.html
 *
 * @param app {Express} - an Express App
 * @private
 */
export const createLambdaHandler = (app) => {
    // This flag is initially false, and is set true on the first request
    // handled by a Lambda. If it is true on entry to the handler function,
    // it indicates that the Lambda container has been reused.
    let lambdaContainerReused = false

    const server = awsServerlessExpress.createServer(app, null, binaryMimeTypes)

    const handler = (event, context, callback) => {
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
                        .then(() => callback(err, processLambdaResponse(response)))
                    // DON'T add any then() handlers here, after the callback.
                    // They won't be called after the response is sent, but they
                    // *might* be called if the Lambda container running this code
                    // is reused, which can lead to odd and unpredictable
                    // behaviour.
                )
            }
        )
    }
    return {server, handler}
}

/**
 * Create a Lambda handler OR start the local dev server, as appropriate for the
 * current environment. You should use this to export a Lambda handler in ssr.js,
 * eg.
 *
 *   const app = appServer()
 *
 *   export const get = createHandler(app)
 *
 * @param app {Express} - an Express App
 * @return {Function|undefined} - return a Lambda handler if running remotely, else undefined.
 */
export const createHandler = (app) => {
    const {handler} = !isRemote() ? createDevServer(app) : createLambdaHandler(app)
    return handler
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
    // We patch once and once only, because otherwise
    // it's challenging to test the server under different
    // conditions.
    const getAppHost = () => options.appHostname
    http.request = outgoingRequestHook(http.request, getAppHost)
    http.get = outgoingRequestHook(http.get, getAppHost)
    https.request = outgoingRequestHook(https.request, getAppHost)
    https.get = outgoingRequestHook(https.get, getAppHost)

    // Patch the ExpressJS Response class's redirect function to suppress
    // the creation of a body (DESKTOP-485). Including the body may
    // trigger a parsing error in aws-serverless-express.
    express.response.redirect = function(status, url) {
        let workingStatus = status
        let workingUrl = url

        if (typeof status === 'string') {
            workingUrl = status
            workingStatus = 302
        }

        // Duplicate behaviour in node_modules/express/lib/response.js
        const address = this.location(workingUrl).get('Location')

        // Send a minimal response with just a status and location
        this.status(workingStatus)
            .location(address)
            .end()
    }

    // Patch the whatwg-encoding decode function so that it will accept plain
    // JS strings and return them as-is.
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
