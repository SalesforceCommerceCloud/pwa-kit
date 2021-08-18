/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/**
 * @module progressive-web-sdk/utils/ssr-server
 */
import crypto from 'crypto'
import proxy from 'http-proxy-middleware'
import UserAgentParser from 'ua-parser-js'
import {
    APPLICATION_OCTET_STREAM,
    CONTENT_ENCODING,
    CONTENT_TYPE,
    PROXY_PATH_PREFIX,
    X_ORIGINAL_CONTENT_TYPE,
    X_MOBIFY_FROM_CACHE
} from '../ssr/server/constants'
import {proxyConfigs} from './ssr-shared'
import {rewriteProxyRequestHeaders, rewriteProxyResponseHeaders} from './ssr-proxying'

const compression = require('compression')

import {PerformanceObserver, performance} from 'perf_hooks'

const MOBIFY_DEVICETYPE = 'mobify_devicetype'

export const DESKTOP = 'DESKTOP'
export const PHONE = 'PHONE'
export const TABLET = 'TABLET'

let bundleBaseURL
const bundleID = process.env.BUNDLE_ID

export const isRemote = () =>
    Object.prototype.hasOwnProperty.call(process.env, 'AWS_LAMBDA_FUNCTION_NAME')

export const getBundleBaseUrl = () => {
    return `/mobify/bundle/${isRemote() ? bundleID : 'development'}/`
}

/**
 * Get the URL that should be used to load an asset from the bundle.
 *
 * This function is provided for use in UPWAs.
 * @function
 * @param {string} path - the path to the asset (relative to the
 * build directory)
 * @returns {string}
 */
export const getAssetUrl = (path) => `${bundleBaseURL}${path}`

/**
 * Guess a device-type from a request. Users can force selection of a particular
 * device type using a GET param, eg. "?mobify_devicetype=PHONE".
 *
 * Detection is done using either CloudFront-set headers or the user-agent header.
 * If any CloudFront headers are set, these take precendence over a user-agent.
 *
 * The returned device type is a *guess* and cannot be relied upon to be completely
 * accurate.
 *
 * @param request {http.IncomingMessage} the request
 * @returns {String} one of "PHONE", "TABLET" or "DESKTOP"
 * @private
 */
export const detectDeviceType = (request) => {
    const forced = request.query[MOBIFY_DEVICETYPE]
    if (forced && [DESKTOP, PHONE, TABLET].includes(forced.toUpperCase())) {
        return forced
    }

    const cfMobile = `CloudFront-Is-${'Mobile'}-Viewer`
    const cfTablet = `CloudFront-Is-${'Tablet'}-Viewer`
    const cfDesktop = `CloudFront-Is-${'Desktop'}-Viewer`

    const useCloudfront = [cfMobile, cfTablet, cfDesktop].some(
        (header) => request.get(header) !== undefined
    )

    if (useCloudfront) {
        // CloudFront takes precedence, if any header was set.
        if (request.get(cfTablet) === 'true') {
            return TABLET
        } else if (request.get(cfMobile) === 'true') {
            return PHONE
        } else {
            return DESKTOP
        }
    } else {
        // Fall back to user-agent
        const device = new UserAgentParser(request.get('user-agent')).getDevice()
        const type = device && device.type
        switch (type) {
            case 'mobile':
                return PHONE
            case 'tablet':
                return TABLET
            default:
                return DESKTOP
        }
    }
}

let QUIET = false

export const setQuiet = (quiet) => {
    QUIET = quiet
}

export const isQuiet = () => QUIET

// Logs in local development server mode only
export const localDevLog = (...args) => {
    if (!isRemote() && !QUIET) {
        /* istanbul ignore next */
        console.log(...args)
    }
}

// Logs unless server is in quiet mode (used for tests)
export const infoLog = (...args) => {
    /* istanbul ignore next */
    if (!QUIET) {
        /* istanbul ignore next */
        console.log(...args)
    }
}

/**
 * A global error catcher
 * @private
 */
export const catchAndLog = (err, context) => {
    /* istanbul ignore next */
    const message = `${context || 'Uncaught exception'}: `
    console.error(
        message,
        /* istanbul ignore next */
        (err && (err.stack || err.message || err)) || '(no error)'
    )
}

