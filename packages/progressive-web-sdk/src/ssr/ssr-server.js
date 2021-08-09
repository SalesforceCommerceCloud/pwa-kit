/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint import/no-commonjs:0 */
const assert = require('assert')
const dns = require('dns')
const http = require('http')
const https = require('https')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const awsServerlessExpress = require('aws-serverless-express')
// body-parser is included when we install express
const bodyParser = require('body-parser') // eslint-disable-line import/no-extraneous-dependencies
const compression = require('compression')
const express = require('express')
const JsDom = require('jsdom')
const JSDOMParse5Adapter = require('jsdom/lib/jsdom/browser/parse5-adapter-parsing')
const mimeTypes = require('mime-types')
const expressLogging = require('morgan')
const Script = require('vm').Script
const pkg = require('../../package.json')
const sdkVersion = pkg.version
const semver = require('semver')
const URL = require('url')

import {initCacheManifest} from '../asset-utils'
import {PersistentCache} from '../utils/ssr-cache-utils'
import {
    CachedResponse,
    catchAndLog,
    configureProxyConfigs,
    getHashForString,
    escapeJSText,
    getAssetUrl,
    getBrowserSize,
    getBundleBaseUrl,
    getScriptFile,
    getSourceMapFile,
    getWebpackChunkPath,
    getWindowFetchOptions,
    infoLog,
    isQuiet,
    JSDOMCustomResourceLoader,
    localDevLog,
    MetricsSender,
    outgoingRequestHook,
    optimizeCSS,
    parseCacheControl,
    parseEndParameters,
    PerformanceTimer,
    processLambdaResponse,
    responseSend,
    setBundleBaseUrl,
    setBuildDir,
    setQuiet,
    setRemote,
    shouldCompress,
    loadSSRScripts,
    stripFileChunks,
    updateGlobalAgentOptions,
    warnMissingFiles,
    windowFetch,
    wrapResponseWrite,
    detectDeviceTypes
} from '../utils/ssr-server-utils'
import {getPackageMobify, proxyConfigs, updatePackageMobify} from '../utils/ssr-shared-utils'
import * as isReactRoute from '../routing/is-react-route'

import {
    BUILD,
    CONTENT_ENCODING,
    CONTENT_TYPE,
    STATIC_ASSETS,
    X_MOBIFY_QUERYSTRING,
    X_MOBIFY_FROM_CACHE
} from '../ssr/constants'

import {
    Headers,
    parseHost,
    X_HEADERS_TO_REMOVE,
    X_MOBIFY_REQUEST_CLASS
} from '../utils/ssr-proxy-utils'
const {JSDOM} = JsDom

const SET_COOKIE = 'set-cookie'
const HEAD_ELEMENT_ID = 'document-head-element'
const REACT_TARGET_ID = 'react-target-element'
const X_POWERED_BY = 'x-powered-by'

const KEEP_ALIVE_MS = 8000

// Up to around version 1.8 of the SDK, we exposed node-fetch's 'fetch'
// on the global object. This was unintentional, and led to tricky
// bugs if SSR-context code (such as the requestHook) used it. Rather
// that remove it and break code, we now expose windowFetch as
// global.fetch, so that workarounds (such as converting relative
// URLs to absolute ones) will work correctly.
global.fetch = windowFetch

const DOCTYPE_COMMENT = '<!DOCTYPE html>'
const CACHE_CONTROL = 'cache-control'
const NO_CACHE = 'max-age=0, nocache, nostore, must-revalidate'

// The source for number of scripts needed by the PWA are stored in a JSON
// file. We load these here so that we can provide them to the PWA
// browser environment. The files loaded from this JSON object have paths
// that start with 'static_assets'.
const SOURCEMAP_SUPPORT = `${STATIC_ASSETS}/browser-source-map-support.js`
const SOURCEMAP_INIT = `${STATIC_ASSETS}/setup-sourcemaps.js`
const CAPTURE_JS = `${STATIC_ASSETS}/capture.min.js`
const JQUERY_JS = `${STATIC_ASSETS}/jquery.min.js`
const BROWSER_DETECTION = `${STATIC_ASSETS}/browser-detection.min.js`

// We require() the JSON file containing the static assets so that the
// code is part of the SDK (we cannot load the file at runtime). When
// the SDK is built, all the files under 'src' end up in 'dist', but
// when tests are run, the files are loaded from 'src'. The path passed to
// require() is correct for use in a built SDK. For testing, this module
// is mocked.
const staticAssets = require('../static/assets.json')

export const hashInlineScript = (scriptContent) => {
    const algo = 'sha256'
    const hash = crypto.createHash(algo)
    hash.update(scriptContent)
    return `${algo}-${hash.digest('base64')}`
}

export class ScriptTag extends String {
    constructor(attrs, content = '') {
        attrs = Object.assign({}, attrs, {type: 'text/javascript'})
        const entries = Object.entries(attrs)
        const attrsString =
            entries.length === 0
                ? ''
                : ' ' +
                  entries
                      .sort((e1, e2) => (e1[0] < e2[0] ? -1 : 1)) // Simplifies testing
                      .map(([k, v]) => `${k}="${v}"`)
                      .join(' ')
        const value = `<script${attrsString}>${content}</script>`

        super(value)
        this.hash = content !== '' ? hashInlineScript(content) : null
    }
}

/**
 * A map from script file path to a Script object, exported for testing.
 * @private
 */
export const scriptCache = {}

/**
 * A list of supported browser objects and supported crawler bots consistent with Mobify's [Platform Compatibility Matrix](https://docs.mobify.com/platform/compatibility/)
 * @constant
 */
export const supportedBrowsers = [
    {name: 'chrome', version: 53, mobile: true},
    {name: 'chrome', version: 53},
    {name: 'safari', version: 9, mobile: true},
    {name: 'safari', version: 10},
    {name: 'firefox', version: 49},
    {name: 'msie', version: 11},
    {name: 'edge', version: 14},
    /(googlebot|adsbot-google|slurp|bingbot|duckduckbot|baiduspider|yandexbot|facebot|ia_archiver)/
]

// Resolved promise const
export const RESOLVED_PROMISE = Promise.resolve()

// Set of standard methods supported for routes handled by
// the SSRServer (the requestHook is an exception)
const STANDARD_METHODS = ['GET', 'HEAD', 'OPTIONS']

/**
 * Not all of these options are documented. Some exist to allow for
 * testing, or to handle non-standard projects.
 * @private
 */
