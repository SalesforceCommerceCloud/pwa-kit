# SSR Server

<div class="c-callout">
 <p>
   <strong>Note:</strong>Looking for Reference docs for the SSR Server? Find them in our <a href="https://docs.mobify.com/progressive-web/latest/utility-functions/reference/SSRServer.html">Reference section</a>.
 </p>
</div>

The term *SSR Server* refers to:
* The code that runs the PWA to perform server-side rendering
* The [`SSRServer` class](#SSRServerClass) that does the work of running the PWA server-side 
* A running server on a development workstation that performs server-side rendering
* A running server in the Mobify Cloud that performs server-side rendering

## Local And Remote Operation <a name="localAndRemote" href="#localAndRemote">#</a>
The SSR Server runs in two different contexts. The **local development server**
(see below) is used to develop and test code on a local workstation. When a
server-side rendered PWA is deployed using Mobify Cloud, the SSR Server is in **remote** mode.
In most cases, the server behaves in the same way in both local and remote
modes. Where behaviour is different, it's documented below.

### Local development server <a name="localDevServer" href="#localDevServer">#</a>
When running as a local development server, the following environment
variables can be used to configure the server behaviour:

* `SSR_PROXY1` and `SSR_PROXY2` can be defined to override the default proxy
  configuration in the `mobify` object from the project `package.json`. The
  value of each variable should be an origin in the form
  `<protocol>://<hostname`- for example, `SSR_PROXY1=https://test.widgetcorp.com`
  would configure proxy 1 to point to `test.widgetcorp.com` using `https`.
* `EXTERNAL_DOMAIN_NAME` is the application hostname - the hostname at which
  the SSR server expects to receive requests. This can be an IP address and
  port. It's used to generate links that should refer back to the server
  (for example, links used to load the server-side rendered PWA in the browser), and for the
  local development server, it also defines the IP address and port on which
  the server listens for requests.
* `LISTEN_ADDRESS` can be a hostname or IP address, with an optional port
   number. It may be defined for the local development server if it should
   listen on a different IP address than that defined in `EXTERNAL_DOMAIN_NAME`
* `DEV_SERVER_PROTOCOL` can be used to run a local dev server without SSL, by
  by setting the value to `http`. If no value is provided, the local dev server
  runs on `https` by default. Running server on unencrypted HTTP is allowed only
  in the local development environment and is applicable only in certain use cases
  (e.g. when setting up the server behind a proxy). It is important to remember
  that certain PWA features will not work as expected without an encrypted
  connection. Notably, Service Worker behaviour will be affected, as Service
  Workers require HTTPS to work properly.

### SSR Server notes
* The SSR Server runs under Node.js. It provides a browser-like environment for the server-side rendered PWA, and executes the PWA code to render pages. That browser-like environment has a number of restrictions that exist because the output of server-side rendering of a given URL should be suitable for caching and sending to **any** browser that requests that same URL.
    * The user-agent string is not useful. You cannot query it to identify the browser.
    * The device window and viewport sizes are not useful. To work with viewport size, use the [`getBrowserSize` function](https://docs.mobify.com/progressive-web/latest/utility-functions/reference/global.html#getBrowserSize) 
    * If the server-side rendered PWA renders elements such as `<link>`, `<img>` or `<script>` that reference external resources, by default those resources are not loaded. It's possible to request that some are loaded, using the [`allowedUrls` option](https://docs.mobify.com/progressive-web/latest/utility-functions/reference/SSRServer.html) passed to the `SSRServer` constructor. The exception is that JavaScript files from the bundle may always be loaded (this allows tools like webpack to load chunks of code dynamically).
    * When the PWA is running server-side, it can make `fetch` and `XMLHttpRequest` requests for absolute URLs (including a protocol and hostname), and for URLs under the `/mobify/proxy/` path (see [proxying](../../../guides/proxying), but it cannot fetch any other URLs that are relative paths.

* For root path requests, the SSR server only supports GET requests. You cannot use POST, PUT DELETE, or any other method in root path requests to the SSR server. You *can* use any of the standard HTTP methods for all other paths supported by the [proxy](../../../guides/proxying).
  
* The SSR server doesn't support cookies to allow content caching. When requests are made to the SSR server, cookies in those requests are ignored. When the PWA is running server-side, no cookies are sent with requests that it makes, and set-cookie headers in responses are ignored. The proxying support **does** send cookies, so when the PWA is running client-side, it can make full use of cookies. 

## The SSRServer Class <a name="SSRServerClass" href="#SSRServerClass">#</a>
Server-side rendering is handled by an `SSRServer` class, which you should
instantiate in your project code. Usually this is done in an `ssr.js` file:

```javascript
const {SSRServer} = require('progressive-web-sdk/dist/ssr/ssr-server')

// Create an SSRServer
const server = new SSRServer(
    {
        // The server configuration goes here...
    }
)

// SSR requires that we export a single handler function called 'get', that
// supports AWS use of the server that we created above.
export const get = SSRServer.get(server)
```

The `SSRServer` class constructor takes an `options` object whose properties
control the server behaviour. The full list of options is provided in
[the documentation for the `SSRServer` class](https://docs.mobify.com/progressive-web/latest/utility-functions/reference/SSRServer.html)
In general, you can omit all the optional properties that provide defaults.

Some of the options are explained in more detail below:

* `buildDir` - (optional, defaults to 'build') - the build directory path,
as either an absolute path, or relative to the current working directory.
The build directory contains the project files generated by webpack.

* `defaultCacheTimeSeconds` (optional, defaults to 600) - the default cache
time for rendered pages and assets, set in the cache-control headers of the
response. This is only used in remote mode. The local development server always
returns responses with caching suppressed.

* `errorCacheTimeSeconds` (optional, defaults to 600) - the cache time for
error pages (only used in remote mode).

* `faviconPath` (optional) - the path to the favicon.ico file, as an
**absolute** path. If this value is not supplied, requests for `/favicon.ico`
will return a 404 and log a warning to the console. You can also use the
[`requestHook`](#requestHook) function to provide the icon.

* `loadCaptureJS` (optional, defaults to true) - set this to `true` to have
the Mobify capture.js library loaded both server- and client-side. If this
is `false`, capture.js will not be loaded.

* `loadJQuery` (optional, defaults to true) - set this to `true` to have
JQuery loaded both server- and client-side. If this is `false`, JQuery
will not be loaded.

* `manifestPath` (optional, defaults to 'static/manifest.json') - the name
of the manifest file, **relative** to the build directory.

* `mobify` (required) - the 'mobify' object from the project's `package.json`
file, containing the SSR parameters.

* `optimizeCSS` (optional, defaults to `false`) - if this property is set to
`true`, the SSR server will generate a minimal inline set of styles for the
rendered HTML, using the main stylesheet, and embed those styles into the
rendered page. This speeds up the display of the page, since the browser
does not have to wait for the stylesheet to load. However, the time required
to generate the inline styles is very dependent on the size of the stylesheet,
and large stylesheets can make rendering unacceptably slow. This option should
be tested before enabling it. Leaving the property set to `false` will skip
the inline style generation, and prioritize the loading of the stylesheet
instead.

* `protocol` (optional, defaults to `https`) - this property is only available
in the local development environment. If set to `http`, it creates an unencrypted
HTTP listener for the SSR server. Using this option allows for certain use-cases
when testing (e.g. running the server behind a proxy), but may affect PWA behaviour.
Notably, Service Workers are not designed to work on an unencrypted connection.

* `ssrLoaderScripts` (optional, defaults to an empty Array) - a JavaScript
Array list of paths, **relative** to the build directory, of scripts that
the SSR Loader should load **client-side**. Commonly used to load third-party
scripts included in the project, such as analytics.

* `supportedBrowsers` (optional, defaults to an Array of objects that is consistent
with [Mobify Platform Compatibility Matrix](../../../../../platform/compatibility/) - a
JavaScript Array list of objects representing supported browsers - either `RegExp` or
objects containing `name` (String), `version` (Integer) and `mobile` (optional, defaults to `false`)
keys. Used client-side to check browser support. Example value:
`[{name: 'chrome', version: 53, mobile: true}, /^(?!.*(opr|opera|edge)).*chrome\/(51|52\.1\.2)/]`.
This option is does not enable the browser support script - the `unsupportedBrowserRedirect` option
has to be set to a valid URL in order to enable the check (even if the `supportedBrowsers` Array
uses the default value or is set to a valid list of objects).

* `unsupportedBrowserRedirect` (optional, defaults to an empty String) - a String representing
a relative or absolute URL to which the browser should redirect unsupported browsers, used in
`window.location.replace`. If not provided, the browser detection script is not injected in the
head and run client-side, meaning there is no browser support check.

You can also customize the behaviour of the SSR Server by extending
the `SSRServer` class and providing implementations of any of the following
methods:

### The requestHook <a name="requestHook" href="#requestHook">#</a>
`requestHook(request, response, next, options)`

This method is called after handling of the basic built-in routes but before
the server-side rendered PWA is passed the route to handle. It should be implemented as an
[ExpressJS middleware function](http://expressjs.com/en/guide/writing-middleware.html).

If the requestHook doesn't handle a route, it should call `next()`. The default
implementation does nothing except call `next()`.

The `options` object passed to requestHook is documented in the
[documentation for the SSRServer](https://docs.mobify.com/progressive-web/latest/utility-functions/reference/SSRServer.html).
See the `requestHook` method.

Within the `requestHook`, it's safe to load files from the bundle to
build the response, as shown in the example below. However, if you do this
you **must** add the file to the `ssrShared` list in the `mobify` object
in the project's `package.json` file, so that the file is made available
to the SSR Server in remote mode.

The requestHook can perform asynchronous operations (such as fetching data
over http) before generating a response, but if it does not call `next()`
before returning, it *must* eventually generate a response.

The requestHook can also proxy a request using one of the available
proxy configurations (which are passed in `options.proxyConfigs`). Each
proxy config object contains a `proxy` function, which is an ExpressJS
middleware function that will proxy a request. An example of how to do
this is shown in the requestHook example below.

### The responseHook <a name="responseHook" href="#responseHook">#</a>
`responseHook(request, response, options)`

This method is called after the HTML page is ready and default header values
have been set. The method can override any headers.

The `options` object passed to responseHook contains the following properties:
* `local` - a boolean flag that is `true` if code is running in the local
development server, `false` if running in remote mode. This is commonly
used to set appropriate `cache-control` headers.

* `isErrorResponse` - a boolean flag that is `true` if the response is an
error page, `false` if it is a normal page. Commonly used to adjust
`cache-control` headers so that error pages are cached for a reduced time.

### Example of extending the `SSRServer` class <a name="SSRServerExample" href="#SSRServerExample">#</a>

```javascript
const path = require('path')
const fs = require('fs')
const {SSRServer} = require('progressive-web-sdk/dist/ssr/ssr-server')

const CWD = process.cwd()
const BUILD_DIR = path.resolve(CWD, 'build')
const FAVICON_PATH = path.resolve(CWD, 'build/static/ico/favicon.ico')

class ExtendedSSRServer extends SSRServer {

    /**
     * A request hook. This function is called to allow code to
     * intercept requests that should not be passed to the server-side rendered PWA, and handle them directly.
     * See the documentation of `requestHook` in the SSRServer class
     * documentation for full details of all the parameters passed to
     * this function.
     */
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
        */

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

        /*
         Here's an example of intercepting a request and responding with
         a redirect.
         */
        if (request.originalUrl.startsWith('/old/')) {
            response.status(301)
            // We want 301 redirects to be cached for a long time
            .set('Cache-Control', 'max-age=86400, s-maxage=86400')
            .set('Location', request.originalUrl.replace('/old/', '/new/'))
            .send()
            return
        }

        /*
         Here's an example of how to proxy requests than come in
         under the /special/resources path, assuming that the first
         proxy configuration is for the target server.
         */
        if (request.originalUrl.startsWith('/special/resources')) {
            const proxyConfig = options.proxyConfigs[0]
            proxyConfig.proxy(request, response, next)
            return
        }

        // If the path isn't handled by this function, then
        // we just call next() (standard ExpressJS middleware)
        next()
    }

    /**
     * A response hook. This function is called to allow code to modify
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
     * Note that the requestHook does NOT execute in the browser-like
     * environment provided for the server-side rendered PWA code. It runs under Node.js,
     * and there is no 'window' object.
     *
     * @param {Request} request - the ExpressJS Request
     * @param {Response} response - the ExpressJS Response
     * @param {Object} options - contains the 'local' and 'isErrorResponse' flags
     * @param {Boolean} options.local - true if running in a local development
     * server, false if running in a remote SSR Server
     * @param {String} options.bundleId - the published bundle id number, or
     * 'development' if running in the local development server
     * @param {String} options.deployTarget - the id of the target on which
     * a deployed SSR server is running, or 'local' if running in the local
     * development server
     * @param {Boolean} options.isErrorResponse: true if the page that is
     * being returned is an error page
     * @param {String} options.appHostname - a string, the hostname for this
     * SSR Server (hostname, port)
     * @param {String} options.appOrigin - a string, the origin for this
     * SSR Server (protocol, hostname, port)
     */
    responseHook(request, response, options) {  // eslint-disable-line no-unused-vars
        // Set the cache-control header:
        if (!options.local) {
                response.set(
                'cache-control',
                `max-age=${cacheTime}, s-maxage=${cacheTime}`
            )
        }
    }
}

// Create an SSRServer
const server = new ExtendedSSRServer(
    {
        // The server config goes here...
    }
)

// SSR requires that we export a single handler function called 'get', that
// supports AWS use of the server that we created above.
export const get = SSRServer.get(server)
```