const reWriteProxyURL = (relativePath, proxyPath, proxyHost, proxyProtocol) =>
    relativePath.replace(`${PROXY_PATH_PREFIX}/${proxyPath}`, `${proxyProtocol}://${proxyHost}`)

export const getFullRequestURL = (url) => {
    // Check if we already have a full URL
    // In some cases this could be http(s):// OR file:// which is
    // why we use regex here instead of looking for http
    if (/^[a-zA-Z]+:\/\//.test(url)) {
        return url
    }

    for (let i = 0; i < proxyConfigs.length; i++) {
        const {protocol, host, path} = proxyConfigs[i]

        if (url.startsWith(`${PROXY_PATH_PREFIX}/${path}/`)) {
            return reWriteProxyURL(url, path, host, protocol)
        }
    }

    throw new Error(
        `Unable to fetch ${url}, relative paths must begin with ${PROXY_PATH_PREFIX} followed by a configured proxy path.`
    )
}

/**
 * This function can be used to wrap http.request, http.get
 * (and the https module equivalents) in the Express app node
 * environment, so that all outgoing requests can be intercepted.
 *
 * This function is passed the original 'wrapped' function and
 * a second function that returns the 'appHost" - the hostname
 * to which "loopback" requests are sent. If the request is
 * a loopback, then an 'x-mobify-access-key' header is added.
 *
 * The complexity of this function comes from the variety of ways
 * in which the node http.request and http.get functions can be
 * called. They're passed either (options[, callback])
 * or (url[, options][, callback]) so key parameters are optional.
 * The code here copes with all the possible calling patterns and
 * the tests in utils/ssr-server.test.js verify them all.
 *
 * @private
 * @param wrapped {Function} the request/get function to wrap
 * @param getAppHost {Function} a function that returns the appHostname
 * for loopback requests
 * @returns {Function} a function that wraps 'wrapped'
 */

export const outgoingRequestHook = (wrapped, getAppHost) => {
    return function() {
        // Get the app hostname. If we can't, then just pass
        // the call through to the wrapped function. We'll also
        // do that if there's no access key.
        const accessKey = process.env.X_MOBIFY_ACCESS_KEY
        const appHost = getAppHost && getAppHost()

        if (!(appHost && accessKey)) {
            return wrapped.apply(this, arguments) // eslint-disable-line prefer-rest-params
        }

        // request and get can be called with (options[, callback])
        // or (url[, options][, callback]).
        let workingUrl = ''
        let workingOptions
        let workingCallback
        const args = arguments // eslint-disable-line prefer-rest-params

        // The options will be in the first 'object' argument
        for (let i = 0; i < args.length; i++) {
            const arg = args[i]
            switch (typeof arg) {
                case 'object': {
                    // Assume this arg is the options
                    // We want to clone any options to avoid modifying
                    // the original object.
                    workingOptions = {...arg}
                    break
                }
                case 'string': {
                    // Assume this arg is the URL
                    workingUrl = arg
                    break
                }

                default:
                    // Assume this is the callback
                    workingCallback = arg
                    break
            }
        }

        if (!workingOptions) {
            // No options were supplied, so we add them
            workingOptions = {headers: {}}
        }

        // We need to identify loopback requests: requests that are
        // to the appHost (irrespective of protocol).
        // The workingUrl value may be partial (the docs are very
        // imprecise on permitted values). We check everywhere that
        // might give us what we need. If this is not a loopback
        // request, we just pass it through unmodified.
        const isLoopback =
            // Either hostname or host are allowed in the options. The docs
            // say that 'hostname' is an alias for 'host', but that's not
            // exactly true - host can include a port but hostname doesn't
            // always. So we need to compare both.
            workingOptions.host === appHost ||
            workingOptions.hostname === appHost ||
            (workingUrl && workingUrl.includes(`//${appHost}`))

        if (!isLoopback) {
            return wrapped.apply(this, arguments) // eslint-disable-line prefer-rest-params
        }

        // We must inject the 'x-mobify-access-key' header into the
        // request.
        workingOptions.headers = workingOptions.headers ? {...workingOptions.headers} : {}

        // Inject the access key.
        workingOptions.headers['x-mobify-access-key'] = accessKey

        // Build the args, omitting any undefined values
        const workingArgs = [workingUrl, workingOptions, workingCallback].filter((arg) => !!arg)

        return wrapped.apply(this, workingArgs)
    }
}

