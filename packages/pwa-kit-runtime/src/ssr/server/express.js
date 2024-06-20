/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/**
 * @module progressive-web-sdk/ssr/server/express
 */

import URL from 'url'
import {
    CachedResponse,
    getHashForString,
    getBundleBaseUrl,
    localDevLog,
    parseCacheControl,
    parseEndParameters,
    isRemote,
    wrapResponseWrite
} from '../../utils/ssr-server'
import {CONTENT_ENCODING, X_MOBIFY_FROM_CACHE} from './constants'
import {X_MOBIFY_REQUEST_CLASS} from '../../utils/ssr-proxying'
import {RemoteServerFactory} from './build-remote-server'
import logger from '../../utils/logger-instance'

export const RESOLVED_PROMISE = Promise.resolve()

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
 * By default, method will generate different cache keys for requests with
 * different request classes (effectively, the value of the request-class
 * string is included in 'extras'). To suppress this, pass true for
 * options.ignoreRequestClass
 *
 * @param req {IncomingMessage} the request to generate the key for.
 * @param [options] {Object} values that affect the cache key generation.
 * @param [options.extras] {Array<String|undefined>} extra string values
 * to be included in the key.
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
                logger.warn(`Unexpected error in cache put: ${err}`, {
                    namespace: 'express.storeResponseInCache'
                })
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
        req.app.applicationCache._cacheDeletePromise
            .then(() => {
                localDevLog(`Req ${locals.requestId}: caching response for ${req.url}`)
                return storeResponseInCache(req, res)
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
    return req.app.applicationCache.get({key: workingKey, namespace}).then((entry) => {
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
 * Get the appropriate runtime object for the current environment (remote or development)
 * @returns Shallow of the runtime object with bound methods
 */
export const getRuntime = () => {
    const runtime = isRemote()
        ? RemoteServerFactory
        : // The dev server is for development only, and should not be deployed to production.
          // To avoid deploying the dev server (and all of its dependencies) to production, it exists
          // as an optional peer dependency to this package. The unusual `require` statement is needed
          // to bypass webpack and ensure that the dev server does not get bundled.
          eval('require').main.require('@salesforce/pwa-kit-dev/ssr/server/build-dev-server')
              .DevServerFactory

    // The runtime is a JavaScript object.
    // Sometimes the runtime APIs are invoked directly as express middlewares.
    // In order to make sure the "this" keyword always have the correct context,
    // we bind every single method to have the context of the object itself
    const boundRuntime = {...runtime}
    for (const property of Object.keys(boundRuntime)) {
        if (typeof boundRuntime[property] === 'function') {
            boundRuntime[property] = boundRuntime[property].bind(boundRuntime)
        }
    }

    return boundRuntime
}
