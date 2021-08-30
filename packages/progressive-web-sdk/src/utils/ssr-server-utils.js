/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/**
 * @module progressive-web-sdk/dist/utils/ssr-server-utils
 */
import crypto from 'crypto'
import uncss from 'uncss'
import path from 'path'
import fetch from 'node-fetch'
import fs from 'fs'
import fileUrl from 'file-url'
import proxy from 'http-proxy-middleware'
import sourceMapSupport from 'source-map-support'
import userAgentParser from 'ua-parser-js'
import {
    APPLICATION_OCTET_STREAM,
    BUILD,
    CONTENT_ENCODING,
    CONTENT_TYPE,
    PROXY_PATH_PREFIX,
    STATIC_ASSETS,
    X_ORIGINAL_CONTENT_TYPE,
    X_MOBIFY_FROM_CACHE
} from '../ssr/constants'
import {proxyConfigs, ssrFiles} from './ssr-shared-utils'
import {rewriteProxyRequestHeaders, rewriteProxyResponseHeaders} from './ssr-proxy-utils'
import {Matcher} from './glob-utils'
import {ResourceLoader} from 'jsdom'

// We use require() with 'url' since the names of functions are
// generic and may clash.
const URL = require('url')
const compression = require('compression')

import {PerformanceObserver, performance} from 'perf_hooks'

const MOBIFY_DEVICETYPE = 'mobify_devicetype'

// CloudFront device headers are capitalized
export const DESKTOP_CF = 'Desktop'
export const MOBILE_CF = 'Mobile'
export const TABLET_CF = 'Tablet'
export const DEVICE_TYPES_CF = [DESKTOP_CF, MOBILE_CF, TABLET_CF]

export const DESKTOP = 'desktop'
export const MOBILE = 'mobile'
export const TABLET = 'tablet'
export const DEVICE_TYPES = [DESKTOP, MOBILE, TABLET]
const BROWSER_SIZE_NAMES = {
    MOBILE: 'SMALL',
    TABLET: 'MEDIUM',
    DESKTOP: 'LARGE'
}

let bundleBaseURL
const bundleID = process.env.BUNDLE_ID
let REMOTE = false

/**
 * A regexp that matches the whole of a /*-delimited comment
 * that may occur in the CSS file.
 * @private
 */
const CSS_COMMENT_REGEXP = /\/\*.+\*\//g
// Source map support

/**
 * A regexp that matches everything inside of a url() value for
 * a CSS property - the match is the second element of the resulting
 * array (the first element is the full match, whereas the URL value is
 * a capture group inside of it).
 * @private
 */