/**
 * @private
 */
export const AGENT_OPTIONS_TO_COPY = [
    'ca',
    'cert',
    'ciphers',
    'clientCertEngine',
    'crl',
    'dhparam',
    'ecdhCurve',
    'honorCipherOrder',
    'key',
    'passphrase',
    'pfx',
    'rejectUnauthorized',
    'secureOptions',
    'secureProtocol',
    'servername',
    'sessionIdContext'
]

/**
 * Given an https.Agent (or an http.Agent) and the corresponding globalAgent,
 * copy key fields from the options of the 'from' Agent to the
 * options of the 'to' Agent. If 'from' is undefined, this function does nothing.
 *
 * The fields that we update are:
 * ca, cert, ciphers, clientCertEngine, crl, dhparam, ecdhCurve,
 * honorCipherOrder, key, passphrase, pfx, rejectUnauthorized,
 * secureOptions, secureProtocol, servername, sessionIdContext
 *
 * @private
 * @param [from] {Agent} - source object (or undefined)
 * @param to {Agent} - target object
 */
export const updateGlobalAgentOptions = (from, to) => {
    if (from && to && from.options) {
        if (!to.options) {
            to.options = {}
        }
        AGENT_OPTIONS_TO_COPY.forEach((key) => {
            if (key in from.options) {
                to.options[key] = from.options[key]
            }
        })
    }
}

/**
 * Given a piece of JavaScript or JSON as text, escape any
 * '</' so that it can be embedded within HTML.
 *
 * @private
 * @param {String} text
 * @returns {String}
 */
export const escapeJSText = (text) =>
    (text &&
        text.replace(
            // This must be a regex so that the replacement
            // is applied to all occurrences
            /<\//gm,
            '\\x3c\\x2f'
        )) ||
    text

/**
 * Called by responseSend to adjust the headers of a response before
 * it's handled by aws-serverless-express
 *
 * This is required because we need to handle the case of responses that
 * are compressed (for example, from a proxy request). The
 * aws-serverless-express package doesn't correctly see these as binary,
 * and will attempt to encode the binary, compressed-data payload as
 * a 'utf8' string, resulting in garbled responses.
 *
 * To fix this: if the response contains a content-encoding header
 * (meaning that it's binary) and a content-type header, we store the
 * content-type as x-original-content-type, and set the content-type
 * to 'application/octet-stream', so that aws-serverless-express will
 * treat the response as binary.
 *
 * This is reversed in processLambdaResponse below, where the original
 * content-type header is restored before the response is returned
 * from the Lambda integration.
 *
 * The passed Response object is modified in-place.
 *
 * @private
 * @param response {http.ServerResponse|http.IncomingMessage} - the Response
 * object, which may be an ExpressJS response (http.ServerResponse subclass),
 * or an http-proxy-middleware response (http.IncomingMessage).
 */
export const processExpressResponse = (response) => {
    if (!response) {
        return
    }

    // Get a function that will return a header value for either
    // response type.
    const getHeader = response.getHeader
        ? response.getHeader.bind(response)
        : (header) => response.headers[header]

    const contentType = getHeader(CONTENT_TYPE)
    if (contentType && getHeader(CONTENT_ENCODING)) {
        // It's technically possible to call send() more than once,
        // so we only do this the first time that we pass through
        // here and content-type and content-encoding are both set.
        if (!getHeader(X_ORIGINAL_CONTENT_TYPE)) {
            // Get a header-setting function that will work for either
            // response type (for single-value headers only).
            const setHeader = response.setHeader
                ? response.setHeader.bind(response)
                : (header, value) => {
                      response.headers[header] = value
                  }

            // Copy the current content-type to a separate
            // header. It can then be used in processLambdaResponse
            // to restore the header.
            setHeader(X_ORIGINAL_CONTENT_TYPE, contentType)
            // Set the content-type header to application/octet-stream
            // so that aws-serverless-express will treat this as
            // binary.
            setHeader(CONTENT_TYPE, APPLICATION_OCTET_STREAM)
        }
    }
}

