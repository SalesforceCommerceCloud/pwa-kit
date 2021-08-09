'use strict'

/* global WEBPACK_PACKAGE_JSON_MOBIFY */

/* eslint import/no-commonjs:0 */
const path = require('path')

const {SSRServer} = require('progressive-web-sdk/dist/ssr/ssr-server')

const CWD = process.cwd()
const BUILD_DIR = path.resolve(CWD, 'build')
const FAVICON_PATH = path.resolve(CWD, 'build/static/ico/favicon.ico')
const SSL_FILE_PATH = path.resolve(CWD, './dev-server/localhost.pem')

const assetsInBundle = {
    '/robots.txt': ['text/plain', 'static/robots.txt']
}

class ExtendedSSRServer extends SSRServer {
    /**
     * An example request hook. This function is called to allow code to
     * intercept requests that should not be passed to the UPWA, and handle
     * them directly.
     *
     * This is an ExpressJS middleware function (see
     * http://expressjs.com/en/guide/writing-middleware.html)

     * To handle a route, generate a response and do not call next(). It's
     * okay to defer the response (for example, generate it once a Promise
     * resolves). If you do use a Promise, be sure to catch() errors and
     * return an appropriate error response.
     *
     * To let the route be handled by the UPWA, call next().
     *
     * The options object contains:
     * local: a boolean that is true if running in a local development
     * server, false if running in a remote SSR Server.
     *
     * The route is available via request.path
     *
     * The SSR Server provides a convenience method to generate a redirect
     * response to a bundle asset. See the comment below with an example.
     *
     * @param request {Request} the ExpressJS Request
     * @param response {Response} the ExpressJS Response
     * @param next {Function} pass control to the next handler
     * @param options {Object} contains the 'local' flag
     */
    // eslint-disable-next-line no-unused-vars
    requestHook(request, response, next, options) {
        /*
         Here's an example of how to respond to requests for assets
         that are in the bundle by serving them directly from
         disk. Any bundle assets served this way must be in the ssrShared
         list in the 'mobify' object in 'package.json'.

         In general, it is much more efficient to use the correct paths
         for bundle assets (/mobify/proxy/bundle). The requestHook should
         only be used when the request path is fixed (for example, the
         robots.txt or favicon.ico files are always requested from the
         root of the site).

        // map asset to content-type & path
        const assetsInBundle = {
            '/robots.txt': ['text/plain', 'static/robots.txt'],
            '/favicon.ico': ['image/x-icon', 'static/ico/favicon.ico']
        }

        // Check if the request is for one of the bundle assets
        const path = Object.keys(assetsInBundle).find(
            // Use startsWith so that we ignore query parameters
            (key) => request.path.startsWith(key)
        )

        // If we found a match, send the file. If the file doesn't
        // exist, response.sendFile will return a 404.
        if (path) {
            const [contentType, buildPath] = assetsInBundle[path]
            response.sendFile(
                buildPath,
                {
                    // Directory containing bundle files
                    root: BUILD_DIR,
                    // maxAge for caching (in mS)
                    maxAge: (
                        // local dev server serves a non-cacheable response
                        // otherwise cache for 24 hours
                        !options.local ? 0 : 86400 * 1000
                    ),
                    // Headers for the response
                    headers: {
                        'Content-Type': contentType
                    }
                }
            )
            return
        }
        */

        const path = Object.keys(assetsInBundle).find(
            // Use startsWith so that we ignore query parameters
            (key) => request.path.startsWith(key)
        )

        if (path) {
            const [contentType, buildPath] = assetsInBundle[path]
            response.sendFile(buildPath, {
                // Directory containing bundle files
                root: BUILD_DIR,
                // maxAge for caching (in mS)
                maxAge:
                    // local dev server serves a non-cacheable response
                    // otherwise cache for 24 hours
                    !options.local ? 0 : 86400 * 1000,
                // Headers for the response
                headers: {
                    'Content-Type': contentType
                }
            })
            return
        }

        // If the path isn't handled by this function, then
        // we just call next() (standard ExpressJS middleware)
        next()
    }

    /**
     * An example response hook. This function is called to allow code to modify
     * the headers of a response sent from the SSR server. It's called when the
     * rendered page is complete and ready to send, once default headers have
     * been configured on the response.
     *
     * The hook may do any or all of the following:
     * 1. Override any cache-control headers. The headers will already be set
     *    to defaults (no caching for the local development server, 600 seconds
     *    caching for SSR pages, 60 seconds caching for error pages).
     * 2. Set or update any other headers.
     *
     * The Content-Type header will already have been set when this hook is called.
     *
     * Do NOT call response.status or response.send in this function.
     *
     * Options is an object with the following flags:
     * {
     *   local: <true> if running as a local dev server,
     *   isErrorResponse: <true> if the response is for an error page
     * }
     *
     * The function does not need to return any value to the caller.
     */
    // eslint-disable-next-line no-unused-vars
    responseHook(request, response, options) {
        // To set CSP:
        // const {inlineScriptHashes} = options
        // const scriptSrc = ['self', ...inlineScriptHashes].map((src) => `'${src}'`).join(' ')
        // const scriptDomains = ['https://www.google-analytics.com'].join(' ')
        // response.set('Content-Security-Policy', `script-src ${scriptSrc} ${scriptDomains}`)
        // To set the cache-control header:
        // response.set(
        //     'cache-control',
        //     `max-age=${cacheTime}, s-maxage=${cacheTime}`
        // )
        // Generally you would check options.local and only set the
        // headers if it is not true. For local development, it's easiest
        // to suppress caching, which is done by default.
    }
}

// Create an SSRServer
const server = new ExtendedSSRServer({
    // The build directory (an absolute path)
    buildDir: BUILD_DIR,

    // The cache time for SSR'd pages (defaults to 600 seconds)
    defaultCacheTimeSeconds: 600,

    // The cache time for error pages (defaults to 60 seconds)
    errorCacheTimeSeconds: 60,

    // The path to the favicon. This must also appear in
    // the mobify.ssrShared section of package.json.
    faviconPath: FAVICON_PATH,

    // Include capture JS inline in HTML responses.
    loadCaptureJS: false,

    // Include JQuery inline in HTML responses.
    loadJQuery: false,

    // The location of the apps manifest file relative to the build directory
    manifestPath: 'static/manifest.json',

    // This is the value of the 'mobify' object from package.json
    // provided by a webpack DefinePlugin
    mobify: WEBPACK_PACKAGE_JSON_MOBIFY,

    // The port that the local dev server listens on
    port: 3000,

    // An array of the PWA's route regexps
    routes: ['*'],

    // The path to the SSL file for the local dev server
    sslFilePath: SSL_FILE_PATH,

    // Here we can supply script filenames to be loaded by the SSR
    // loader.
    ssrLoaderScripts: [],

    // The protocol on which the development SSR server listens.
    // Note that http://localhost is treated as a secure context for development.
    protocol: 'http'
})

// SSR requires that we export a single handler function called 'get', that
// supports AWS use of the server that we created above.
export const get = SSRServer.get(server)