const CSS_URL_VALUE = /(?:url\(['"]?)(.+[^"'])(?:['"]?\))/g

// A map from script filename to the text of that script.
// We store the relative and absolute versions of each script's path.
// Exported for testing
export const scriptMap = {}

export const setBundleBaseUrl = (remote) => {
    bundleBaseURL = `/mobify/bundle/${remote ? bundleID : 'development'}/`
}

export const getBundleBaseUrl = () => bundleBaseURL

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

const isHeaderValueTrue = (req, headerKey) => (req.header(headerKey) || '').toLowerCase() === 'true'

/**
 * Set the breakpoints names for browsers across mobile, tablet and desktop.
 * The object values should correspond to the values found in the `BREAKPOINTS`
 * object returned by `getBreakpoints()`.
 * @function
 * @param BrowserSizes {Object} A dictionary of browser sizes as a strings
 * @param BrowserSizes.MOBILE {String} The breakpoint name assigned to mobile
 * devices. Defaults to 'SMALL'
 * @param BrowserSizes.TABLET {String} The breakpoint name assigned to tablet
 * devices. Defaults to 'MEDIUM'
 * @param BrowserSizes.DESKTOP {String} The breakpoint name assigned to
 * desktop devices. Defaults to 'LARGE'
 * @example
 * setBrowserSizeNames({
 *     MOBILE: 'SMALL'
 *     TABLET: 'MEDIUM'
 *     DESKTOP: 'LARGE'
 * })
 */
export const setBrowserSizeNames = ({MOBILE, TABLET, DESKTOP}) => {
    /* istanbul ignore next */
    BROWSER_SIZE_NAMES.MOBILE = MOBILE || BROWSER_SIZE_NAMES.MOBILE
    /* istanbul ignore next */
    BROWSER_SIZE_NAMES.TABLET = TABLET || BROWSER_SIZE_NAMES.TABLET
    /* istanbul ignore next */
    BROWSER_SIZE_NAMES.DESKTOP = DESKTOP || BROWSER_SIZE_NAMES.DESKTOP
}

/**
 * Gets the breakpoint names for browsers across mobile, tablet and desktop.
 * These object values should correspond to the values found in
 * `getBreakpoints()`. The browser size name values can be configured with
 * `setBrowserSizeNames`.
 * @function
 * @return {Object} The browser sizes for MOBILE, TABLET and DESKTOP
 */
export const getBrowserSizeNames = () => ({...BROWSER_SIZE_NAMES})

/**
 * Gets the name of the current viewport size based on the client's browser
 * type. The return values can be configured with `setBrowserSizeNames`
 * @function
 * @param request {Request} An ExpressJS Request
 * @return {String} The active browser size
 * @example
 * getBrowserSize()
 */
export const getBrowserSize = (request) => {
    let browserSize = BROWSER_SIZE_NAMES.DESKTOP

    if (REMOTE) {
        // We must check for tablet BEFORE mobile, because tablet devices are
        // both "mobile" AND "tablet".
        if (isHeaderValueTrue(request, 'CloudFront-Is-Tablet-Viewer')) {
            browserSize = BROWSER_SIZE_NAMES.TABLET
        } else if (isHeaderValueTrue(request, 'CloudFront-Is-Mobile-Viewer')) {
            browserSize = BROWSER_SIZE_NAMES.MOBILE
        }
    } else {
        const requestingUA = request.get('user-agent')
        if (/ip(hone|od)/i.test(requestingUA) || /android.*mobile/i.test(requestingUA)) {
            browserSize = BROWSER_SIZE_NAMES.MOBILE
        } else if (/ipad/i.test(requestingUA) || /android/i.test(requestingUA)) {
            browserSize = BROWSER_SIZE_NAMES.TABLET
        }
    }

    return browserSize
}
/**
 * Extract device types from request headers. User can force
 * using a device type by using query param eg. "?mobify_devicetype=mobile"
 *
 * @param request {http.IncomingMessage} the request
 * @returns {Array} List of qualified device type string
 * @private
 */
export const detectDeviceTypes = (request) => {
    const forcedDeviceType = request.query[MOBIFY_DEVICETYPE]
    if (
        forcedDeviceType &&
        DEVICE_TYPES.map((deviceType) => deviceType).includes(forcedDeviceType.toLowerCase())
    ) {
        return [forcedDeviceType]
    }
    return isRemote() ? detectDeviceTypesCF(request) : detectDeviceTypesUA(request)
}

/**
 * Extract device type from CloudFront headers
 *
 * @param request {http.IncomingMessage} the request
 * @returns {Array} List of qualified device type string
 * @private
 */
export const detectDeviceTypesCF = (request) => {
    const deviceTypes = []
    DEVICE_TYPES_CF.forEach((deviceType) => {
        if (request.get(`CloudFront-Is-${deviceType}-Viewer`) === 'true') {
            deviceTypes.push(deviceType.toLowerCase())
        }
    })
    return deviceTypes
}

/**
 * Extract device type from header 'user-agent'
 *
 * @param request {http.IncomingMessage} the request
 * @returns {Array} List of qualified device type string
 * @private
 */
export const detectDeviceTypesUA = (request) => {
    const deviceTypes = []
    const device = new userAgentParser(request.get('user-agent')).getDevice()
    if (device && device.type) {
        switch (device.type) {
            case 'mobile':
                deviceTypes.push(MOBILE)
                break
            case 'tablet':
                deviceTypes.push(TABLET)
                break
            default:
                deviceTypes.push(DESKTOP)
        }
    } else {
        deviceTypes.push(DESKTOP)
    }
    return deviceTypes
}

export const setRemote = (remote) => {
    REMOTE = remote
}

export const isRemote = () => REMOTE

let QUIET = false

export const setQuiet = (quiet) => {
    QUIET = quiet
}

export const isQuiet = () => QUIET

// Logs in local development server mode only
export const localDevLog = (...args) => {
    if (!REMOTE && !QUIET) {
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

/**
 * Given a path to a source JS file, find the associated
 * map file and return an object with 'url' set to the
 * given path, and 'map' being the contents of the map
 * file.
 * @private
 */
export const getSourceMapFile = (source) => {
    const mapFile = `${source}.map`
    if (fs.existsSync(mapFile)) {
        return {
            url: source,
            map: fs.readFileSync(mapFile, 'utf8')
        }
    }
    return null
}

/**
 * Given a path to a JS file, return the text of that file.
 * @private
 */
export const getScriptFile = (path) => {
    let source = scriptMap[path]
    if (!source && fs.existsSync(path)) {
        source = fs.readFileSync(path, 'utf8')
    }
    return source || null
}

/**
 * Load the source for a list of scripts, and configure the source map
 * support that will be used in the SSR browser environment.
 *
 * The scriptFiles array should contain paths with a single directory
 * and filename (e.g. 'build/main.js'). Where the directory is 'build',
 * the file is expected to be located in 'buildDir', under the current
 * working directory. Where the directory is 'static_assets', the file
 * source is expected to be in the staticAssets object, with the filename
 * as the key.
 *
 * Once the scripts have been loaded, the sourceMapSupport module is
 * configured so that it will be able to load the script source and
 * any map file on demand.
 *
 * @private
 * @param buildDir {String} the build directory path (usually 'build')
 * @param scriptFiles {Array<String>} an array of script file paths
 * @param staticAssets {Object} an object whose keys are filename
 */
export const loadSSRScripts = (buildDir, scriptFiles, staticAssets) => {
    scriptFiles.forEach((scriptPath) => {
        const dirname = path.dirname(scriptPath)
        const filename = path.basename(scriptPath)
        const realPath = path.join(buildDir, filename)
        let source

        switch (dirname) {
            case BUILD:
                try {
                    source = fs.readFileSync(realPath, 'utf-8')
                } catch (err) {
                    /* istanbul ignore next */
                    console.error(
                        `Could not load script "${scriptPath}" from file ${realPath}: ${err}`
                    )
                }
                break

            case STATIC_ASSETS:
                // These assets are served from constant text that's
                // part of the SSR server. We leave 'realPath' set so
                // that we pretend the files are actually in the build
                // directory.
                source = staticAssets[filename]
                /* istanbul ignore next */
                if (!source) {
                    console.error(`Cannot find script ${scriptPath}`)
                }
                break

            /* istanbul ignore next */
            default:
                console.error(`Unrecognized script path ${scriptPath}`)
                break
        }

        /* istanbul ignore else */
        if (source) {
            // Store under relative paths
            scriptMap[scriptPath] = scriptMap[filename] = source
            // Store under full path
            scriptMap[path.resolve(process.cwd(), realPath)] = source
        }
    })

    sourceMapSupport.install({
        environment: 'node',
        retrieveSourceMap: getSourceMapFile,
        retrieveFile: getScriptFile
    })
}

// Map from path to stylesheet to stylesheet source
const stylesheetCache = {}

/**
 * Given the HTML for a page, run uncss on it and return the
 * optimized stylesheet.
 *
 * Loads the stylesheet from disk the first time called, then
 * caches it.
 *
 * @private
 * @param html {String} - the HTML (including links to the main stylesheet)
 * @param stylesheetPath {String} - path to the stylesheet file
 * @returns {Promise.<String>} optimized stylesheet.
 */
export const optimizeCSS = (html, stylesheetPath) => {
    return new Promise((resolve, reject) => {
        let stylesheetSource = stylesheetCache[stylesheetPath]
        if (!stylesheetSource) {
            localDevLog(`Loading stylesheet from ${stylesheetPath}`)
            try {
                stylesheetSource = fs.readFileSync(stylesheetPath, {encoding: 'utf8'})
            } catch (err) {
                console.error(`Could not load stylesheet ${stylesheetPath}: ${err}`)
                reject(err)
            }
            stylesheetCache[stylesheetPath] = stylesheetSource
        }

        const bundleURL = getBundleBaseUrl()

        uncss(
            html,
            {
                raw: stylesheetSource
            },
            (err, output) => {
                if (output) {
                    resolve(
                        output
                            // Remove sourcemap comments from the CSS - any map is
                            // no longer valid now that the CSS has been optimized,
                            // and the reference is potentially confusing.
                            .replace(CSS_COMMENT_REGEXP, '')
                            // Replace the relative paths to CSS urls with absolute
                            // paths. We have custom code for it, as UnCSS is using PostCSS under
                            // the hood without the util that changes relative paths to absolute ones.
                            // We want to avoid adding a dependency for PostCSS and postcss-url.
                            .replace(CSS_URL_VALUE, (urlString, match) => {
                                // Node path doesn't include protocol-prepended paths in isAbsolute
                                if (match.includes('//') || path.isAbsolute(match)) {
                                    return urlString
                                }
                                // Prepend the URL value with bundleURL
                                const urlValue = path.resolve(urlString, bundleURL)
                                return urlString.replace(match, urlValue)
                            })
                    )
                } /* istanbul ignore next */ else if (err) {
                    reject(err)
                } else {
                    /* istanbul ignore next */
                    reject(new Error('Unexpected uncss failure'))
                }
            }
        )
    })
}

/**
 * A set of options that globally affect the behaviour of windowFetch.
 * These are made available so that the SSR Server can modify behaviour
 * based on its configuration.
 *
 * The properties used are:
 * appOrigin: the application host origin
 * fetchAgents: an object with 'http' and/or 'https' properties, each
 * of which is an instance of an Agent for the respective protocol
 * (from the node http and https modules). If fetchAgents has a value
 * for the protocol of a URL being fetched, then it is passed to node-fetch
 * via the 'agent' option of the 'init' object.
 * sendMetric: a function taking (name, value, dimensions) that will send
 * a metric (see SSRServer.sendMetric)
 * @private
 */
const windowFetchOptions = {}

/**
 * Returns a modifiable reference to the windowFetchOptions object
 * @private
 */
export const getWindowFetchOptions = () => windowFetchOptions

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
 * Report metrics for an external request
 * @private
 */
const externalRequestComplete = (err, fullURL, startTime, requestId) => {
    const sendMetric = windowFetchOptions.sendMetric
    const elapsed = Date.now() - startTime
    /* istanbul ignore else */
    if (!err) {
        localDevLog(`Req ${requestId}: External request for ${fullURL} completed in ${elapsed} mS`)
        /* istanbul ignore else */
        if (sendMetric) {
            sendMetric('ExternalRequestTime', elapsed, 'Milliseconds')
            sendMetric('ExternalRequests')
        }
    } else {
        localDevLog(`Req ${requestId}: External request for ${fullURL} failed with error ${err}`)
        if (sendMetric) {
            sendMetric('ExternalRequestFailed')
        }
    }
}

/**
 * A 'fetch' function usable from JSDom, which is a thin wrapper around
 * node-fetch.
 *
 * @private
 * @param input {Object|String}- the resource URL to fetch or a Request object
 * @param init [{Object}] - fetch options
 * @returns {Promise<Response>}
 */
export const windowFetch = (input, init = {}) => {
    const workingInit = Object.assign({}, init)

    // Get the URL for the request
    const isRequest = typeof input === 'object'
    const baseURL = isRequest ? input.url : input

    const requestId = windowFetchOptions.requestId || 0
    const timer = windowFetchOptions.timer

    // If it's not a full URL, then we need to prepend the
    // application host origin to it, because node-fetch can
    // only handle absolute URLs. if the application host origin
    // hasn't been set yet (because the SSR Server hasn't been initialized)
    // then we will at least be able to handle absolute URLs.
    const fullURL = URL.resolve(windowFetchOptions.appOrigin || '', baseURL)

    // Check if the init object has an http/s agent to use for the fetch call
    // If no agent then use the windowFetchOptions agents
    /* istanbul ignore next */
    if (!workingInit.agent && windowFetchOptions.fetchAgents) {
        // We need to strip any colon from the end of the protocol
        // we extract from the URL.
        const protocol = URL.parse(fullURL).protocol.replace(':', '')
        workingInit.agent = windowFetchOptions.fetchAgents[protocol]
    }

    // If we had to rewrite the URL, and we were passed a Request, then
    // we have a problem. We can't update the URL in a Request object,
    // so we return a rejecting Promise with an error.
    if (fullURL !== baseURL && isRequest) {
        return Promise.reject(
            new Error(
                `Proxy, Req ${requestId}: can't update a Request with ` +
                    `relative path "${baseURL}" to "${fullURL}". Please ` +
                    `pass a URL string, not a Request object`
            )
        )
    }

    // Either pass the original Request to fetch, or the full URL
    /* istanbul ignore next */
    const workingInput = isRequest ? input : fullURL

    localDevLog(`Req ${requestId}: Making external request for ${fullURL}`)
    const timerName = `fetch-${fullURL}`
    const startTime = Date.now()
    timer && timer.start(timerName)
    return fetch(workingInput, workingInit)
        .then((response) => {
            timer && timer.end(timerName)
            externalRequestComplete(null, baseURL, startTime, requestId)
            return response
        })
        .catch((err) =>
            /* istanbul ignore next */
            {
                timer && timer.clear(timerName)
                externalRequestComplete(err, baseURL, startTime, requestId)
                throw err
            }
        )
}

/**
 * This function can be used to wrap http.request, http.get
 * (and the https module equivalents) in the SSR Server node
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
 * the tests in ssr-server-utils.test.js verify them all.
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

// See setBuildDir
let buildPath // A directory path - does not end with a slash
let buildOriginOnly // A file:// origin - does not end with a slash
let buildOriginSlash // A file:// origin - ends with a slash

/**
 * Called to configure the build directory paths.
 *
 * @private
 * @param buildDir
 */
export const setBuildDir = (buildDir) => {
    // The output from resolve is always a absolute path and always
    // starts with a slash on unixy systems
    buildPath = path.resolve(process.cwd(), buildDir)

    // Note that backslashes are not allowed in a file:// URL.
    // This is fiddly, so use a library. Valid examples:
    //
    // Unix: /x/y/z => file:///x/y/z
    // Windows: C:\x\y\z => file:///C:/x/y/z
    //
    // See: https://en.wikipedia.org/wiki/File_URI_scheme#Implementations

    buildOriginOnly = fileUrl(buildDir)
    buildOriginSlash = `${buildOriginOnly}/`
}

/**
 * Return the path that should be used to load webpack chunks.
 *
 * The returned value ends with a slash (it's an origin plus path)
 *
 * To be used in an SSR server (local or remote), where it returns a file://
 * path that references the local 'build' directory.
 *
 * @private
 */
export const getWebpackChunkPath = () => buildOriginSlash

/**
 * Return the buildOrigin that should be used to build URLs
 * that reference bundle assets in the build directory.
 *
 * The returned value does NOT end with a slash, and technically
 * is NOT an origin, but changing the name of this function might
 * be a breaking change.
 *
 * @private
 */
export const getBuildOrigin = () => buildOriginOnly

/**
 * Given a file path (either absolute or relative to the buildDir,
 * return true if it's included in any of the ssrFiles glob patterns.
 *
 * This function deals with file paths, not URLs
 *
 * @private
 * @param {String} filePath - path to the file to be checked, either
 * absolute or relative to the buildDir.
 */
export const inSSRFiles = (filePath) => {
    // The ssrFiles patterns are relative to buildDir, so
    // if we got an absolute path, strip it so that it's also
    // relative to buildDir.
    const normalizedfilePath = path.normalize(filePath)
    const normalizedBuildPath = path.normalize(buildPath)
    let workingPath

    if (normalizedfilePath.startsWith(normalizedBuildPath)) {
        // Strip off the path and the next slash
        workingPath = normalizedfilePath.slice(normalizedBuildPath.length + 1)
    } else {
        workingPath = normalizedfilePath
    }

    const matcher = new Matcher(ssrFiles)
    return matcher.matches(workingPath)
}

/**
 * Find all <script> elements in the given HEAD element that
 * use file:// URLs, and remove them.
 *
 * If any of the file:// scripts refer to files in the buildPath,
 * check the ssrFiles. If the script is not present in the ssrFiles,
 * return it in the resulting array.
 *
 * This function is used to remove script links that are added by
 * the PWA while executing, so that the HEAD content can be used
 * for an SSR'd page.
 *
 * @private
 * @param {Element} head - the document's HEAD element
 */
export const stripFileChunks = (head) => {
    const unlistedFiles = []
    Array.from(head.getElementsByTagName('script')).forEach((node) => {
        const src = node.getAttribute('src')

        // It's legal to have a script element without a 'src', so
        // we have to check it.
        if (src) {
            // If this is a file in the build area, we need to check it.
            /* istanbul ignore else */
            if (src.startsWith(buildOriginSlash)) {
                // Strip off the buildOrigin and the slash that follows it
                const scriptFile = src.slice(buildOriginSlash.length)

                // If the file isn't listed in ssrFiles, it's an unlisted file.
                /* istanbul ignore else */
                if (!inSSRFiles(scriptFile)) {
                    head.removeChild(node)
                    unlistedFiles.push(scriptFile)
                    // If the file is listed in the ssrFiles, we want to fix the URL
                } else {
                    node.setAttribute(
                        'src',
                        `${getBundleBaseUrl()}${src.slice(buildOriginSlash.length)}`
                    )
                }
                // All the other script tags that have file:// in src we want to remove
            } else if (src.startsWith('file://')) {
                head.removeChild(node)
            }
        }
    })

    return unlistedFiles
}

/**
 * Given an array of files that are not listed in the ssrOnly or ssrShared
 * lists, emit a console.error message about them.
 *
 * @private
 * @param missingFiles {Array<String>} - list of file names
 * @param context {String} - description of how the PWA references these
 * files (e.g. 'loaded by <script> elements').
 * @returns {String} the warning message generated
 */
export const warnMissingFiles = (missingFiles, context) => {
    const warningMessage =
        missingFiles && missingFiles.length
            ? `These files ${context} are not listed in ssrOnly or ssrShared: ${missingFiles.join(
                  ', '
              )}. The PWA may fail to run when deployed.`
            : null

    if (warningMessage) {
        console.error(warningMessage)
    }

    return warningMessage
}

const ALWAYS_BLOCKED = ['img', 'svg', 'audio', 'video']

const IS_JS_OR_MAP = /.+\.js(.map)?/

/**
 * Should the given resource be loaded by the SSR server?
 *
 * @param {Object} resource - resource to be loaded with a defaultFetch method
 * @param {Array<RegExp>} allowedUrls - an array of regexes for allowed Urls
 * @returns {Boolean}
 */
export const shouldLoadResource = (resource, allowedUrls) => {
    const resourceURL = resource.url.href
    localDevLog(`JSDOMCustomResourceLoader for ${resourceURL}`)
    const resourceName = resource.element && resource.element.localName

    /* istanbul ignore next */
    if (ALWAYS_BLOCKED.includes(resourceName)) {
        return false
    }

    let load = false

    // Detect a bundle script URL - we apply special processing to those
    if (
        buildOriginSlash &&
        resourceURL.startsWith(buildOriginSlash) &&
        IS_JS_OR_MAP.test(resourceURL)
    ) {
        // Get the bundlePath, relative to the build directory
        const bundlePath = resourceURL.slice(buildOriginSlash.length)

        // We always allow bundle script or map files to be loaded, but
        // we check if they're correctly listed.
        if (!inSSRFiles(bundlePath)) {
            warnMissingFiles([bundlePath], `loaded by ${resourceName} element(s)`)
        }

        load = true
    } else {
        // Check if the URL matches a regex in the allowedUrls list
        load = allowedUrls && allowedUrls.some((allowedUrl) => allowedUrl.test(resourceURL))
    }

    return load
}

/**
 * See jsdomCustomResourceLoader
 *
 * This is a cache for resources loaded by jsdomCustomResourceLoader
 * from the file system. JSDom loads files using streaming, which is slow
 * (can take a couple of hundred mS) so caching the files in memory
 * saves time on subsequent loads. Because both the local dev server
 * and deployed servers are restarted when bundle files change, it's
 * safe to cache files indefinitely.
 *
 * @private
 */
let resourceCache = {}

/**
 * For testing
 * @private
 */
export const resetResourceCache = () => {
    resourceCache = {}
}

/**
 * A custom JSDom resource loader that checks the resource URL against
 * sets of allowed URLs. URLs in the set are loaded, URLs that are not in
 * the set are not loaded.
 *
 * URLs received by the fetch function are full URLs. Bundle assets will
 * generally appear as file:// URLs containing the full path to the
 * bundle files (in the build directory).
 *
 * So that developers don't have to explicitly list scripts in the bundle
 * directory, they're permitted by default. However, we also check that
 * loaded bundle scripts (and map files) are in the ssrOnly or ssrShared
 * list, so that we can warn when an asset is loaded that would fail to be
 * loaded in a deployed SSR Server.
 *
 * @private
 * @param {Object} options - Options for customizing the resource loader
 * @param {String} options.proxy - the address of an HTTP proxy to be used
 * @param {Boolean} options.strictSSL - set to false to disable the requirement
 * that SSL certificates be valid
 * @param {String} options.userAgent - affects the User-Agent header sent, and
 * thus the resulting value for navigator.userAgent. It defaults to `Mozilla/5.0
 * (${process.platform || "unknown OS"}) AppleWebKit/537.36 (KHTML, like Gecko)
 * jsdom/${jsdomVersion}`.
 * @param {Array<RegExp>} options.allowedUrls - an array of regexes for allowed
 *  Urls. An empty array allows any URL.
 * @param {PerformanceTimer} timer - a timer to be used to track resource
 * loading time
 * @param requestId - the unique id for this request, for logging
 */

export const JSDOMCustomResourceLoader = function(options, timer, requestId) {
    // `_this` is a placeholder for the constructed class instance. `_this` is
    // also used for setting instance properties that can be access by class
    // methods. If you don't assign to `_this`, then instance methods won't
    // have access to those properties.
    let _this

    // I am using `Reflect` to set the prototypes. This pattern was described by
    // Renki Ivanko in this thread: https://esdiscuss.org/topic/extending-an-es6-class-using-es5-syntax
    //
    // The pattern is described as a simple way to extend an ES6 class using ES5
    // syntax. We have to use ES5 syntax to extend JSDOM's ES6 class `ResourceLoader`
    // because we must support legacy projects which likely do not babelize code
    // from `/node_modules`.
    //
    // The pattern should look something like...
    //
    //     class A {}
    //     function B() {
    //       return Reflect.construct(A, arguments, B)
    //     }
    //     Reflect.setPrototypeOf(B.prototype, A.prototype)
    //     Reflect.setPrototypeOf(B, A)
    //
    // eslint-disable-next-line prefer-rest-params, prefer-const
    _this = Reflect.construct(ResourceLoader, arguments, JSDOMCustomResourceLoader)

    // `JSDOMCustomResourceLoader` is built using ES5 syntax as a workaround for
    // trying to extend JSDOM's ResourceLoader class, which is distributed as
    // an ES6 class. Normally this shouldn't be an issue, but in order to compile
    // correctly, the project using both this SDK and the JSDOM dependencies
    // must configure itself to babelize `/node_modules` in order to work.
    // Therefor, are using this workaround to avoid such a breaking change.
    _this.allowedUrls = options.allowedUrls

    /* istanbul ignore next */
    _this.timer = timer || {}
    /* istanbul ignore next */
    _this.requestId = requestId || 0

    return _this
}

JSDOMCustomResourceLoader._fetch = function(
    url,
    options,
    allowedUrls,
    promiseCallback,
    timer,
    requestId
) {
    const schemes = /^(https|http|data|file)/
    const urlHasScheme = schemes.test(url)

    // If the url has no scheme, then default to https
    if (!urlHasScheme) {
        url = `https://${url}`
    }

    const resourceURL = url

    // `localName` is the tag name of the element that is loading
    // this resource. For example `script`, `link`, `img`, etc.
    const resourceName = options.element && options.element.localName

    // shouldLoadResource expects the resource formatted as follows
    const resource = {url: {href: url}, element: options.element}

    localDevLog(`Req ${requestId}: request to load ${resourceURL}`)
    if (shouldLoadResource(resource, allowedUrls)) {
        localDevLog(`Req ${requestId}: UPWA load of ${resourceName} allowed: ${resourceURL}`)

        const cachedResponse = resourceCache[resourceURL]
        if (cachedResponse !== undefined) {
            localDevLog(`Req ${requestId}: UPWA load of ${resourceName} from cache: ${resourceURL}`)

            // Return a Promise that resolves to the cached response (which will
            // be a string).
            return Promise.resolve(cachedResponse)
        }

        timer && timer.start(`resource-load-${resourceURL}`)
        return (
            promiseCallback(url, options)
                // For a script, the 'response' value here will be the text
                // of the JavaScript code, as a string.
                .then((response) => {
                    timer && timer.end(`resource-load-${resourceURL}`)
                    localDevLog(
                        `Req ${requestId}: UPWA load of ${resourceName} completed: ${resourceURL}`
                    )

                    /* istanbul ignore else */
                    if (resourceURL.startsWith('file://')) {
                        // For a file:// URL, the JSDom resource fetcher will
                        // return a Promise that resolves to a Buffer
                        // containing the actual data (so 'response' is that
                        // Buffer object).
                        // It turns out that JSDom can handle getting the
                        // actual UTF-8 string back as a response, so
                        // we cache that. We assume all loaded file://
                        // resources are UTF8.
                        const asString = response.toString()
                        resourceCache[resourceURL] = asString
                        return asString
                    }

                    return response
                })
        )
    }

    localDevLog(`Req ${requestId}: UPWA load of ${resourceName} not allowed: ${resourceURL}`)
    return null
}

JSDOMCustomResourceLoader.prototype.fetch = function(url, options) {
    // Created this callback function because passing
    // `super.fetch` down as an argument doesn't seem
    // to work. The function loses its reference to `this`
    const cb = ResourceLoader.prototype.fetch.bind(this)
    return JSDOMCustomResourceLoader._fetch(
        url,
        options,
        this.allowedUrls,
        cb,
        this.timer,
        this.requestId
    )
}

Reflect.setPrototypeOf(JSDOMCustomResourceLoader.prototype, ResourceLoader.prototype)
Reflect.setPrototypeOf(JSDOMCustomResourceLoader, ResourceLoader)

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
export const WHITELISTED_CACHING_PROXY_REQUEST_METHODS = ['HEAD', 'GET', 'OPTIONS']

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
 * SSR server is running (e.g. localhost:3443 for a local dev server)
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

        // Neither CloudFront nor the local SSR server will follow redirect
        // responses to proxy requests. The responses are returned to the
        // client.
        followRedirects: false,

        logLevel: 'warn',

        onError: (err, req, res) => {
            /* istanbul ignore next */
            if (!REMOTE) {
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
         * this SSR server that prompted the proxying
         */
        onProxyReq: (proxyRequest, incomingRequest) => {
            const url = incomingRequest.url
            /* istanbul ignore next */
            if (!REMOTE) {
                console.log(`Proxy: request for ${proxyPath}${url} => ${targetOrigin}/${url}`)
            }

            // Rewrite key headers.
            const newHeaders = rewriteProxyRequestHeaders({
                caching,
                headers: incomingRequest.headers,
                headerFormat: 'http',
                logging: !REMOTE,
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
            if (!REMOTE) {
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
                logging: !REMOTE,
                requestUrl: matchedUrl && matchedUrl[2]
            })

            // Also handle binary responses
            if (REMOTE) {
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

    // Provide an agent if there's one configured for this protocol
    /* istanbul ignore else */
    if (windowFetchOptions.fetchAgents) {
        const agent = windowFetchOptions.fetchAgents[targetProtocol]
        /* istanbul ignore next */
        if (agent) {
            config.agent = agent
        }
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
        if (!WHITELISTED_CACHING_PROXY_REQUEST_METHODS.includes(req.method)) {
            return res
                .status(405)
                .send(`Method ${req.method} not supported for caching proxy`)
                .end()
        }
        return proxyFunc(req, res, next)
    }
}

/**
 * Called by the SSR Server after updatePackageMobify has modified the
 * proxyConfigs list, to create the actual proxying objects.
 * @param {String} appHostname - the application hostname (the hostname
 * to which requests are sent to the SSR Server)
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
            const encoding = typeof encoding === 'string' ? encoding : 'utf8'
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
    constructor({entry = {}, request, response}) {
        this._found = !!entry.found
        this._key = entry.key
        this._namespace = entry.namespace
        this._data = entry.data
        this._metadata = entry.metadata || {}
        this._expiration = entry.expiration
        this._request = request
        this._response = response
    }

    /**
     * Send this response
     * @private
     */
    _send() {
        const metadata = this._metadata
        const response = this._response
        response.status(this.status)
        if (metadata.headers) {
            response.set(metadata.headers)
        }
        response.setHeader(X_MOBIFY_FROM_CACHE, 'true')
        if (this._data) {
            // Use write() not send(), because the body has already
            // been processed into a Buffer.
            response.write(this._data)
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
        if (!this._CW && (REMOTE || MetricsSender._override)) {
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

        return Promise.all(promises)
            .then(() => localDevLog('Metrics: all sending done'))
            .catch(
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