/**
 * A function that returns a wrapper method for ExpressJS's Response.send
 * method.
 *
 * @private
 * @param originalSend {function} - the original send method (from
 * Response.prototype) to be wrapped.
 * @returns {function}
 */
export const responseSend = (originalSend) => {
    return function wrappedSend(...args) {
        // process response headers
        processExpressResponse(this)

        // Call the wrapped send() function
        return originalSend.call(this, ...args)
    }
}

/**
 * Given an AWS Lambda proxy integration response, process
 * it so that binary data is correctly encoded.
 *
 * See responseSend above for details on the purpose of this
 * function.
 *
 * If the response is undefined or null, the same value is returned.
 * If the response is modified, a shallow clone is returned.
 *
 * @private
 * @param response {Object} the response to be processed
 * @returns {Object} the response
 */
export const processLambdaResponse = (response) => {
    if (!response) {
        return response
    }

    // If the response contains an X_ORIGINAL_CONTENT_TYPE header,
    // then replace the current CONTENT_TYPE header with it.
    const originalContentType = response.headers && response.headers[X_ORIGINAL_CONTENT_TYPE]

    if (originalContentType) {
        // Shallow-clone the response, and also the headers object
        const result = {...response}
        result.headers = Object.assign({}, response.headers, {
            // Replace the original content type
            [CONTENT_TYPE]: originalContentType
        })
        // Remove the added header
        delete result.headers[X_ORIGINAL_CONTENT_TYPE]

        // Return the clone
        return result
    }

    return response
}