const defaultSSRServerOptions = {
    // The array of regexes for urls to load resources from
    // (defaults to an empty array)
    allowedUrls: [],

    // Absolute path to the build directory
    buildDir: path.resolve(process.cwd(), BUILD),

    // The cache time for SSR'd pages (defaults to 600 seconds)
    defaultCacheTimeSeconds: 600,

    // The cache time for error pages (defaults to 60 seconds)
    errorCacheTimeSeconds: 60,

    // Whether to load capturejs for the PWA. This is true
    // for historical reasons - PWA code may rely on this.
    loadCaptureJS: true,

    // Whether to load JQuery for the PWA
    loadJQuery: true,

    // The name of the main file
    mainFilename: 'main.js',

    // Path to the PWA manifest file
    manifestPath: 'static/manifest.json',

    // Whether to optimize and inline the CSS for rendered pages
    optimizeCSS: false,

    // The port that the local dev server listens on
    port: 3443,

    // The protocol that the local dev server listens on
    protocol: 'https',

    // Quiet flag (suppresses output if true)
    quiet: false,

    // Filename of the SSR loader
    ssrLoaderFilename: 'ssr-loader.js',

    // Suppress SSL checks - can be used for local dev server
    // test code. Undocumented at present because there should
    // be no use-case for SDK users to set this.
    strictSSL: true,

    // The name of the main style sheet
    stylesheetFilename: 'main.css',

    // A list of supported browser objects, possible values:
    // - RegExp (with lowercase browser names)
    // - object with name, minimum supported version, mobile Boolean (optional)
    supportedBrowsers,

    // Relative or absolute URL used in window.location.replace() for unsupported
    // clients. If it's an empty string (default), the browser detection script
    // will not be loaded client-side.
    unsupportedBrowserRedirect: '',

    // The name of the vendor file
    vendorFilename: 'vendor.js'
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
 * A Rendering is created when an SSRServer starts to render a page.
 * It provides the methods that perform much of the processing that's
 * then applied to that page, and holds the state of each operation.
 * @private
 */
class Rendering {
    /**
     * Initialize a Rendering
     * The options should contain:
     * remote {Boolean} true for remote operation
     * ssrLoaderURL {String} the SSR loader URL
     * headContent {Array<String>} an Array of head content strings
     * preLoaderContent {Array<String>} an Array of content strings that
     * are added to the HTML immediately before the SSR Loader <script>
     *
     * @private
     * @param options {Object}
     */
    constructor(options) {
        this._remote = options.remote
        this._ssrLoaderURL = options.ssrLoaderURL
        this._headContent = options.headContent

        this._window = null
        this._renderStartTime = Date.now()
        this._isErrorResponse = false
        this._renderedAppState = null
        this._renderedAppContent = null
        this._renderedHeadContent = null
        // The HTML content of the page is stored as an array
        // of chunks of HTML (generally one per line).
        this._html = []
        this._inlineScriptHashes = []
        this._serverOnly = options.serverOnly
        this._timer = options.timer
        this._requestId = options.requestId
    }

    /**
     * Returns the time elapsed since this Rendering instance
     * was created, in mS
     * @returns {number}
     */
    get elapsedRenderTime() {
        return Date.now() - this._renderStartTime
    }

    /**
     * Get the html (as an Array of Strings)
     * @returns {Array<String>}
     */
    get html() {
        return this._html
    }

    /**
     * Get hashes for all rendered inline scripts, suitable for use in a CSP header
     * @returns {Array<String>}
     */
    get inlineScriptHashes() {
        return this._inlineScriptHashes
    }

    /**
     * Returns true if the rendered HTML is for an error page
     * @returns {boolean}
     */
    get isErrorResponse() {
        return this._isErrorResponse
    }

    /**
     * Extract the rendered content.
     *
     * On entry, this._window and this._renderedAppState must be set
     * On exit, renderedAppContent, renderedHeadContent are set
     * On exit, renderedAppState is updated
     */
    _getRenderedContent() {
        const document = this._window.document

        this._timer.start('rendering-cleanup-head')
        const head = document.head
        // Remove flagged elements from the HEAD of the document.
        Array.from(head.getElementsByClassName('pw-remove')).forEach((node) => {
            head.removeChild(node)
        })

        // Check <script> elements in the head. Remove any that refer to
        // file:// URLs (added by webpack when executing the PWA).
        // If there are webpack chunks referenced in the HEAD that
        // are not in the ssrOnly or ssrShared lists, they are returned in
        // an array.
        const warningMessage = warnMissingFiles(
            stripFileChunks(head),
            'referenced in the document <head>'
        )
        this._timer.end('rendering-cleanup-head')

        // If we have an error to report, and we're running locally,
        // add a script element that will emit the error.
        if (warningMessage && !this._remote) {
            this._headContent.push(
                new ScriptTag({}, `console.error(${JSON.stringify(warningMessage)})`)
            )
        }

        // Rendering is complete, so prep the app state and app HTML for
        // our response sent to the client
        this._timer.start('rendering-extract-app-html')
        const reactTarget = document.getElementById(REACT_TARGET_ID)
        this._renderedAppContent = reactTarget.innerHTML.trim()
        this._timer.end('rendering-extract-app-html')
        this._timer.start('rendering-extract-head-html')
        this._renderedHeadContent = head.innerHTML.trim()
        this._timer.end('rendering-extract-head-html')

        // When the app state is used client side, isServerSide must be false.
        this._timer.start('rendering-update-app-state')
        /* istanbul ignore else */
        if (this._renderedAppState) {
            const appState = this._renderedAppState.app
            if (appState && appState.set) {
                this._renderedAppState.app = appState.set('isServerSide', false)
            }
        }
        this._timer.end('rendering-update-app-state')
        localDevLog(`Req ${this._requestId}: Rendered initial page in ${this.elapsedRenderTime} mS`)

        // Returns a Promise so that it can be included in a Promise chain
        return RESOLVED_PROMISE
    }

    /**
     * Wrapper for _getRenderedContent that returns a Promise
     */
    getRenderedContent() {
        return new Promise((resolve, reject) => {
            try {
                this._getRenderedContent()
                resolve()
            } catch (err) {
                reject(err)
            }
        })
    }

    /**
     * Perform CSS Optimization.
     *
     * On entry, this._renderedAppContent must be set.
     * On exit, this.optimizedCSS is set, unless an error occurs during
     * optimization, in which case it's null.
     *
     * This method returns a Promise that resolves when the optimization
     * is done.
     *
     * @param stylesheetPath {String} the stylesheet path
     * @returns {Promise<*>}
     */
    doCSSOptimization(stylesheetPath) {
        const html = [
            `<html><head></head>`,
            '<body><div id="content" class="react-target">',
            this._renderedAppContent,
            '</div></body></html>'
        ].join('\n')

        const optimizeStartTime = Date.now()
        return optimizeCSS(html, stylesheetPath)
            .then((optimizedCSS) => {
                localDevLog(
                    `Req ${this._requestId}: CSS optimized in ${Date.now() - optimizeStartTime} mS`
                )
                this.optimizedCSS = optimizedCSS
            })
            .catch((err) => {
                console.error(`Error optimizing CSS: ${err}`)
                this.optimizedCSS = null
            })
    }

    /**
     * Product the final HTML document.
     * On entry, this.optimizedCSS, this._renderedHeadContent,
     * this._renderedAppContent, this._renderedAppState must be set
     * On exit, this._html is set
     */
    produceFinalDocument() {
        // We always include the x-inline-styles element, because older SSR
        // loader code will attempt to remove it when the main stylesheet
        // loads, but doesn't correctly check if it's found. So if there's
        // no optimizedCSS, we create an empty element,
        this._headContent.push(`<style id="x-inline-styles">${this.optimizedCSS || ''}</style>`)

        /* istanbul ignore else */
        if (this._renderedHeadContent) {
            this._headContent.push(this._renderedHeadContent)
        }

        // We escape the </ that marks an element close tag in the
        // JSON so that it may safely be included in a <script> tag
        // in the output page.
        this._timer.start('rendering-embed-app-state')
        const stringifiedAppState = escapeJSText(JSON.stringify(this._renderedAppState))
        this._timer.end('rendering-embed-app-state')

        const timingOutput = this._timer.summary
            .map((entry) => `  ${entry.name}: ${entry.duration.toFixed(2)} mS`)
            .join('\n')

        this._html = [
            DOCTYPE_COMMENT,
            '<html><head>',
            ...this._headContent,
            '</head><body>',
            `<div class="react-target">${this._renderedAppContent}</div>`,
            new ScriptTag({}, `window.__PRELOADED_STATE__=${stringifiedAppState}`),
            this._serverOnly
                ? '<!-- server-only output -->'
                : new ScriptTag({id: 'mobify-v8-tag', src: `${this._ssrLoaderURL}`}),
            new ScriptTag(
                {},
                `window.Progressive.SSRTiming = ${JSON.stringify(this._timer.summary)}`
            ),
            `<!-- Timing\n${timingOutput}\n-->`,
            '</body>',
            '</html>'
        ]
    }

    /**
     * Abort rendering, and set this._html to a page that will load
     * the ssr-loader.
     *
     * On entry, this._headContent should be set
     * In exit, this._html and this._isErrorResponse are set
     *
     * @param err {Error} an Error instance
     * @param includeErrorMessage {Boolean} True if the error message should be included as a console.error in the response
     * This flag will only be considered if quiet mode is set to false
     * @returns {Rendering} returns this Rendering object
     */
    renderErrorHandlerDocument(err, includeErrorMessage) {
        catchAndLog(err, 'Error in rendering')

        let errorScript = ''

        if (!isQuiet() && includeErrorMessage) {
            errorScript = new ScriptTag(
                {},
                `console.error("An error occurred during server side rendering: ${err.message}")`
            )
        }

        // Rendering Failed - send an error page loads the UPWA client-side.
        this._html = [
            DOCTYPE_COMMENT,
            '<html><head>',
            ...this._headContent,
            '</head>\n<body>',

            // Include a comment noting that this is an error page (allows
            // testing).
            '<!-- Error in rendering -->',

            // We don't include any content - we expect the UPWA
            // to start up and take over.

            // We need a react-target so that the UPWA can start up
            '<div class="react-target">&nbsp;</div>',

            // We invoke the SSR loader to start the UPWA
            new ScriptTag({id: 'mobify-v8-tag', src: `${this._ssrLoaderURL}`}),
            errorScript,
            '</body>\n</html>'
        ]

        // Indicate that this is an error response
        this._isErrorResponse = true

        return this
    }

    /**
     * Should be called when the PWA has completed rendering, with the
     * final application state and the window object.
     * @param {Object} options
     * @param {Object} options.appState PWA application state
     * @param {Object} options.windowObject PWA window object
     * @param {String} options.stylesheetPath path to stylesheet to use
     * @param {Boolean} options.optimizeCSS - true to optimize CSS, false
     * to leave it.
     * @returns {Promise<Rendering>} resolves to this Rendering object
     */
    complete({appState, optimizeCSS, stylesheetPath, windowObject}) {
        this._renderedAppState = appState
        this._window = windowObject

        return this.getRenderedContent()
            .then(() => {
                if (optimizeCSS) {
                    return this.doCSSOptimization(stylesheetPath)
                } else {
                    this.optimizedCSS = null
                    return RESOLVED_PROMISE
                }
            })
            .then(() => {
                this.produceFinalDocument()

                // Return this Rendering instance
                return this
            })
            .catch((err) => this.renderErrorHandlerDocument(err))
            .then(() => {
                Array.from(this._window.document.querySelectorAll('script'))
                    .filter((el) => !el.hasAttribute('src'))
                    .forEach((el) => {
                        this._inlineScriptHashes.push(hashInlineScript(el.innerHTML))
                    })
                this.html.forEach((line) => {
                    if (line instanceof ScriptTag && line.hash) {
                        this._inlineScriptHashes.push(line.hash)
                    }
                })
            })
    }
}

/**
 * To create an SSR Server, project code should import this class
 * and create an instance of it. To implement hooks like
 * requestHook or responseHook, extend this class and override
 * those hook methods as needed.
 */
export class SSRServer {
    /**
     * Create an SSR (Server-Side Rendering) Server.
     *
     * Project code can either create an instance of this class, or
     * extend this class to provide an implementation of
     * the requestHook and/or responseHook methods.
     *
     * @constructor
     * @param {Object} options
     * @param {Array<RegExp>} [options.allowedUrls=[]] - a list of path regexes
     * (including bundle assets and file:// URLs) for URLs to load resources from
     * @param {String} [options.buildDir] - The build directory path, either as an
     * absolute path, or relative to the current working directory. Defaults
     * to 'build'.
     * @param {Number} [options.defaultCacheTimeSeconds=600] - The cache time
     * for rendered pages and assets (not used in local development mode).
     * @param {Number} [options.errorCacheTimeSeconds=60] - The cache time
     * for error pages (not used in local development mode).
     * @param {String} options.faviconPath - The path to the favicon.ico file,
     * either as an absolute path, or relative to the build directory. If this
     * value is not supplied, requests for a favicon will return a 404 and
     * log a warning to the console.
     * @param {Object} [options.fetchAgents] - An optional object which
     * can define, for one or both of the 'http' and 'https' protocols, an
     * Agent (http.Agent or https.Agent) object that will be used for fetches
     * under that protocol
     * @param {Boolean} [options.loadCaptureJS=true] - true to have capture.js
     * loaded for the PWA when rendering, false to not load JQuery. This is
     * true to simplify migration from a PWA to a UPWA. A new UPWA project would
     * generally pass false for this value. Setting this will
     * make capture.js available server-side and client-side. Also see
     * loadJQuery, which may override this option.
     * @param {Boolean} [options.loadJQuery=true] - true to have JQuery loaded for
     * the PWA when rendering, false to not load JQuery. Setting this will
     * make JQuery available server-side and client-side. It will also make
     * capture.js available, because some parts of the SDK assume that if
     * JQuery is present, capture.js is also present.
     * @param {String} [options.mainFilename='main.js'] - the name of the main PWA file,
     * relative to the build directory.
     * @param {String} [options.manifestPath='static/manifest.json'] - the name of the
     * manifest file, relative to the build directory.
     * @param {Object} options.mobify - The 'mobify' object from the project's
     * package.json file, containing the SSR parameters.
     * @param {Boolean} [options.optimizeCSS=false] - set true to have the SSR Server
     * generate minimal inline CSS for the rendered page, false to use the main
     * stylesheet. CSS opimization works well for small stylesheets, but may
     * slow down server-side rendering too much with large stylesheets.
     * @param {Number} [options.port=3443] - the localhost port on which the local
     * development SSR server listens.
     * @param {String} [options.protocol='https'] - the protocol on which the development
     * SSR server listens.
     * @param {Array<RegExp>} options.routes - an Array of regular expressions for the
     * routes supported by the PWA. Requests for paths that match any of the
     * routes cause rendering of a page. Routes start with a '/'.
     * @param {String} options.sslFilePath - the absolute path to a PEM format
     * certificate file to be used by the local development server. This should
     * contain both the certificate and the private key.
     * @param {String} [options.ssrLoaderFilename='ssr-loader.js'] - the name of the SSR
     * loader file, relative to the build directory.
     * @param {Array<String>} [options.ssrLoaderScripts=[]] - a list of paths,
     * relative to the build directory, of scripts that the SSR Loader should
     * load client-side. Commonly used to load third-party scripts included
     * in the project, such as analytics scripts.
     * @param {String} [options.stylesheetFilename='main.css'] - the name of the main
     * stylesheet, relative to the build directory.
     * @param {Array<Object>} [options.supportedBrowsers] - a list of supported browser
     * objects, either RegExp or browser objects with: name (String), version (Integer)
     * and mobile (optional, Boolean, defaults to false) keys
     * e.g. [{name: 'chrome', version: 53, mobile: true}, /^(?!.*(opr|opera|edge)).*chrome\/(51|52\.1\.2)/]
     * @param {String} [options.unsupportedBrowserRedirect=''] - a relative or absolute
     * URL to which the client should be redirected if the browser is not supported,
     * used in window.location.replace(). If the URL is not provided, the browser detection
     * script will not be loaded.
     * @param {String} [options.vendorFilename='vendor.js'] - the name of the vendor
     * file, relative to the build directory.
     */
    constructor(options) {
        // Build the options, filling in default values
        this.options = Object.assign({}, defaultSSRServerOptions, options)

        // This is used in a number of places in this
        // constructor.
        const windowFetchOptions = getWindowFetchOptions()

        // If this is the first SSRServer instance created, we do some
        // one-off setup.
        if (!SSRServer._oneOffSetupDone) {
            // Configure the global last-chance error handler
            process.on('unhandledRejection', catchAndLog)

            // SSR doesn't use a cache manifest, because bundle assets
            // are referenced via URLs that include the bundle number,
            // so publishing a new bundle automatically invalidates
            // any previous references. The local dev server serves
            // all assets as non-cacheable, so the manifest isn't needed
            // for local development either. Setting an empty object here
            // means that no asset URLs will include cachebreakers.
            initCacheManifest({})

            // Create the base http and https Agent instances, that
            // support keepAlive. We can't update the global agents
            // in the http and https modules (we can attempt to set them,
            // but it will silently fail), so we create our own, that
            // will be used by windowFetch.
            const agentOptions = {
                keepAlive: true,
                keepAliveMsecs: KEEP_ALIVE_MS
            }

            windowFetchOptions.fetchAgents = {
                http: new http.Agent(agentOptions),
                https: new https.Agent(agentOptions)
            }

            // Set the starting request id
            SSRServer._nextRequestId = 1

            // Note that the setup has been done.
            SSRServer._oneOffSetupDone = true
        }

        // Set the remote flag
        this.remote = Boolean(this.options.remote || process.env.REMOTE)
        setRemote(this.remote)
        setQuiet(this.options.quiet || process.env.SSR_QUIET)

        // Set the protocol for the SSR server listener - defaults to https on remote
        this.protocol = this.remote
            ? 'https'
            : process.env.DEV_SERVER_PROTOCOL || this.options.protocol

        this._validateConfiguration()

        // Cache some environment variables
        this._bundleId = process.env.BUNDLE_ID || 'development'
        this._deployId = process.env.DEPLOY_ID || '0'
        this._deployTarget = process.env.DEPLOY_TARGET || 'local'

        // Configure some computed option values
        if (this.remote) {
            // Remote server caches differently for normal and error responses
            this.options.defaultCacheControl = `max-age=${this.options.defaultCacheTimeSeconds}, s-maxage=${this.options.defaultCacheTimeSeconds}`
            this.options.errorCacheControl = `max-age=${this.options.errorCacheTimeSeconds}, s-maxage=${this.options.errorCacheTimeSeconds}`
        } else {
            // Local dev server doesn't cache by default
            this.options.defaultCacheControl = this.options.errorCacheControl = NO_CACHE
        }

        // The stylesheet path (a full path)
        this.stylesheetPath = path.resolve(
            process.cwd(),
            path.join(this.options.buildDir, this.options.stylesheetFilename)
        )

        // Ensure this is a boolean, and is always true for a remote
        // server.
        this.options.strictSSL = !!(this.remote || this.options.strictSSL)
        if (!this.options.strictSSL) {
            console.warn('SSRServer has strictSSL turned off for https requests')
        }

        // This is the external HOSTNAME under which we are serving the page.
        // The EXTERNAL_DOMAIN_NAME value technically only applies to remote
        // operation, but we allow it to be used for a local dev server also.
        this.appHostname = process.env.EXTERNAL_DOMAIN_NAME || `localhost:${this.options.port}`

        // To gain a small speed increase in the event that this
        // server needs to make a proxy request back to itself,
        // we kick off a DNS lookup for the appHostname. We don't
        // wait for it to complete, or care if it fails, so the
        // callback is a no-op.
        dns.lookup(this.appHostname, () => null)

        // This is the ORIGIN under which we are serving the page.
        // because it's an origin, it does not end with a slash.
        this.appOrigin = `${this.protocol}://${this.appHostname}`

        // HACK:
        // For backwards compatibility, isReactRoute.ORIGIN needs to be set to the
        // value of appOrigin during SSR. That value is not known until the server
        // starts, however – this is the earliest, most reliable place we can set it.
        isReactRoute.ORIGIN = this.appOrigin

        // Record the origin for fetch operations
        windowFetchOptions.appOrigin = this.appOrigin

        // Configure the agents' behaviour for self-signed
        // certificates.
        // We need to configure the https globalAgent to accept the
        // localhost certificate. Unfortunately, there's no simple way
        // to do that, so as a compromise, we allow any self-signed
        // certificate when running as the local dev server.
        https.globalAgent.options.rejectUnauthorized = this.remote
        windowFetchOptions.fetchAgents['https'].rejectUnauthorized = this.remote

        // Configure the server with the basic options
        setBuildDir(path.normalize(this.options.buildDir))
        updatePackageMobify(this.options.mobify)
        setBundleBaseUrl(this.remote)

        // Set some values that depend on configuration
        this.ssrLoaderURL = getAssetUrl(this.options.ssrLoaderFilename)
        this.mainCSSURL = getAssetUrl(this.options.stylesheetFilename)
        this.manifestURL = getAssetUrl(this.options.manifestPath)

        // Set up the proxies
        configureProxyConfigs(this.appHostname, this.protocol)

        // Setup source mapping for the external files so that we get
        // useful stack traces if we hit exceptions in them.

        // Clone the SCRIPT_FILES constant initial value so we can modify it.
        this.serverSideScriptFiles = SSRServer.SCRIPT_FILES.slice()

        // Set up the list of files that we embed in the rendered page
        this.clientSideScriptFiles = []

        // loadJQuery overrides loadCaptureJS if set. We do this because
        // code in jquery-response.js assumes availability of CaptureJS,
        // and code in the DangerousHTML component assumes that external
        // resources have been 'escaped' by CaptureJS. Making CaptureJS
        // fully optional would require indirect breaking changes to the
        // behaviour of DangerousHTML and jquery-response.js
        this.options.loadCaptureJS = this.options.loadCaptureJS || this.options.loadJQuery

        // If we're configured to do so, add capture.js to the lists of files
        // that are loaded for the PWA server-side and client-side.
        if (this.options.loadCaptureJS) {
            this.serverSideScriptFiles.push(CAPTURE_JS)
            this.clientSideScriptFiles.push(CAPTURE_JS)
        }

        // If we're configured to do so, add JQuery to the lists of files
        // that are loaded for the PWA server-side and client-side.
        if (this.options.loadJQuery) {
            this.serverSideScriptFiles.push(JQUERY_JS)
            this.clientSideScriptFiles.push(JQUERY_JS)
        }

        // Add the PWA vendor and main files to be executed server-side
        this.serverSideScriptFiles.push(
            path.join(BUILD, this.options.vendorFilename),
            path.join(BUILD, this.options.mainFilename)
        )

        // Add the browser detection script to the scripts to be loaded
        // if the URL for redirecting the client is provided
        const scriptsToLoad = this.options.unsupportedBrowserRedirect
            ? this.serverSideScriptFiles.concat(BROWSER_DETECTION)
            : this.serverSideScriptFiles

        // We can pass this.serverSideScriptFiles to this function since it will
        // include all the files from this.clientSideScriptFiles (and usually
        // some more).
        loadSSRScripts(this.options.buildDir, scriptsToLoad, staticAssets)

        // Load any local request-processor module so that we can use it.
        // We only do this for the local dev server
        this._requestProcessor = null
        if (!this.remote) {
            this._configureRequestProcessor()
        }

        // Create and configure the ExpressJS app
        this._configureExpressApp()

        // Record the querystring parser that Express is using
        this._queryStringParser = this.expressApp.set('query parser fn')

        // If we're running remotely, we also override the send()
        // method for ExpressJS's Response class (which is actually
        // a function). See responseSend for details.
        if (this.remote) {
            // http.ServerResponse.prototype
            const expressResponse = express.response
            expressResponse.send = responseSend(expressResponse.send)
        }

        // Grab some environment values that are used for metric
        // dimensions.
        this._metricDimensions = {
            Project: process.env.MOBIFY_PROPERTY_ID,
            Target: process.env.DEPLOY_TARGET
        }

        // Get a metrics sender instance
        this._metrics = MetricsSender.getSender()
        windowFetchOptions.sendMetric = this.sendMetric.bind(this)

        // Set the PersistentCache reference to null; this cache is
        // created on-demand (see the applicationCache property).
        this._applicationCache = null

        // Set this instance as the current server
        SSRServer._currentInstance = this

        // Initialize the variables that track responses in progress.
        // See _waitForResponses, _responseStarted and _responseFinished
        this._pendingResponses = {
            ids: [],
            promise: null,
            resolve: null
        }
    }

    /**
     * Close the server (stop it listening). Returns a Promise that resolves
     * when the server is closed. Provided for tests.
     *
     * @private
     * @returns {Promise<*>}
     */
    close() {
        const promises = []

        if (this.localDevServer) {
            promises.push(
                new Promise((resolve) =>
                    this.localDevServer.close(() => {
                        this.localDevServer = null
                        resolve()
                    })
                )
            )
        }

        /* istanbul ignore else */
        if (this.remoteServer) {
            promises.push(
                new Promise((resolve) =>
                    this.remoteServer.close(() => {
                        this.remoteServer = null
                        resolve()
                    })
                )
            )
        }

        // This is a synchronous operation
        if (this._applicationCache) {
            this._applicationCache.close()
        }

        return Promise.all(promises).then(() => {
            this.expressApp = null
        })
    }

    /**
     * Called from the constructor to validate options and environment
     * @private
     */
    _validateConfiguration() {
        // Check that we are running under a compatible version of node
        /* istanbul ignore next */
        const requiredNode = semver.Range(pkg.engines.node)
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
        if (this.remote) {
            const notFound = []
            SSRServer.REQUIRED_ENVIRONMENT.forEach((envVar) => {
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

        if (this.protocol !== 'http' && this.protocol !== 'https') {
            throw new Error(
                `Invalid local development server protocol ${this.protocol}. ` +
                    `Valid protocols are http and https.`
            )
        }

        // Verify the options
        if (!this.options.routes || !this.options.routes.length) {
            throw new Error(
                'The routes option passed to the SSR server ' +
                    'must be an array of route regular expressions'
            )
        }

        if (!this.options.buildDir) {
            throw new Error(
                'The buildDir option passed to the SSR server ' + 'must be a non-empty string'
            )
        }

        // Fix up the path in case we were passed a relative one
        this.options.buildDir = path.resolve(process.cwd(), this.options.buildDir)
        if (!fs.existsSync(this.options.buildDir)) {
            throw new Error(`The build directory ${this.options.buildDir} was not found`)
        }

        if (this.options.faviconPath) {
            this.options.faviconPath = path.resolve(this.options.buildDir, this.options.faviconPath)
            if (!fs.existsSync(this.options.faviconPath)) {
                console.warn(`Favicon file ${this.options.faviconPath} not found`)
                this.options.faviconPath = undefined
            }
        }

        const fetchAgents = this.options.fetchAgents
        /* istanbul ignore next*/
        if (fetchAgents) {
            const protocolToClass = {
                http: http.Agent,
                https: https.Agent
            }
            Object.entries(protocolToClass).forEach(([protocol, klass]) => {
                const agent = fetchAgents[protocol]
                if (agent && !(agent instanceof klass)) {
                    throw new Error(
                        `fetchAgents value for ${protocol} must be an instance of ${protocol}.Agent`
                    )
                }
            })
        }

        if (!(this.options.mobify instanceof Object)) {
            throw new Error(
                'The mobify option passed to the SSR server ' +
                    'must be an object (from package.json)'
            )
        }

        if (!this.options.mobify.pageNotFoundURL) {
            throw new Error(
                'The mobify.pageNotFoundURL value passed to the SSR server ' +
                    'must be a non-empty string(from package.json)'
            )
        }

        // This check is to ensure backwards compatibility with previous
        // versions of the SSRServer, where setting loadJQuery only caused
        // it to be loaded server-side. We correct the options, and warn
        // in the local dev server console.
        if (this.options.loadJQuery && this.options.ssrLoaderScripts) {
            const loaderScripts = this.options.ssrLoaderScripts
            // Remove JQuery from the list of scripts
            const filteredScripts = loaderScripts.filter(
                (filename) => !filename.includes('/jquery.')
            )

            if (filteredScripts.length !== loaderScripts.length) {
                /* istanbul ignore else */
                if (!this.remote) {
                    console.warn(
                        'The loadJQuery option is set, which will automatically ' +
                            'load JQuery client-side, but JQuery is also ' +
                            'present in the ssrLoaderScripts list. Removing ' +
                            'JQuery scripts from the list to avoid duplicate loads.'
                    )
                }
                this.options.ssrLoaderScripts = filteredScripts
            }
        }

        // Validating the values of the supportedBrowsers array.
        if (Array.isArray(this.options.supportedBrowsers)) {
            this.options.supportedBrowsers.forEach((supported) => {
                /* istanbul ignore else */
                if (supported instanceof RegExp) {
                    return
                }

                /* istanbul ignore else */
                if (!supported.name || !supported.version) {
                    throw new Error(
                        'An element of the supportedBrowsers option is not valid ' +
                            'provide either a RegExp or an Object with name and version properties ' +
                            `for ${JSON.stringify(supported)}`
                    )
                }

                if (typeof supported.name !== 'string') {
                    throw new Error(
                        'Supported browser name should be a string ' +
                            `${JSON.stringify(supported)}`
                    )
                } else {
                    supported.name = supported.name.toLowerCase()
                }

                /* istanbul ignore else */
                if (!Number.isInteger(supported.version)) {
                    throw new Error(
                        'Supported browser version should be an interger ' +
                            `${JSON.stringify(supported)}`
                    )
                }
            })
        } else {
            throw new Error(
                'The supportedBrowsers option is not an array ' +
                    `${JSON.stringify(this.options.supportedBrowsers)}`
            )
        }

        // If the unsupportedBrowserRedirect option is not a valid absolute
        // or relative URL, we want to throw an error, otherwise the client
        // will not be properly redirected.
        /* istanbul ignore else */
        if (this.options.unsupportedBrowserRedirect) {
            const url = URL.parse(this.options.unsupportedBrowserRedirect)
            if (url.protocol) {
                if (url.protocol !== 'http:' && url.protocol !== 'https:') {
                    throw new Error(
                        'The unsupportedBrowserRedirect is using a protocol other than HTTP ' +
                            `${JSON.stringify(this.options.unsupportedBrowserRedirect)}`
                    )
                }
                this.options.unsupportedBrowserRedirect = url.href
            } else {
                this.options.unsupportedBrowserRedirect = url.path
            }
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
     * @param response {express.response} the response that has started
     * @private
     */
    _responseStarted(response) {
        this._pendingResponses.ids.push(response.locals.requestId)
        const finish = () => this._responseFinished(response)
        // We hook both the 'finished' and 'close' events, so that
        // we properly complete any responses that fail (in which case
        // 'close' will fire, but 'finish' may not).
        response.once('finish', finish)
        response.once('close', finish)
    }

    /**
     * Works with waitForCompletion: when invoked by the 'finish' event of
     * any response, removes the response from the list of those pending
     * (using the id, so that multiple calls to this method will work
     * correctly). If there are no more responses pending, resolves any
     * Promise that is waiting for responses to complete.
     * @param response {express.response} the response that has finished
     * @private
     */
    _responseFinished(response) {
        const pending = this._pendingResponses
        if (pending.ids.length) {
            const requestId = response.locals.requestId
            pending.ids = pending.ids.filter((id) => id !== requestId)
            if (pending.ids.length === 0 && pending.resolve) {
                pending.resolve()
                pending.resolve = pending.promise = null
            }
        }
    }

    /**
     * Method for sending a metric with fixed dimensions.
     * See MetricsSender.send for more details on the parameters.
     *
     * @private
     * @param name {String} metric name
     * @param [value] {Number} metric value (defaults to 1)
     * @param [unit] {String} defaults to 'Count'
     * @param [dimensions] {Object} optional extra dimensions
     */
    sendMetric(name, value = 1, unit = 'Count', dimensions) {
        this._metrics.send([
            {
                name,
                value,
                timestamp: Date.now(),
                unit,
                dimensions: Object.assign({}, dimensions || {}, this._metricDimensions)
            }
        ])
    }

    /**
     * Get a reference to a Cache instance that can be used by
     * methods of this instance to store and retrieve data.
     *
     * The cache instance is created on-demand; once created it exists for
     * the lifetime of the SSRServer instance.
     *
     * In the local development server, the cache contents persist until the
     * server process exits (so it is empty when the server starts up). In
     * a deployed SSR server, the cache persists indefinitely and is shared
     * by all executing SSR Server instances. The cache is not cleared
     * when a new bundle is published.
     *
     * @returns {PersistentCache} the cache instance
     */
    get applicationCache() {
        if (!this._applicationCache) {
            /*
             To support testing of the caching: if process.env.CACHE_BUCKET_NAME
             is defined, the local dev server will use a remote cache.
             If this is a remote server and there is no CACHE_BUCKET_NAME
             defined, then the cache will be non-functional - gets will
             always return not-found, puts and deletes will do nothing.
             */
            const bucket = process.env.CACHE_BUCKET_NAME
            const prefix = process.env.CACHE_BUCKET_PREFIX
            const useRemoteCache = this.remote || bucket
            this._applicationCache = new PersistentCache({
                useLocalCache: !useRemoteCache,
                bucket,
                prefix,
                sendMetric: this.sendMetric.bind(this)
            })
            localDevLog(`Created application cache`)
        }
        return this._applicationCache
    }

    /**
     * A backwards compatibility property that returns the
     * current applicationCache. You should use the applicationCache
     * property directly. See the docs for the applicationCache property
     * for more information on the cache.
     *
     * @deprecated
     * @returns {PersistentCache} the cache instance
     */
    get persistentCache() {
        /* istanbul ignore else */
        if (!this.remote) {
            console.warn(
                'The persistentCache property of the SSR Server is deprecated. Please use applicationCache instead.'
            )
        }
        return this.applicationCache
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
     * Requests that come to a deployed SSR Server contain headers that
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
     * @param request {IncomingMessage} the request to generate the key for.
     * @param [options] {Object} values that affect the cache key generation.
     * @param [options.extras] {Array<String|undefined>} extra string values
     * to be included in the key.
     * @param [options.ignoreDeviceType] {Boolean} set this to true to suppress
     * automatic variation of the key by device type.
     * @param [options.ignoreRequestClass] {Boolean} set this to true to suppress
     * automatic variation of the key by request class.
     * @returns {String} the generated key.
     */
    static generateCacheKey(request, options = {}) {
        let {pathname, query} = URL.parse(request.url)

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
            const deviceTypes = detectDeviceTypes(request)

            if (deviceTypes && !!deviceTypes.length) {
                deviceTypes.forEach((deviceType) => {
                    elements.push(`device=${deviceType}`)
                })
            }
        }

        if (!options.ignoreRequestClass) {
            const requestClass = request.get(X_MOBIFY_REQUEST_CLASS)
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
     * @param request {http.IncomingMessage} the request
     * @param response {http.ServerResponse} the response
     * @returns {Promise} resolved when caching is done (also
     * stored in locals.responseCaching.promise
     * @private
     */
    _storeResponseInCache(request, response) {
        const locals = response.locals
        const caching = locals.responseCaching

        const metadata = {
            status: response.statusCode,
            headers: response.getHeaders()
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

        const cacheControl = parseCacheControl(response.get('cache-control'))
        const expiration = parseInt(
            caching.expiration ||
                cacheControl['s-maxage'] ||
                cacheControl['max-age'] ||
                7 * 24 * 3600
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
            this.applicationCache
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
     * If no key is provided, it's generated by SSRServer.generateCacheKey.
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
     * @param request {express.request}
     * @param response {express.response}
     * @param [expiration] {Number} the number of seconds
     * that a cached response should persist in the cache. If this is
     * not provided, then the expiration time is taken from the
     * Cache-Control header; the s-maxage value is used if available,
     * then the max-age value. If no value can be found in the
     * Cache-Control header, the default expiration time is
     * one week.
     * @param [key] {String} the key to use - if this is not supplied,
     * SSRServer.generateCacheKey will be called to derive the key.
     * @param [namespace] {String|undefined} the cache namespace to use.
     * @param [shouldCacheResponse] {Function} an optional callback that is passed a
     * Response after it has been sent but immediately before it is stored in
     * the cache, and can control whether or not caching actually takes place.
     * The function takes the request and response as parameters and should
     * return true if the response should be cached, false if not.
     */
    cacheResponseWhenDone({request, response, expiration, key, namespace, shouldCacheResponse}) {
        const locals = response.locals
        const caching = locals.responseCaching

        // If we have a key passed in, use that.
        // If we have a key already generated by getResponseFromCache, use that.
        // Otherwise generate the key from the request
        /* istanbul ignore next */
        caching.cacheKey = key || caching.cacheKey || SSRServer.generateCacheKey(request)

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
        wrapResponseWrite(response)

        /*
         Patch the end() method of the response to call _storeResponseInCache.
         We use this patching method instead of firing on the 'finished' event
         because we want to guarantee that caching is complete before we
         send the event. If we use the event, then caching may happen after
         the event is complete, but in a Lambda environment processing is
         halted once the event is sent, so caching might not occur.
         */
        const originalEnd = response.end
        response.end = (...params) => {
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
                response.write(data, encoding)
            }

            // The response has been sent. If there is a shouldCacheResponse
            // callback, we call it to decide whether to cache or not.
            if (shouldCacheResponse) {
                if (!shouldCacheResponse(request, response)) {
                    localDevLog(`Req ${locals.requestId}: not caching response for ${request.url}`)
                    return originalEnd.call(response, callback)
                }
            }

            // We know that all the data has been written, so we
            // can now store the response in the cache and call
            // end() on it.
            const timer = response.locals.timer
            this._applicationCache._cacheDeletePromise
                .then(() => {
                    localDevLog(`Req ${locals.requestId}: caching response for ${request.url}`)
                    timer.start('cache-response')
                    return this._storeResponseInCache(request, response).then(() => {
                        timer.end('cache-response')
                    })
                })
                .finally(() => {
                    originalEnd.call(response, callback)
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
     */
    sendCachedResponse(cached) {
        if (!(cached && cached.found)) {
            throw new Error(`Cannot send a non-cached CachedResponse`)
        }
        cached._send()
        this._completeResponse(cached._response)
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
     * If no key is provided, it's generated by SSRServer.generateCacheKey.
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
     * @param request {express.request}
     * @param response {express.response}
     * @param [key] {String} the key to use - if this is not supplied,
     * SSRServer.generateCacheKey will be called to derive the key.
     * @param [namespace] {String|undefined} the cache namespace to use.
     * @returns {Promise<CachedResponse>} resolves to a CachedResponse
     * that represents the result of the cache lookup.
     */
    getResponseFromCache({request, response, namespace, key}) {
        /* istanbul ignore next */
        const locals = response.locals
        const workingKey = key || SSRServer.generateCacheKey(request)

        // Save the key as the default for caching
        locals.responseCaching.cacheKey = workingKey

        // Return a Promise that handles the asynchronous cache lookup
        const timer = response.locals.timer
        timer.start('check-response-cache')
        return this.applicationCache.get({key: workingKey, namespace}).then((entry) => {
            timer.end('check-response-cache')

            localDevLog(
                `Req ${locals.requestId}: ${
                    entry.found ? 'Found' : 'Did not find'
                } cached response for ${request.url}`
            )

            if (!entry.found) {
                response.setHeader(X_MOBIFY_FROM_CACHE, 'false')
            }

            return new CachedResponse({
                entry,
                request,
                response
            })
        })
    }

    /**
     * A static method for handling dev server errors
     *
     * @private
     * @param {*} proc - Node process
     * @param {*} devServer - dev server to attach the listener to
     * @param {*} log - logging function
     */
    static _serverErrorHandler(proc, devServer, log) {
        return (e) => {
            if (e.code === 'EADDRINUSE') {
                log(`This port is already being used by another process.`)
                devServer.close()
                proc.exit(2)
            }
        }
    }

    /**
     * Return a reference to the most recently constructed SSRServer instance
     *
     * @return {SSRServer|*}
     * @private
     */
    static getCurrentServer() {
        return SSRServer._currentInstance
    }

    /**
     * ExpressJS middleware handler that calls this class instance's
     * requestHook.
     * @private
     */
    _callRequestHook(request, response, next) {
        // If the path is /, we enforce that the only methods
        // allowed are GET, HEAD or OPTIONS. This is a restriction
        // imposed by API Gateway: we enforce it here so that the
        // local dev server has the same behaviour.
        if (request.path === '/' && !STANDARD_METHODS.includes(request.method)) {
            response.status(405)
            return this._completeResponse(response)
        }

        // Start timing this wrapper
        const timer = response.locals.timer
        timer.start('call-request-hook')
        let timerEnded = false

        // In theory, we can use response.finished to tell if the
        // requestHook handled the response, but in practice we can't
        // rely on the hook calling response.end(). Instead, we track
        // whether the hook called next() or not. If it did not, we
        // assume it handled the response.
        let nextCalled = false
        const wrappedNext = () => {
            nextCalled = true
            timer.end('call-request-hook')
            timerEnded = true
            next()
        }

        // The metric name that will be emitted if the hook handled the
        // request
        let metricName = 'RequestHook'

        // Call the requestHook
        try {
            // Note that as a rule, the options passed to the requestHook
            // and the responseHook should be the same.
            this.requestHook(request, response, wrappedNext, {
                // Running local or remote
                local: !this.remote,
                // The bundleId as a string
                /* istanbul ignore next */
                bundleId: this._bundleId,
                // The deployId as a string
                /* istanbul ignore next */
                deployId: this._deployId,
                // The deploy target as a string
                deployTarget: this._deployTarget,
                // An implementation of fetch
                fetch: windowFetch,
                // Current hostname/origin
                appHostname: this.appHostname,
                appOrigin: this.appOrigin,
                // Proxy configurations
                proxyConfigs,
                // Request class
                requestClass: request.headers[X_MOBIFY_REQUEST_CLASS]
            })
            if (!timerEnded) {
                timer.end('call-request-hook')
                timerEnded = true
            }
        } catch (err) {
            const msgBase = `Error in requestHook for ${request.path}`
            /* istanbul ignore next */
            const msg =
                /* istanbul ignore next */
                this.remote
                    ? msgBase
                    : /* istanbul ignore next */
                      `${msgBase}: ${err.stack || err.message}`
            console.error(`Req ${response.locals.requestId}: ${msg}`)
            // Send a detailed response for the local dev server, a short
            // one for a remote server.
            response.status(500).send(msg)
            metricName = 'RequestHookError'
            response.locals.timer.clear('request-hook')
        }

        // Emit metrics if the requestHook handled the response, or if
        // an error was caught. We assume that if we caught an error,
        // next won't have been called.
        if (!nextCalled) {
            this.sendMetric(metricName)

            // We don't want to end the request immediately, because it's
            // reasonable for the requestHook to handle the response in
            // a Promise, so it may still be pending.
            if (response.finished) {
                // The response is fully finished now, so we can end it.
                this._completeResponse(response)
            } else {
                // Assume the response is pending; wait for the finish event.
                response.on('finish', () => this._completeResponse(response))
            }
        }
    }

    /**
     * ExpressJS middleware that will reject any HTTP method not in
     * STANDARD_METHODS with a 405 Method Not Allowed.
     * @private
     */
    _rejectNonStandardMethods(req, res, next) {
        if (!STANDARD_METHODS.includes(req.method)) {
            localDevLog(
                `Req ${res.locals.requestId}: Rejecting ${req.method} request to ${req.path}`
            )
            res.status(405)
            this._completeResponse(res)
        } else {
            next()
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
    _processIncomingRequest(req, res) {
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
            // Log the SSR Server request id plus the cloudfront
            // x-edge-request-id value. The resulting line in the logs
            // will automatically include the lambda RequestId, so
            // one line links all ids.
            console.log(`Req ${res.locals.requestId} for x-edge-request-id ${cloudfrontId}`)
        }

        // Apply the request processor
        const requestProcessor = !this.remote && this._requestProcessor
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
                    appHostname: this.appHostname,
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
                req.query = this._queryStringParser(updatedQuerystring)
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
     * through the SSR Server.
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
    _prepNonProxyRequest(req, res, next) {
        // Strip cookies from the request
        delete req.headers.cookie

        // Set the Host header
        req.headers.host = this.appHostname

        // Replace any Origin header
        if (req.headers.origin) {
            req.headers.origin = this.appOrigin
        }

        // In an Express Response, all cookie setting ends up
        // calling setHeader, so we override that to allow us
        // to intercept and discard cookie setting.
        const setHeader = Object.getPrototypeOf(res).setHeader
        const remote = this.remote
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
     * Called from the constructor to load any request processor code
     * (set as this._requestProcessor)
     * @private
     */
    _configureRequestProcessor() {
        // At this point, buildDir will always be absolute
        const requestProcessorPath = path.join(this.options.buildDir, 'request-processor.js')

        if (fs.existsSync(requestProcessorPath)) {
            localDevLog(`Loading request processor from ${requestProcessorPath}`)
            // Dynamically require() in the script, which gives us a module.
            // We can't just use require, since this code is webpack'd, which
            // replaces require with a webpack-module-loading function.
            // We use the actual node require via this interesting hack
            const nodeRequire = eval('require') // eslint-disable-line no-eval
            this._requestProcessor = nodeRequire(requestProcessorPath)
            // Verify that the module has a processRequest export
            /* istanbul ignore next */
            if (!this._requestProcessor.processRequest) {
                throw new Error(
                    `Request processor module ${requestProcessorPath} ` +
                        `does not export processRequest`
                )
            }
        }
    }

    /**
     * Called from the constructor to set up the Express app (this.expressApp)
     * @private
     */
    _configureExpressApp() {
        // Create our core Express server
        this.expressApp = express()

        // Attach this function as early as possible. It does timing
        // and applies some early processing that must occur before
        // anything else.
        this.expressApp.use((req, res, next) => {
            const locals = res.locals
            locals.requestStart = Date.now()
            locals.afterResponseCalled = false
            locals.responseCaching = {}
            locals.requestId = SSRServer._nextRequestId++
            locals.timer = new PerformanceTimer(`req${locals.requestId}`)

            // Track this response
            this._responseStarted(res)

            // Start timing
            locals.timer.start('express-overall')

            // Apply custom query parameter parsing.
            this._processIncomingRequest(req, res)

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
                        this.sendMetric(
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
                        this.sendMetric(metricName)
                    }
                    locals.timer.finish()

                    if (!this.remote || process.env.LOG_TIMING) {
                        const timing = locals.timer.summary
                            .map((entry) => `  ${entry.name}: ${entry.duration.toFixed(2)} mS`)
                            .join('\n')
                        console.log(`Req ${locals.requestId} timing:\n${timing}\n`)
                    }

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
        })

        // If we've been given custom http(s) agent(s), then we need
        // to configure the global agents from them, so that options
        // like ciphers are applied globally.
        if (this.options.fetchAgents) {
            const fetchOptions = getWindowFetchOptions()
            for (let secure = 0; secure <= 1; secure++) {
                const protocol = secure ? 'https' : 'http'
                const agent = this.options.fetchAgents[protocol]
                if (agent) {
                    // Update the windowFetch agent
                    const fetchAgent = fetchOptions.fetchAgents[protocol]
                    /* istanbul ignore else */
                    if (fetchAgent) {
                        localDevLog(`Updating default ${protocol}.Agent`)
                        updateGlobalAgentOptions(agent, fetchAgent)
                    }

                    // Update the global agent
                    /* istanbul ignore else */
                    const module = secure ? https : http
                    localDevLog(`Updating ${protocol}.globalAgent`)
                    updateGlobalAgentOptions(agent, module.globalAgent)
                }
            }
        }

        if (!this.remote) {
            // For local dev, we compress responses (for remote, we let the
            // CDN do it).
            this.expressApp.use(
                compression({
                    level: 9,
                    filter: shouldCompress
                })
            )

            // Configure logging
            if (!isQuiet()) {
                this.expressApp.use(
                    expressLogging(
                        ':method :url :status :response-time ms - :res[content-length] :res[content-type]'
                    )
                )
            }

            // Proxy bundle asset requests to the local
            // build directory.
            this.expressApp.use(
                '/mobify/bundle/development',
                express.static(this.options.buildDir, {
                    dotFiles: 'deny',
                    setHeaders: SSRServer._setLocalAssetHeaders,
                    fallthrough: false
                })
            )

            // Configure hostname and port.
            // Custom values are supported via environment variables.
            let hostname =
                process.env.LISTEN_ADDRESS || process.env.EXTERNAL_DOMAIN_NAME || 'localhost'
            let port = this.options.port

            const parsedHost = parseHost(hostname)
            /* istanbul ignore next */
            if (parsedHost.port) {
                // hostname has a port in it. Rewrite hostname so it does not
                // include the port, and override the options.port with this
                // new port value
                hostname = parsedHost.hostname
                port = parsedHost.port
            }

            if (this.protocol === 'https') {
                const sslFilePath = this.options.sslFilePath
                let sslFile
                if (sslFilePath && sslFilePath.endsWith('.pem')) {
                    try {
                        sslFile = fs.readFileSync(sslFilePath)
                    } catch (e) {
                        /* istanbul ignore next */
                        console.warn(`Could not read file ${sslFilePath}: ${e}`)
                    }
                }

                if (!sslFile) {
                    throw new Error(
                        'The sslFilePath option passed to the SSR server constructor ' +
                            'must be a path to an SSL certificate file ' +
                            'in PEM format, whose name ends with ".pem". ' +
                            'See the "cert" and "key" options on ' +
                            'https://nodejs.org/api/tls.html#tls_tls_createsecurecontext_options'
                    )
                }

                this.localDevServer = https.createServer(
                    {
                        // See https://nodejs.org/api/tls.html#tls_tls_createsecurecontext_options
                        // for information about these options.
                        key: sslFile,
                        cert: sslFile
                    },
                    this.expressApp
                )

                // Save a little memory - the closure for this function remains
                // in use throughout SSR, and we no longer need to reference the
                // cert/key file text.
                sslFile = null
            } else {
                // Create a local dev server listening on HTTP, as to not use a self-signed certificate
                // Use cases:
                // - accessing the server behind proxy (e.g. in a sandbox)
                // - accessing the dev server from mobile devices
                this.localDevServer = http.createServer(this.expressApp)
            }

            const onError = SSRServer._serverErrorHandler(process, this.localDevServer, localDevLog)
            this.localDevServer.on('error', onError)

            this.localDevServer.listen({hostname, port}, () => {
                localDevLog(
                    `${this.protocol.toUpperCase()} development server listening on ` +
                        `${this.protocol}://${hostname}:${port}`
                )
            })

            // Flush metrics at the end of sending. We do this here to
            // keep the code paths consistent between local and remote
            // servers. For the remote server, the flushing is done
            // by the Lambda integration.
            this.expressApp.use((req, res, next) => {
                res.on('finish', () => this._metrics.flush())
                next()
            })
        }

        // The /mobify/ping path provides a very fast and lightweight
        // healthcheck response.
        this.expressApp.get('/mobify/ping', (req, res) =>
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
            this.expressApp.use(config.proxyPath, config.proxy)

            // Caching proxy
            this.expressApp.use(config.cachingPath, config.cachingProxy)
        })

        // Beyond this point, we know that this is not a proxy request
        // and not a bundle request, so we can apply specific
        // processing.
        this.expressApp.use(this._prepNonProxyRequest.bind(this))

        // Serve this asset directly (in both remote and local modes)
        this.expressApp.get('/worker.js*', this._serveServiceWorkerLoader.bind(this))

        // Any path
        const rootWildcard = '/*'

        // Because the requestHook (below) can accept POST requests,
        // we need to include body-parser middleware.
        this.expressApp.post(rootWildcard, [
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

        // A route that invokes the requestHook for all methods.
        // This is an exception to the rule that the SSRServer only supports
        // GET requests. The hook can handle any standard HTTP method.
        // Any request that is not handled by the request hook is
        // then passed to the second middleware function, which will reject
        // it with a 405 Method Not Allowed if the method is not in
        // STANDARD_METHODS. All the remaining routes for the
        // ExpressJS app only support methods in STANDARD_METHODS.
        this.expressApp.all(
            rootWildcard,
            this._callRequestHook.bind(this),
            this._rejectNonStandardMethods.bind(this)
        )

        // Map favicon requests to the configured path. We always map
        // this route, because if there's no favicon configured we want
        // to return a 404.
        this.expressApp.get('/favicon.ico', (req, res) => {
            if (!this.options.faviconPath) {
                const msg = 'No faviconPath configured'
                console.warn(msg)
                res.status(404).send(msg)
            } else {
                res.sendFile(this.options.faviconPath, {
                    headers: {
                        [CACHE_CONTROL]: this.options.defaultCacheControl
                    },
                    cacheControl: false
                })
            }
        })

        // Perform server side rendering for all URLs that match one of our app route regexs
        this.expressApp.get(this.options.routes, this.ssr)

        // All other URLs should redirect to a 404 page
        // The 404 page will be rendered within the PWA
        this.expressApp.get(rootWildcard, this._redirectTo404Page.bind(this))

        // Wrap the Express app so that it can be used with AWS Lambda
        this.remoteServer = awsServerlessExpress.createServer(
            this.expressApp,
            null,
            binaryMimeTypes
        )
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
    static _setLocalAssetHeaders(res, assetPath) {
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
     * By default, this function sets the Content-Type to 'text/html',
     * the cache control to either the default or error cache control
     * times, the X-Powered-By to a value identifying the SDK version
     * and the X-Mobify-Request-Class (if and only if the request has
     * a defined class).
     *
     * @private
     */
    _setDefaultHeaders(request, response, hookOptions, responseOptions) {
        const mobify = getPackageMobify()

        // If the responseOptions are defined and include a statusCode,
        // use that value. If not, default to 404 for a page-not-found
        // path, or 200 for all other responses.
        response.status(
            (responseOptions && responseOptions.statusCode) ||
                (request.path === mobify.pageNotFoundURL && 404) ||
                200
        )

        // Set default headers
        response.header(CONTENT_TYPE, 'text/html')

        // Set different cache times for error and non-error responses
        response.set(
            CACHE_CONTROL,
            hookOptions && hookOptions.isErrorResponse
                ? this.options.errorCacheControl
                : this.options.defaultCacheControl
        )

        // If the responseOptions contains a 'headers' object, copy
        // values from it into the response. Because the headers are
        // provided by UPWA code, we wrap each setHeader call in a try
        // to catch issues.
        if (responseOptions && responseOptions.headers) {
            Object.entries(responseOptions.headers).forEach(([name, value]) => {
                try {
                    response.set(name, value)
                } catch (err) {
                    console.log(`Error setting response header "${name}" to "${value}": ${err}`)
                }
            })
        }

        // Override 'x-powered-by: express' header
        response.set(X_POWERED_BY, SSRServer.POWERED_BY)

        // If there's a requestClass, add an response header for it
        if (hookOptions.requestClass) {
            response.set(X_MOBIFY_REQUEST_CLASS, hookOptions.requestClass)
        }
    }

    /**
     * Call global.gc to do garbage collection
     * @private
     */
    collectGarbage() {
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
    }

    /**
     * Provided for use by requestHook overrides.
     *
     * Call this to return a response that is a redirect to a bundle asset.
     * Be careful with response caching - 301 responses can be cached. You
     * can call response.set to set the 'Cache-Control' header before
     * calling this function.
     *
     * This function returns a Promise that resolves when the response
     * has been sent. The caller does not need to wait on this Promise.
     *
     * @param {Object} options
     * @param {Request} options.request - the ExpressJS request object
     * @param {Response} options.response - the ExpressJS response object
     * @param {String} [options.path] - the path to the bundle asset (relative
     * to the bundle root/build directory). If this is falsy, then
     * request.path is used (i.e. '/robots.txt' would be the path for
     * 'robots.txt' at the top level of the build directory).
     * @param {Number} [options.redirect] a 301 or 302 status code, which
     * will be used to respond with a redirect to the bundle asset.
     */
    respondFromBundle({request, response, path, redirect = 301}) {
        // The path *may* start with a slash
        const workingPath = path || request.path

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
            `Req ${response.locals.requestId}: redirecting ${assetPath} to ${location} (${workingRedirect})`
        )
        response.redirect(workingRedirect, location)
    }

    /**
     * May be overridden in a derived class to implement a hook that's
     * called after the basic built-in routes but before the UPWA is passed
     * the route to handle. The route is available via request.path.
     *
     * This is an ExpressJS middleware function (see
     * http://expressjs.com/en/guide/writing-middleware.html). Unlike
     * the other SSR Server routes, it can handle GET, POST and other standard
     * HTTP methods.
     * The request method is available via request.method (as an
     * upper-case string).
     * The request path is available via request.originalUrl and will
     * start with a '/'.
     *
     * The requestHook is never called for the root path ('/').
     *
     * Requests handled by the requestHook will never contain cookies, and
     * any Set-Cookie headers added to responses will be stripped off before
     * they are sent. This is because all requests handled by the SSR Server
     * should be as cacheable as possible, and responses that are affected
     * by cookies are not generally cacheable.
     *
     * For POST requests, the body of the request may be
     * text (text/plain), JSON (application/json) or form data
     * (application/x-www-form-urlencoded).
     *
     * It's important to note that the requestHook does NOT execute in
     * the browser-like environment provided for the UPWA code. It's running
     * under NodeJS, so there is no 'window' object, no JQuery and
     * no DOM. Because the hook code may need to make external HTTP requests,
     * an implementation of `fetch` is provided in the `options` object
     * passed to the function.
     *
     * To let the route be handled by the UPWA, call next().
     * To handle a route, generate a response and do not call next().
     *
     * It's okay for the requestHook to delay sending the response (for
     * example, by waiting on a Promise before sending).
     *
     * @param {Request} request - the ExpressJS Request - this is the request
     * that the SSR Server is currently handling.
     * @param {Response} response - the ExpressJS Response - this is the response
     * to the current event. If your requestHook chooses to handle the request,
     * use this object to build the response.
     * @param {Function} next - pass control to the next handler
     * @param {Object} options  - contains reference data for the function
     * @param {Boolean} options.local - true if running in a local development
     * server, false if running in a remote SSR Server
     * @param {String} options.bundleId - the published bundle id number, or
     * 'development' if running in the local development server
     * @param {String} options.deployId - the id of the deploy, or
     * '0' if running in the local development server
     * @param {String} options.deployTarget - the id of the target on which
     * a deployed SSR server is running, or 'local' if running in the local
     * development server
     * @param {Function} options.fetch - the same 'fetch' function used by
     * the UPWA code (which supports fetches to proxy paths)
     * @param {String} options.appHostname - a string, the hostname for this
     * SSR Server (hostname, port)
     * @param {String} options.appOrigin - a string, the origin for this
     * SSR Server (protocol, hostname, port)
     * @param {Array} options.proxyConfigs - the proxyConfigs array describing
     * the proxy configuration - the same array returned by getProxyConfigs
     * from universal-utils
     * @param {String} [options.requestClass] - the request class, as set
     * by the request processor. Will be undefined if this request has no
     * class set.
     */
    // eslint-disable-next-line no-unused-vars
    requestHook(request, response, next, options) {
        // Don't handle this route, pass it to the next handler
        next()
    }

    /**
     * May be overridden in a derived class to implement a hook that's
     * called after the HTML page is ready and default header values
     * have been set.
     *
     * This function operates like ExpressJS middleware, but when it is
     * called, the response is already in progress. You can set/change
     * headers and the response status code using the response object,
     * but you should not send data or call `end()` on it.
     *
     * Note that the responseHook does NOT execute in the browser-like
     * environment provided for the UPWA code. It runs under NodeJS,
     * and there is no 'window' object.
     *
     * @param {Request} request - the ExpressJS Request
     * @param {Response} response - the ExpressJS Response
     * @param {Object} options - contains the 'local' and 'isErrorResponse' flags
     * @param {Boolean} options.local - true if running in a local development
     * server, false if running in a remote SSR Server
     * @param {String} options.bundleId - the published bundle id number, or
     * 'development' if running in the local development server
     * @param {String} options.deployId - the id of the deploy, or
     * '0' if running in the local development server
     * @param {String} options.deployTarget - the id of the target on which
     * a deployed SSR server is running, or 'local' if running in the local
     * development server
     * @param {Boolean} options.isErrorResponse: true if the page that is
     * being returned is an error page
     * @param {String} options.appHostname - a string, the hostname for this
     * SSR Server (hostname, port)
     * @param {String} options.appOrigin - a string, the origin for this
     * SSR Server (protocol, hostname, port)
     * @param {String} [options.requestClass] - the request class, as set
     * by the request processor. Will be undefined if this request has no
     * request class set.
     */
    // eslint-disable-next-line no-unused-vars
    responseHook(request, response, options) {
        // no-op
    }

    /**
     * Complete a response.
     * If the response hasn't yet had .end() called on it, call it.
     * This should be called at the completion of any response, so that
     * there is a central place to set up any post-response processing.
     *
     * @private
     * @param {express.Response} response - the ExpressJS response
     */
    _completeResponse(response) {
        // If the response is not yet finished...
        /* istanbul ignore else */
        if (!response.finished) {
            // ...end it.
            response.end()
        }
    }

    /**
     * Given a completed Rendering, write it to the given response
     *
     * @private
     * @param request {Request} the ExpressJS Request
     * @param response {Response} the ExpressJS Response
     * @param rendering {Rendering} the completed Rendering
     * @param {object} [responseOptions] - optional values to configure the
     * HTTP response
     * @param {Number} [responseOptions.statusCode] - the HTTP status code for
     * the response (defaults to 200 for all pages except the configured
     * pageNotFoundURL, which uses 404).
     */
    writeResponse(request, response, rendering, responseOptions) {
        // Note that as a rule, the options passed to the requestHook
        // and the responseHook should be the same.
        const hookOptions = {
            local: !this.remote,
            isErrorResponse: rendering.isErrorResponse,
            // The bundleId as a string
            bundleId: this._bundleId,
            // The deployId as a string
            deployId: this._deployId,
            // The deploy target as a string
            deployTarget: this._deployTarget,
            // Current hostname/origin
            appHostname: this.appHostname,
            appOrigin: this.appOrigin,
            // Request class
            requestClass: response.locals.requestClass,
            inlineScriptHashes: rendering.inlineScriptHashes
        }

        const locals = response.locals
        locals.timingResponse = true
        locals.timer.start('express-response')

        this._setDefaultHeaders(request, response, hookOptions, responseOptions)

        // Because a derived class may implement responseHook, we
        // catch, log and discard any errors.
        try {
            this.responseHook(request, response, hookOptions)
        } catch (err) {
            /* istanbul ignore next */
            catchAndLog(err, 'Error in responseHook')
        }

        // Only send the body if we were not asked to suppress it.
        if (!(responseOptions && responseOptions.suppressBody)) {
            // Send the page. To reduce memory use, we send each line rather
            // than join the whole thing.
            rendering.html.forEach((chunk) => {
                // toString() is needed to return String Obj value
                response.write(chunk.toString())
                response.write('\n')
            })
        }

        localDevLog(
            `Req ${locals.requestId}: render fully done in ${rendering.elapsedRenderTime} mS`
        )
        this.sendMetric('RenderTime', rendering.elapsedRenderTime, 'Milliseconds')
    }

    /**
     * Execute the given Script in the given JSDom app.
     *
     * This method is separate to allow it to be mocked for testing.
     *
     * @private
     */
    _executeScript(serverSideApp, scriptObject) {
        serverSideApp.runVMScript(scriptObject)
    }

    /**
     * Called to render a page
     *
     * @private
     * @param req {Request} the ExpressJS Request
     * @param res {Response} the ExpressJS Response
     * @returns {Promise<Rendering>} that resolves when rendering is complete
     * @private
     */
    _renderPage(req, res) {
        // The baseURL that we use for the JSDom context
        // must be the full URL from the incoming request.
        // We could use req.originalUrl or req.url - we choose
        // to use the latter so that any rewrites affect routing.
        const baseURL = `${this.appOrigin}${req.url}`
        const browserSize = getBrowserSize(req)
        const buildOrigin = getBundleBaseUrl()
        const requestId = res.locals.requestId
        const timer = res.locals.timer

        const windowFetchOptions = getWindowFetchOptions()
        windowFetchOptions.timer = timer
        windowFetchOptions.requestId = requestId

        infoLog(`Req ${requestId}: SSR of page '${baseURL}'`)

        timer.start('ssr-setup-1')
        // These options are used by the ssr loader and other parts of the
        // SDK. This object is included in window.Progressive both server-
        // and client-side.
        /* istanbul ignore next */
        const ssrOptions = {
            // The hostname and origin under which this page is served
            appHostname: this.appHostname,
            appOrigin: this.appOrigin,
            // The id of the bundle being served, as a string,
            // defaulting to 'development' for the local dev server
            bundleId: this._bundleId,
            // The id of the deploy as a string, defaulting to '0'
            // for the local dev server
            deployId: this._deployId,
            // On a local dev server, the DEPLOY_TARGET environment variable
            // isn't defined by default. Developers may define it if it's
            // used by the UPWA to modify behaviour.
            deployTarget: this._deployTarget,
            // Flags that indicate whether we loaded some key scripts
            loadCaptureJS: this.options.loadCaptureJS,
            loadJQuery: this.options.loadJQuery,
            // This is set true by default to ask the SSR loader to load
            // the stylesheet. If we insert a link in the HEAD of the
            // rendered page to load it, we change this flag to false.
            loadStylesheet: true,
            mainFilename: this.options.mainFilename,
            // The proxyConfigs are included so that UPWA code can identify
            // the backend(s) in use.
            proxyConfigs,
            // The request class (undefined by default)
            requestClass: res.locals.requestClass,
            stylesheetFilename: this.options.stylesheetFilename,
            supportedBrowsers: this.options.supportedBrowsers,
            vendorFilename: this.options.vendorFilename
        }

        // This option may be undefined
        const scriptsToLoad = this.options.ssrLoaderScripts
        if (scriptsToLoad && scriptsToLoad.length) {
            ssrOptions.ssrLoaderScripts = scriptsToLoad
        }

        // Create the initial version of window.Progressive that will be
        // included on the rendered page.
        const ssrWindowProgressive = {
            buildOrigin,
            cacheManifest: this.options.cacheHashManifest || {},
            isServerSide: false,
            isServerSideOrHydrating: true,
            isUniversal: true,
            ssrOptions,
            stylesheetLoaded: true,
            viewportSize: browserSize
        }

        // Create an Array of head HTML elements (as text)
        let headContent = [`<link rel="manifest" href="${this.manifestURL}">`]

        // If we're not optimizing CSS, then we want the stylesheet to
        // load as early as possible, so we add a link to the HEAD.
        if (!this.options.optimizeCSS) {
            headContent.push(
                `<link id="progressive-web-main-stylesheet" href="${this.mainCSSURL}" rel="stylesheet" type="text/css">`
            )
            // Tell the SSR loader not to load the stylesheet.
            ssrOptions.loadStylesheet = false
        }

        headContent.push(
            new ScriptTag(
                {},
                `window.Progressive = ${JSON.stringify(ssrWindowProgressive, null, 2)}\n` +
                    `window.Mobify = {points: [ +(new Date()) ]}`
            )
        )

        /* istanbul ignore else */
        if (this.options.unsupportedBrowserRedirect) {
            headContent.push(
                new ScriptTag(
                    {id: 'supported-browsers-check'},
                    [
                        `${getScriptFile(BROWSER_DETECTION)}`,
                        `var check = checkBrowserCompatibility(detectBrowser(window.navigator), window.Progressive.ssrOptions.supportedBrowsers);`,
                        `if (!check) {window.location.replace("${this.options.unsupportedBrowserRedirect}");}`
                    ].join('\n')
                )
            )
        }

        // Embed scripts that need to be embedded inline in the rendered page.
        this.clientSideScriptFiles.forEach((scriptFilename) => {
            // Get the script content
            const scriptText = getScriptFile(scriptFilename)
            /* istanbul ignore else */
            if (scriptText) {
                // Get the base filename
                const baseFilename = path.basename(scriptFilename)
                localDevLog(
                    `Req ${requestId}: including ${baseFilename} in the <head> of the response`
                )
                // Embed the script in the <head>
                headContent.push(`<!-- Embedded ${baseFilename} -->`)
                // We use the base filename as the id
                headContent.push(
                    new ScriptTag({id: baseFilename}, escapeJSText(scriptText).trimRight())
                )
                // For JQuery - set up window.Progressive.$
                if (scriptFilename === JQUERY_JS) {
                    headContent.push(new ScriptTag({}, 'window.Progressive.$=window.$;'))
                }
            } else {
                console.warn(`Could not load script file ${scriptFilename}`)
            }
        })

        // Create a Rendering object to handle the extraction of
        // the rendered HTML.
        let rendering = new Rendering({
            remote: this.remote,
            ssrLoaderURL: this.ssrLoaderURL,
            headContent,
            serverOnly: 'mobify_server_only' in req.query,
            timer,
            requestId
        })
        timer.end('ssr-setup-1')

        timer.start('ssr-jsdom-setup')
        let resourceLoader = new JSDOMCustomResourceLoader(
            {
                strictSSL: this.options.strictSSL,
                allowedUrls: this.options.allowedUrls
            },
            timer,
            requestId
        )

        // Create a JSDOM object to do the rendering, with a minimal HTML
        // document. We assign ids to the <head> and the <react-target>
        // to make it faster to find them when we need to extract the
        // HTML.
        let serverSideApp = new JSDOM(
            `<html>
                <head id="${HEAD_ELEMENT_ID}"></head>
                <body>
                    <div id="${REACT_TARGET_ID}" class="react-target"></div>
                </body>
            </html>`,
            {
                contentType: 'text/html',
                pretendToBeVisual: true,
                runScripts: 'dangerously',
                resources: resourceLoader,
                // JSDom 8.2.0 and above should respect this option.
                strictSSL: this.options.strictSSL,
                url: baseURL
            }
        )

        // Get a reference to the 'window' object of the JSDom environment
        let ssrWindow = serverSideApp.window

        // Configure some polyfill functions
        ssrWindow.scrollTo = function() {}
        ssrWindow.Mobify = {}

        // Create and initialize 'window.Progressive'
        // In window.Progressive, the buildOrigin is the location from which
        // bundle files should be loaded. It may be a relative URL, but
        // will include the /mobify/bundle/ path.
        // The buildUrl value is only present during server-side rendering,
        // and is the origin for files loaded directly from the build
        // directory. During SSR, such files have file:// URLs.
        const ssrProgressive = (ssrWindow.Progressive = {
            buildOrigin,
            buildUrl: getWebpackChunkPath(),
            loaderLoadsPWA: false,
            isServerSide: true,
            isServerSideOrHydrating: true,
            isUniversal: true,
            PerformanceTiming: {},
            // Clone the ssrOptions so that UPWA code can't modify them.
            ssrOptions: Object.assign({}, ssrOptions),
            ssrPerformanceTimer: timer,
            ssrRequestId: requestId,
            stylesheetLoaded: true,
            viewportSize: browserSize
        })
        timer.end('ssr-jsdom-setup')

        const server = this
        const runUPWA = function(resolve, reject) {
            timer.start('ssr-execution-all')
            // Call these within the app to indicate either
            // enough rendering is complete and the HTML can be sent to the browser
            // or rendering has failed and the fallback page should be sent to the browser
            ssrProgressive.initialRenderComplete = resolve
            ssrProgressive.initialRenderFailed = reject

            // provide some 'window' globals in the JSDom environment.
            ssrWindow.fetch = windowFetch
            ssrWindow.getWebpackChunkPath = getWebpackChunkPath

            // Expose the source map functions so that the JSDOM source map
            // support can use them.
            ssrWindow.mapSupport = {
                retrieveFile: getScriptFile,
                retrieveSourceMap: getSourceMapFile
            }

            // Execute external scripts using the jsDom Script API.
            // Set the 'filename' option when creating the script
            // so that we get better stack traces for errors.
            server.serverSideScriptFiles.forEach((scriptFilename, index) => {
                const scriptBasename = path.basename(scriptFilename)
                let scriptObject = scriptCache[scriptFilename]

                /* istanbul ignore else */
                if (!server.remote) {
                    localDevLog(
                        `Req ${requestId}: ${
                            scriptObject ? 'Using cached' : 'Compiling'
                        } Script for ${scriptFilename}`
                    )
                }

                if (!scriptObject) {
                    timer.start(`ssr-compilation-${scriptBasename}`)
                    scriptObject = scriptCache[scriptFilename] = new Script(
                        getScriptFile(scriptFilename),
                        {
                            filename: scriptFilename,
                            displayErrors: true
                        }
                    )
                    timer.end(`ssr-compilation-${scriptBasename}`)
                }

                // Execute this script within the JSDom app
                timer.start(`ssr-execution-${scriptBasename}`)
                // If this is the last file (main), then start the
                // timing of UPWA execution
                if (index === server.serverSideScriptFiles.length - 1) {
                    timer.start('upwa-execution')
                }
                server._executeScript(serverSideApp, scriptObject)
                timer.end(`ssr-execution-${scriptBasename}`)

                // JQuery-specific - legacy code may rely on
                // window.Progressive.$ existing, so we copy
                // window.$ to it. We do that now, after JQuery
                // has been executed but before the PWA code
                // is executed.
                if (scriptFilename === JQUERY_JS && ssrWindow.$) {
                    ssrProgressive.$ = ssrWindow.$
                }
            })
            timer.end('ssr-execution-all')
        }

        // Response options passed to ssrRenderingComplete
        let fullResponseOptions

        return (
            new Promise(runUPWA)
                // The renderPromise resolves when the PWA has rendered, with
                // the PWA state. We can now finish configuring the Rendering
                // object, and collect the output.
                .then(({appState, responseOptions}) => {
                    timer.end('upwa-execution')
                    fullResponseOptions = responseOptions || {}
                    timer.start('ssr-completion')
                    const result =
                        // If we were asked to suppress the body of the
                        // response, then we don't call rendering.complete
                        fullResponseOptions.suppressBody
                            ? RESOLVED_PROMISE
                            : rendering.complete({
                                  appState,
                                  optimizeCSS: this.options.optimizeCSS,
                                  stylesheetPath: this.stylesheetPath,
                                  windowObject: serverSideApp.window
                              })

                    timer.end('ssr-completion')
                    return result
                })
                .catch((error) => {
                    this.sendMetric('RenderErrors')
                    // We must override the responseOptions so that we
                    // can return a full error document.
                    fullResponseOptions = {
                        statusCode: 200,
                        headers: {},
                        suppressBody: false
                    }
                    rendering.renderErrorHandlerDocument(error, true)
                })
                .then(() => {
                    timer.time(
                        'ssr-write-response',
                        this.writeResponse.bind(this),
                        req,
                        res,
                        rendering,
                        fullResponseOptions
                    )

                    // Track memory usage, BEFORE we collect garbage, so
                    // that we report a representative value.
                    this.sendMetric('HeapUsed', process.memoryUsage().heapUsed, 'Bytes')

                    // Close down JSDom and remove references to objects
                    // to allow GC. If we don't do this explicitly,
                    // then references to internal JSDom structures can
                    // remain and leak.

                    // Close the window - this terminates all running timers and
                    // any events, and removes the document and all references
                    // that it holds.
                    ssrWindow.close()

                    // null-out references to objects to allow them to be GC'd
                    serverSideApp = ssrWindow = resourceLoader = rendering = headContent = null

                    // Forget any references to the main Promise resolve &
                    // reject functions (these can prevent Promises from
                    // being GC'd).
                    ssrProgressive.initialRenderComplete = null
                    ssrProgressive.initialRenderFailed = null

                    // Some modules used in UPWA code can attach properties
                    // to the global object. We remove those here. There's
                    // no simple way to detect these.
                    delete global.__SECRET_EMOTION__

                    // JSDom 14.0.0 contains a truly horrible hack
                    // that means any instance of JSDOMParse5Adapter will
                    // stay referenced by a patched prototype function of
                    // parse5's OpenElementStack. We can work around that
                    // by creating a new instance of JSDOMParse5Adapter
                    // that will re-patch OpenElementStack and remove the
                    // reference. We pass null as the documentImpl here -
                    // it's not referenced by the constructor, so it's
                    // safe to do that.
                    new JSDOMParse5Adapter(null) // eslint-disable-line no-new
                })
        )

        // There's no final catch() on this Promise chain - any last-minute
        // exception should be caught and handled in the caller.
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
    _serveServiceWorkerLoader(req, res) {
        // We apply this cache-control to all responses (200 and 404)
        res.set(
            CACHE_CONTROL,
            // The CDN can cache for 24 hours. The browser may not cache
            // the file.
            's-maxage=86400, max-age=0'
        )

        const workerFilePath = path.join(this.options.buildDir, req.path)

        // If there is no file, send a 404
        if (!fs.existsSync(workerFilePath)) {
            res.status(404).send()
            return
        }

        const content = fs.readFileSync(workerFilePath, {encoding: 'utf8'})

        // Serve the file, with a strong ETag
        res.set('etag', getHashForString(content))
        res.set(CONTENT_TYPE, 'application/javascript')
        res.set(X_POWERED_BY, SSRServer.POWERED_BY)
        res.send(content)
    }

    _redirectTo404Page(req, res) {
        // Redirect with a 302 (Moved temporarily) so that the redirect is not
        // permanently cached by browsers
        const mobify = getPackageMobify()
        res.redirect(302, mobify.pageNotFoundURL)
    }

    /**
     * Express GET handler for requests that require rendering of a response.
     * The actual responding is done by writing to "res" in
     * renderPage. The Promise returned by renderPage will
     * return after res.end() is called.
     * @private
     */
    _ssr(req, res) {
        res.locals.timer.start('ssr-overall')
        return (
            this._renderPage(req, res)
                // Add a final catch() handler - future versions of node may
                // exit the node process if promise rejections are uncaught.
                /* istanbul ignore next */
                .catch((err) => {
                    /* istanbul ignore next */
                    catchAndLog(err)
                    /* istanbul ignore next */
                    this.sendMetric('RenderErrors')
                })
                .then(() => {
                    this._completeResponse(res)
                    // We collect garbage because when a Lambda environment is
                    // re-used, we want to start with minimal memory usage. This
                    // call typically takes less than 100mS, and can dramatically
                    // reduce memory usage, so we accept the runtime cost.
                    // For the local dev server, we do this now. For a remote
                    // server, we use a different strategy (see SSRServer.get).
                    // We do this here in _ssr so that the closure over
                    // _renderPage is no longer in use, allowing the GC to
                    // clear all JSDom-related objects.
                    /* istanbul ignore else */
                    if (!this.remote) {
                        this.collectGarbage()
                    }
                    res.locals.timer.end('ssr-overall')
                })
        )
    }

    /**
     * Get the MetricsSender being used by this server
     * @private
     * @returns {MetricsSender}
     */
    get metrics() {
        return this._metrics
    }

    /**
     * Returns an ExpressJS get handler for all routes that require
     * rendering of a response.
     *
     * @private
     * @returns {function}
     */
    get ssr() {
        return this._ssr.bind(this)
    }
}

/**
 * A list of the environment variables that must be present in the
 * environment for the SSR server to run remotely.
 *
 * @private
 * @type {Array<String>}
 */
SSRServer.REQUIRED_ENVIRONMENT = [
    'BUNDLE_ID',
    'DEPLOY_TARGET',
    'EXTERNAL_DOMAIN_NAME',
    'MOBIFY_PROPERTY_ID'
]

// The order of these files is important; there are dependencies
// between them.
SSRServer.SCRIPT_FILES = [SOURCEMAP_SUPPORT, SOURCEMAP_INIT]

// Ad X-Powered-By constant
SSRServer.POWERED_BY = `Mobify ${sdkVersion}`

// Expose values for tests
SSRServer.Rendering = Rendering
SSRServer.NO_CACHE = NO_CACHE

/**
 * Lambda event handler.

 * When called with a server instance, this returns a 'get' function that
 * supports AWS Lambda integration using that server instance.
 *
 * The result of calling this function with an SSRServer instance should
 * be exported by the ssr.js file of a project.
 *
 * @example
 * export const get = SSRServer.get(server)
 * @param server {SSRServer} - the SSR Server instance
 */
SSRServer.get = (server) => {
    // This flag is initially false, and is set true on the first request
    // handled by a Lambda. If it is true on entry to the handler function,
    // it indicates that the Lambda container has been reused.
    let lambdaContainerReused = false

    return (event, context, callback) => {
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
            server.collectGarbage()
            server.sendMetric('LambdaReused')
        } else {
            // This is the first use of this container, so set the
            // reused flag for next time.
            lambdaContainerReused = true
            server.sendMetric('LambdaCreated')
        }

        // Proxy the request through to the server. When the response
        // is done, context.succeed will be called with the response
        // data.
        awsServerlessExpress.proxy(
            server.remoteServer, // The ExpressJS server
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
                    server
                        ._waitForResponses()
                        .then(() => server.metrics.flush())
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
}

// Patch the http.request/get and https.request/get
// functions to allow us to intercept them (since
// there are multiple ways to make requests in Node).
// We patch once and once only, because otherwise
// it's challenging to test the server under different
// conditions.
const getAppHost = () => SSRServer.getCurrentServer().appHostname
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