/**
 * @private
 */
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
            if (!isRemote()) {
                console.log(`Proxy: error ${err} for request ${proxyPath}/${req.url}`)
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
            const url = incomingRequest.url
            /* istanbul ignore next */
            if (!isRemote()) {
                console.log(`Proxy: request for ${proxyPath}${url} => ${targetOrigin}/${url}`)
            }

            // Rewrite key headers.
            const newHeaders = rewriteProxyRequestHeaders({
                caching,
                headers: incomingRequest.headers,
                headerFormat: 'http',
                logging: !isRemote(),
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
            Object.keys(incomingRequest.headers).forEach((key) => {
                // We delete the header on any falsy value, since
                // there's no use case where we supply an empty header
                // value.
                if (!newHeaders[key]) {
                    proxyRequest.removeHeader(key)
                }
            })
        },

        onProxyRes: (proxyResponse, req) => {
            /* istanbul ignore next */
            if (!isRemote()) {
                console.log(
                    `Proxy: ${proxyResponse.statusCode} response from ${proxyPath}${req.url}`
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
                logging: !isRemote(),
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

    const proxyFunc = proxy(config)

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
}

/**
 * Given a string, return a hash for that string. The hash is usable
 * as an etag, or any other context where a summary hash of a string
 * is required.
 *
 * @function
 * @param text {string} the string to be hashed
 * @returns {string} the hash of that string, in hexadecimal
 */
export const getHashForString = (text) => {
    const hash = crypto.createHash('sha256')
    hash.update(text)
    return hash.digest('hex')
}

const CC_AGE_RE = /(s-maxage|max-age)\s*=\s*(\d+)/gi

/**
 * Perform limited parsing of a Cache-Control header value, to
 * extract the s-maxage and max-age values and return them.
 *
 * @function
 * @param value {String} the value to parse
 * @returns {Object} with 'max-age' and 's-maxage' properties mapped
 * to String or undefined values.
 */
export const parseCacheControl = (value) => {
    const result = {}

    if (value) {
        CC_AGE_RE.lastIndex = 0
        let match
        do {
            match = CC_AGE_RE.exec(value)
            if (match) {
                result[match[1].toLowerCase()] = match[2]
            }
        } while (match)
    }

    return result
}

/**
 * Given an ExpressJS Response, patch the write method so that
 * values passed to it are saved in response.locals.responseCaching.chunks
 *
 * See SSRServer._configureResponseForCaching for usage
 * @private
 * @param response {http.ServerResponse}
 */
export const wrapResponseWrite = (response) => {
    const caching = response.locals.responseCaching
    caching.chunks = []
    const originalWrite = response.write
    /*
     * The ExpressJS response.write method can be passed a wide
     * range of types of object. A String is converted to a UTF-8 encoded
     * Buffer. Other non-Buffer types are stringified as JSON, which is
     * converted to a UTF-8 encoded Buffer. A Buffer is passed as-is.
     * Therefore this patch function should only ever receive
     * Buffer objects, and the encoding value should never be
     * specified. However, because there are many ways to send
     * a response, we add handling for string-encoding.
     */
    response.write = (chunk, encoding, callback) => {
        if (typeof chunk === 'string') {
            /* istanbul ignore next */
            encoding = typeof encoding === 'string' ? encoding : 'utf8'
            caching.chunks.push(Buffer.from(chunk, encoding))
        } else if (Buffer.isBuffer(chunk)) {
            caching.chunks.push(chunk)
        } else {
            throw new Error(`Object of unexpected type "${typeof chunk}" written to response`)
        }
        return originalWrite.call(response, chunk, encoding, callback)
    }
}

/**
 * Given the parameters passed to the end() method of an ExpressJS
 * response, decode the data, encoding and callback and return them
 * in an object.
 *
 * This function is specialized for use in SSRServer._configureResponseForCaching
 * and has been separated out to allow testing.
 *
 * @private
 * @params {Array|undefined} parameters passed to end()
 * @returns {Object} result the parsed values
 * @returns {*} result.data the data value
 * @returns {string} [result.encoding] the encoding value
 * @returns {function} [result.callback] the callback value
 */
export const parseEndParameters = (params) => {
    // If data is specified in a call to end(), it is equivalent to
    // calling response.write(data, encoding) followed by
    // response.end(callback). We need the data to be sent before
    // we call _storeResponseInCache, and we want to call end()
    // after _storeResponseInCache is done. Therefore we have to
    // parse the arguments, which is a little complex since end()
    // may be called with a range of different patterns.
    const result = {}
    params &&
        params.forEach((value) => {
            // Any function parameter must be the callback
            if (typeof value === 'function') {
                result.callback = value
            } else {
                // If we haven't assigned anything to data yet,
                // this parameter must be the data.
                if (result.data === undefined) {
                    result.data = value
                } else {
                    result.encoding = value
                }
            }
        })
    return result
}

/**
 * Filter function for compression module.
 *
 * @private
 * @param req {IncomingMessage} ExpressJS Request
 * @param res {ServerResponse} ExpressJS Response
 * @returns {Boolean}
 */
export const shouldCompress = (req, res) => {
    // If there is already a CONTENT_ENCODING header, then we
    // do not apply any compression. This allows project code
    // to handle encoding, if required.
    if (res.getHeader(CONTENT_ENCODING)) {
        // Set a flag on the response so that the persistent cache logic
        // can tell there was already a content-encoding header.
        res.locals.contentEncodingSet = true
        return false
    }

    // Let the compression module make the decision about compressing.
    // Even if we return true here, the module may still choose
    // not to compress the data.
    return compression.filter(req, res)
}

/**
 * A class that represents an ExpressJS response stored in
 * the persistent cache. An instance of this class should
 * be considered read-only.
 */
export class CachedResponse {
    /**
     * Construct a CachedResponse from a cache entry. Project
     * code should never need to call this.
     * @private
     */
    constructor({entry = {}, req, res}) {
        this._found = !!entry.found
        this._key = entry.key
        this._namespace = entry.namespace
        this._data = entry.data
        this._metadata = entry.metadata || {}
        this._expiration = entry.expiration
        this._req = req
        this._res = res
    }

    /**
     * Send this response
     * @private
     */
    _send() {
        const metadata = this._metadata
        const res = this._res
        res.status(this.status)
        if (metadata.headers) {
            res.set(metadata.headers)
        }
        res.setHeader(X_MOBIFY_FROM_CACHE, 'true')
        if (this._data) {
            // Use write() not send(), because the body has already
            // been processed into a Buffer.
            res.write(this._data)
        }
    }

    /**
     * Get the key used to retrieve this CachedResponse
     */
    get key() {
        return this._key
    }

    /**
     * Get the namespace used to retrieve this CachedResponse
     */
    get namespace() {
        return this._namespace
    }

    /**
     * true if this instance represents a found entry in the cache,
     * false if no entry was found.
     * @returns {Boolean}
     */
    get found() {
        return this._found
    }

    /**
     * The status code of this CachedResponse (as a Number)
     * @returns {Number}
     */
    get status() {
        return this._metadata.status || 200
    }

    /**
     * A reference to the data for the response, which will
     * be a Buffer, or undefined if the response is empty.
     * @returns {Buffer|undefined}
     */
    get data() {
        return this._data
    }

    /**
     * A reference to the headers for the response. The value is
     * a plain JS object containing the headers in the format used
     * by ExpressJS: keys are always lower-case, values are strings
     * except for set-cookie, which is an array of strings.
     * @returns {{}}
     */
    get headers() {
        return this._metadata.headers || {}
    }

    /**
     * Get the date & time when this entry would expire. If this
     * instance represents an entry that was not found, returns
     * undefined.
     * @returns {Date|undefined}
     */
    get expiration() {
        return this._found ? new Date(this._expiration) : undefined
    }
}

// Number of times that a batch of CloudWatch metrics will be retried
// if rejected due to throttling. Metrics start with this many retries,
// and the count is decremented if the sending is retried. If the value
// falls to zero, the metric is discarded, so there will be exactly
// METRIC_RETRIES attempts to send.
const METRIC_RETRIES = 3

/**
 * A class that will handle asynchronous sending of CloudWatch
 * metrics.
 *
 * Use MetricsSender.getSender() to get the singleton instance.
 *
 * @private
 */
export class MetricsSender {
    constructor() {
        // CloudWatch client used to send metrics. For a local dev server,
        // this will remain falsy, since a local dev server doesn't actually
        // send metrics (unless SEND_CW_METRICS is defined for testing).
        this._CW = null

        // A queue of metrics waiting to be sent. Each is a single
        // name/value metric, and they accumulate on this queue
        // until batched up into a putMetricData call.
        this._queue = []

        // The default retry count
        this._retries = METRIC_RETRIES
    }

    /**
     * Return the number of metrics waiting to be sent
     * @returns {number}
     */
    get queueLength() {
        return this._queue.length
    }

    /**
     * Create a CloudWatch AWS SDK client, or return a falsy value
     * if this MetricsSender is not actually sending metrics.
     *
     * @private
     * @returns {CloudWatch|null}
     */
    _setup() {
        /* istanbul ignore next */
        if (!this._CW && (isRemote() || MetricsSender._override)) {
            // Load the AWS sdk. Although we do this on-demand, it's
            // likely that a webpacked project will include the whole
            // required module, so we require just the client that we need.
            const Cloudwatch = require('aws-sdk/clients/cloudwatch')
            this._CW = new Cloudwatch({
                apiVersion: '2010-08-01',
                // The AWS_REGION variable is defined by the Lambda
                // environment.
                region: process.env.AWS_REGION || 'us-east-1'
            })
        }
        return this._CW
    }

    /**
     * Call putMetricData as needed, including retrying.
     *
     * @private
     * @param {CloudWatch} cw - Cloudwatch client
     * @param {Array} metrics - Array of metrics to send
     * @returns {Promise.<*>} resolved when the metrics are sent
     * (or when they can't be sent).
     */
    _putMetricData(cw, metrics) {
        /* istanbul ignore next */
        if (!cw) {
            return Promise.resolve()
        }

        return new Promise((resolve) => {
            // The parameters for putMetricData
            const params = {
                MetricData: metrics,
                Namespace: 'ssr'
            }

            // Initialize the retry count
            let retries = this._retries

            // Initialize the retry delay
            // This delay is long enough to reduce the sending
            // rate, but not so much that it delays completion
            // of a response too much.
            let retryDelay = 50 // mS

            // This callback is called when the putMetricData operation
            // is complete, or if an error occurs.
            const callback = (err) => {
                let retry = false

                if (err) {
                    if (err.code === 'Throttling') {
                        // We exceeded the CloudWatch metric sending
                        // rate. We may need to retry.
                        retry = --retries > 0
                        const msg = retry ? `retrying after ${retryDelay} mS` : 'not retrying'
                        console.warn(
                            `Metrics: ${err} when sending metric data (length ${metrics.length}): ${msg}`
                        )
                    } else {
                        // Some other error
                        console.warn(`Metrics: error sending data: ${err}`)
                    }
                }

                if (retry) {
                    // We need to delay before we actually retry
                    setTimeout(() => cw.putMetricData(params, callback), retryDelay)
                    // Increase the delay for any future retry
                    retryDelay += 25 // mS
                } else {
                    // Sending is done.
                    localDevLog(
                        `Metrics: ${err ? 'discarded' : 'completed'} sending ${
                            metrics.length
                        } metric(s)`
                    )
                    resolve()
                }
            }

            // Send the metrics
            cw.putMetricData(params, callback)
        })
    }

    /**
     * Send any queued metrics. Returns a Promise that resolves when
     * all sending is done.
     * The Promise will never reject.
     */
    flush() {
        // Pending Promises for _putMetricData calls
        const promises = []

        // Get a CloudWatch client (this will be falsy if we're not
        // really sending)
        const cw = this._setup()
        while (this._queue.length) {
            // Grab a batch of metrics from the queue - the maximum batch
            // size is 20.
            const queue = this._queue.slice(0, 20)
            this._queue = this._queue.slice(20)

            // Send the metrics
            promises.push(this._putMetricData(cw, queue))
        }

        return Promise.all(promises).catch(
            /* istanbul ignore next */
            (err) => console.warn(`Metrics: error during flush: ${err}`)
        )
    }

    /**
     * Add one or more custom metric values to the queue of those waiting
     * to be sent. This function supports simple name-and-value metrics.
     * It doesn't support more complex CloudWatch types.
     *
     * A metric is an object with at least 'name' (string) and 'value'
     * (number, defaults to 0). It may also optionally include 'timestamp'
     * (defaults to the time of the call to send()), and 'unit', which
     * must be one of Seconds, Microseconds, Milliseconds, Bytes, Kilobytes,
     * Megabytes, Gigabytes, Terabytes, Bits, Kilobits, Megabits, Gigabits,
     * Terabits, Percent, Count, Bytes/Second, Kilobytes/Second,
     * Megabytes/Second, Gigabytes/Second, Terabytes/Second,
     * Bits/Second, Kilobits/Second, Megabits/Second, Gigabits/Second,
     * Terabits/Second, Count/Second or None (defaults to 'Count').
     * There may also be a 'dimensions'
     * object, which has dimension names as keys and dimension
     * values as values.
     *
     * If called in the local development server, the metric information
     * will be logged, but the code will not actually emit anything. This
     * can be overridden by defining the SEND_CW_METRICS environment
     * variable, for testing.
     *
     * The metrics are added to an internal queue so that they can be
     * batched up to send more efficiently. They are only sent when
     * flush() is called.
     *
     * @private
     * @param metrics {Array<Object>} - array of name, value objects
     */
    send(metrics) {
        const now = new Date()
        metrics.forEach((metric) => {
            const metricData = {
                MetricName: metric.name,
                Value: metric.value || 0,
                // This value must be a string
                Timestamp: (metric.timestamp instanceof Date
                    ? metric.timestamp
                    : now
                ).toISOString(),
                Unit: metric.unit || 'Count'
            }

            if (metric.dimensions) {
                const dimensions = (metricData.Dimensions = [])
                Object.entries(metric.dimensions).forEach(([key, value]) => {
                    if (value) {
                        dimensions.push({
                            Name: key,
                            Value: value
                        })
                    }
                })
            }

            this._queue.push(metricData)
        })
    }
}

// Allow the presence of an environment variable to
// enable sending of CloudWatch metrics (for local
// integration testing)
MetricsSender._override = !!process.env.SEND_CW_METRICS

/**
 * Get the singleton MetricsSender
 *
 * @private
 * @returns {MetricsSender}
 */
MetricsSender.getSender = () => {
    if (!MetricsSender._instance) {
        MetricsSender._instance = new MetricsSender()
    }
    return MetricsSender._instance
}

/**
 * Class that wraps the Node Performance API to guard against
 * changes (it's at Stability 1 in node 8.10) and to make
 * the usage simpler.
 *
 * To use: create an instance of this class, and then call start() and
 * end(), passing the name of the duration being measured. To get all
 * the measured values, use summary().
 *
 * To time a function, use time(), passing a duration name
 * (useful when the same function is called multiple times and you want
 * to measure them separately) and function arguments.
 *
 * @private
 */
export class PerformanceTimer {
    /**
     * Construct a new PerformanceTimer, with the given name
     * as a 'namespace' within which all durations can be
     * measured. When the object is deleted, it clears all
     * entries under this namespace, so multiple
     * PerformanceTimer instances can be used at once.
     * @private
     * @param name
     */
    constructor(name) {
        this._namespace = `${name}-`
        // Length of the namespace prefix (with the '-' postfix)
        const nslen = this._namespace.length

        this._names = {}
        const results = (this._results = [])
        this._observer = new PerformanceObserver((list) => {
            list.getEntries().forEach((entry) => {
                const en = entry.name
                // Only include PerformanceEntry objects in
                // the namespace of this PerformanceTimer
                if (en.startsWith(this._namespace)) {
                    results.push({
                        name: en.slice(nslen),
                        duration: entry.duration
                    })
                }
            })
        }, false)
        this._observer.observe({entryTypes: ['measure']})
        this._nextOperationId = 1
    }

    /**
     * Returns an operation id that's unique to this PerformanceTimer,
     * so that timing code can use it to distinguish repeat timings.
     * Returns a different value on each access.
     * @return {number}
     */
    get operationId() {
        return this._nextOperationId++
    }

    /**
     * Given a name, return a namespaced version of it,
     * with the optional extension, and include teh result
     * in the _names object.
     * @private
     */
    _getMarkName(name, extension) {
        const ext = extension ? `-${extension}` : ''
        const mark = `${this._namespace}${name}${ext}`
        this._names[mark] = true
        return mark
    }

    /**
     * Mark the start of the duration with the given name
     * @private
     * @param name {String} duration name
     */
    start(name) {
        performance.mark(this._getMarkName(name, 'start'))
    }

    /**
     * Mark the end of the duration with the given name
     * @private
     * @param name {String} duration name
     */
    end(name) {
        const startName = this._getMarkName(name, 'start')
        const endName = this._getMarkName(name, 'end')
        performance.mark(endName)
        performance.measure(this._getMarkName(name), startName, endName)
        performance.clearMarks(startName)
        performance.clearMarks(endName)
    }

    /**
     * Clear the duration with the given name
     * @private
     * @param name {String} duration name
     */
    clear(name) {
        performance.clearMarks(this._getMarkName(name, 'start'))
        performance.clearMarks(this._getMarkName(name, 'end'))
        performance.clearMarks(this._getMarkName(name))
    }

    /**
     * Finish with this PerformanceObserver
     * @private
     */
    finish() {
        Object.keys(this._names).forEach((mark) => performance.clearMarks(mark))
        this._names = {}
        this._observer.disconnect()
        this._observer = null
    }

    /**
     * Measure the duration of the given function,
     * which is called with any remaining arguments
     * after name and fn.
     *
     * If the function throws an error, no duration
     * is recorded.
     *
     * @private
     * @param name {String} duration name
     * @param fn {function} function to call
     * @param args {Array} any arguments to the function
     */
    time(name, fn, ...args) {
        this.start(name)
        try {
            const result = fn(...args)
            this.end(name)
            return result
        } catch (err) {
            this.clear(name)
            throw err
        }
    }

    /**
     * Get an object (that can be JSON-serialized) for all
     * measured times.
     * @private
     */
    get summary() {
        return this._results
    }

    /**
     * Get access to the performance API used by this timer
     * @private
     * @return {Performance}
     */
    get performance() {
        /* istanbul ignore next */
        return performance
    }
}
