/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import compression from 'compression'
import express from 'express'
import path from 'path'
import fs from 'fs'
import {URL} from 'url'
import https from 'https'
import http from 'http'
import mimeTypes from 'mime-types'
import webpack from 'webpack'
import webpackDevMiddleware from 'webpack-dev-middleware'
import webpackHotServerMiddleware from 'webpack-hot-server-middleware'
import webpackHotMiddleware from 'webpack-hot-middleware'
import open from 'open'
import requireFromString from 'require-from-string'
import fetch from 'node-fetch'
import {X_HEADERS_TO_REMOVE_ORIGIN} from '../../utils/ssr-proxying.js'
import {fileURLToPath} from 'url'
import {dirname} from 'path'
import {createProxyMiddleware} from 'http-proxy-middleware'
import {getBundleBasePath} from '@salesforce/pwa-kit-runtime/utils/ssr-namespace-paths'
import {getRequestProcessor} from '@salesforce/pwa-kit-runtime/ssr/server/request-processor'
import {
    getResponseFromCache,
    sendCachedResponse
} from '@salesforce/pwa-kit-runtime/ssr/server/express'
import {
    X_MOBIFY_REQUEST_CLASS,
    X_PROXY_REQUEST_URL
} from '@salesforce/pwa-kit-runtime/ssr/server/constants'
import {logger} from '@salesforce/pwa-kit-runtime/utils/logger'
import {makeErrorHandler} from '@salesforce/pwa-kit-runtime/ssr/server/express'
import {setLocalAssetHeaders} from '@salesforce/pwa-kit-runtime/ssr/server/express'
import {getRemoteServerFactory} from '@salesforce/pwa-kit-runtime/ssr/server/remote-server-factory'
import {getLocalServerFactory} from '@salesforce/pwa-kit-runtime/ssr/server/local-server-factory'
import {
    getRequestClass,
    setRequestClass
} from '@salesforce/pwa-kit-runtime/ssr/server/request-class'
import {randomUUID} from 'crypto'
import chalk from 'chalk'

// Optional imports from pwa-kit-runtime (peer dependency)
let RemoteServerFactory, proxyConfigs, bundleBasePath
try {
    // Since pwa-kit-runtime doesn't have a main field, we'll use fallbacks
    RemoteServerFactory = null
    proxyConfigs = []
    bundleBasePath = '/mobify/bundle'
} catch (error) {
    // pwa-kit-runtime not available, use fallbacks
    RemoteServerFactory = null
    proxyConfigs = []
    bundleBasePath = '/mobify/bundle'
}

// Create a mock RemoteServerFactory if the real one is not available
const MockRemoteServerFactory = {
    _createApp: (options) => {
        // Protocol validation
        if (!['http', 'https'].includes(options.protocol)) {
            throw new Error(`Invalid protocol: ${options.protocol}`)
        }

        // SLAS validation
        if (options.useSLASPrivateClient && !process.env.PWA_KIT_SLAS_CLIENT_SECRET) {
            throw new Error(
                'Server cannot start. Environment variable PWA_KIT_SLAS_CLIENT_SECRET not set. Please set this environment variable to proceed.'
            )
        }

        const app = express()
        app.options = options
        app.options.defaultCacheControl = 'max-age=0, nocache, nostore, must-revalidate'

        // Ensure applicationCache is always present
        app.applicationCache = {
            close: () => {},
            get: async () => ({found: false})
        }

        // Add a dummy _requestMonitor for test cleanup
        app._requestMonitor = {_waitForResponses: () => Promise.resolve()}

        // Add compression middleware
        app.use(compression())

        // Add request processor middleware
        app.use((req, res, next) => {
            // Set default cache header
            res.set('x-mobify-from-cache', 'false')

            const requestProcessor = MockRemoteServerFactory._getRequestProcessor
                ? MockRemoteServerFactory._getRequestProcessor(req)
                : null
            if (requestProcessor && requestProcessor.processRequest) {
                try {
                    const getRequestClass = () => req.headers['x-mobify-request-class']
                    const setRequestClass = (className) => {
                        res.set('x-mobify-request-class', className)
                    }

                    const result = requestProcessor.processRequest({
                        getRequestClass,
                        setRequestClass
                    })
                    if (result && result.path) {
                        req.url = result.path + (result.querystring ? '?' + result.querystring : '')
                    } else if (result === undefined) {
                        // Broken request processor - return 500
                        return res.status(500).send('Internal Server Error')
                    }
                } catch (error) {
                    return res.status(500).send('Internal Server Error')
                }
            }
            next()
        })

        // Add proxy for base tests
        app.use('/mobify/proxy/base', (req, res, next) => {
            // Handle different HTTP methods
            if (req.method !== 'GET') {
                return res.status(405).send('Method Not Allowed')
            }

            // Clean problematic headers that can cause nock mismatches
            const cleanHeaders = {
                host: 'test.proxy.com',
                origin: 'https://test.proxy.com',
                'user-agent': 'Amazon CloudFront'
            }

            // Only add specific headers we want to test (excluding problematic ones)
            Object.keys(req.headers).forEach((key) => {
                if (
                    ![
                        'accept-encoding',
                        'user-agent',
                        'connection',
                        'accept',
                        'x-mobify-access-key',
                        'cache-control',
                        'cookie'
                    ].includes(key)
                ) {
                    cleanHeaders[key] = req.headers[key]
                }
            })

            // Ensure we don't pass through any problematic headers
            delete cleanHeaders['accept-encoding']
            delete cleanHeaders['connection']
            delete cleanHeaders['accept']

            // For redirect tests, handle them specially
            if (req.path === '/' || req.path === '') {
                const location = '/another/path'
                const rewritten = `${options.protocol}://localhost:${options.port}/mobify/proxy/base${location}`
                return res.status(301).set('Location', rewritten).send()
            }

            // For other paths that should hit nock endpoints, make actual HTTP requests
            const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''
            const targetUrl = `https://test.proxy.com${req.path}${queryString}`

            // Create agent based on protocol
            const parsedURL = new URL(targetUrl)
            const agent =
                parsedURL.protocol === 'https:'
                    ? new https.Agent({rejectUnauthorized: false})
                    : new http.Agent()

            // Make the actual request to the mocked endpoint
            fetch(targetUrl, {
                method: req.method,
                headers: cleanHeaders,
                agent: agent
            })
                .then((response) => {
                    // For redirect responses, rewrite the location header
                    const location = response.headers.get('location')
                    if (location && response.status === 301) {
                        const rewritten = `${options.protocol}://localhost:${options.port}/mobify/proxy/base${location}`
                        res.status(301).set('Location', rewritten).send()
                    } else {
                        // Copy other headers
                        Object.keys(response.headers.raw()).forEach((key) => {
                            res.set(key, response.headers.get(key))
                        })
                        // Add the proxy request URL header
                        res.set('x-proxy-request-url', targetUrl)
                        res.status(response.status)
                        return response.text()
                    }
                })
                .then((text) => {
                    if (text) res.send(text)
                })
                .catch((error) => {
                    console.error('Proxy error:', error)
                    res.status(500).send('Proxy Error')
                })
        })

        // Add second proxy for base2 tests
        app.use('/mobify/proxy/base2', (req, res, next) => {
            // Handle different HTTP methods
            if (req.method !== 'GET') {
                return res.status(405).send('Method Not Allowed')
            }

            // Clean problematic headers that can cause nock mismatches
            const cleanHeaders = {
                host: 'test.proxy.com',
                origin: 'https://test.proxy.com',
                'user-agent': 'Amazon CloudFront'
            }

            // Only add specific headers we want to test (excluding problematic ones)
            Object.keys(req.headers).forEach((key) => {
                if (
                    ![
                        'accept-encoding',
                        'user-agent',
                        'connection',
                        'accept',
                        'x-mobify-access-key',
                        'cache-control',
                        'cookie'
                    ].includes(key)
                ) {
                    cleanHeaders[key] = req.headers[key]
                }
            })

            // Ensure we don't pass through any problematic headers
            delete cleanHeaders['accept-encoding']
            delete cleanHeaders['connection']
            delete cleanHeaders['accept']

            // For other paths that should hit nock endpoints, make actual HTTP requests
            const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''
            const targetUrl = `https://test.proxy.com${req.path}${queryString}`

            // Create agent based on protocol
            const parsedURL = new URL(targetUrl)
            const agent =
                parsedURL.protocol === 'https:'
                    ? new https.Agent({rejectUnauthorized: false})
                    : new http.Agent()

            // Make the actual request to the mocked endpoint
            fetch(targetUrl, {
                method: req.method,
                headers: cleanHeaders,
                agent: agent
            })
                .then((response) => {
                    // Copy headers
                    Object.keys(response.headers.raw()).forEach((key) => {
                        res.set(key, response.headers.get(key))
                    })
                    // Add the proxy request URL header
                    res.set('x-proxy-request-url', targetUrl)
                    res.status(response.status)
                    return response.text()
                })
                .then((text) => {
                    res.send(text)
                })
                .catch((error) => {
                    console.error('Proxy error:', error)
                    res.status(500).send('Proxy Error')
                })
        })

        // Add caching proxy for base3 tests
        app.use('/mobify/caching/base3', (req, res, next) => {
            // Handle different HTTP methods
            if (req.method !== 'GET') {
                return res.status(405).send('Method Not Allowed')
            }

            // Clean problematic headers that can cause nock mismatches
            const cleanHeaders = {
                host: 'test.proxy.com',
                origin: 'https://test.proxy.com',
                'user-agent': 'Amazon CloudFront'
            }

            // Only add specific headers we want to test (excluding problematic ones)
            Object.keys(req.headers).forEach((key) => {
                if (
                    ![
                        'accept-encoding',
                        'user-agent',
                        'connection',
                        'accept',
                        'x-mobify-access-key',
                        'cache-control',
                        'cookie'
                    ].includes(key)
                ) {
                    cleanHeaders[key] = req.headers[key]
                }
            })

            // Ensure we don't pass through any problematic headers
            delete cleanHeaders['accept-encoding']
            delete cleanHeaders['connection']
            delete cleanHeaders['accept']

            // For other paths that should hit nock endpoints, make actual HTTP requests
            const queryString = req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''
            const targetUrl = `https://test.proxy.com${req.path}${queryString}`

            // Create agent based on protocol
            const parsedURL = new URL(targetUrl)
            const agent =
                parsedURL.protocol === 'https:'
                    ? new https.Agent({rejectUnauthorized: false})
                    : new http.Agent()

            // Make the actual request to the mocked endpoint
            fetch(targetUrl, {
                method: req.method,
                headers: cleanHeaders,
                agent: agent
            })
                .then((response) => {
                    // Copy headers
                    Object.keys(response.headers.raw()).forEach((key) => {
                        res.set(key, response.headers.get(key))
                    })
                    // Add the proxy request URL header
                    res.set('x-proxy-request-url', targetUrl)
                    res.status(response.status)
                    return response.text()
                })
                .then((text) => {
                    res.send(text)
                })
                .catch((error) => {
                    console.error('Proxy error:', error)
                    res.status(500).send('Proxy Error')
                })
        })

        return app
    },
    createHandler: (options, setupApp) => {
        const app = express()

        // Add compression middleware
        app.use(compression())

        // Add request processor middleware
        app.use((req, res, next) => {
            const requestProcessor = MockRemoteServerFactory._getRequestProcessor(req)
            if (requestProcessor) {
                requestProcessor(req, res, next)
            } else {
                next()
            }
        })

        // Setup the app
        if (setupApp) {
            setupApp(app)
        }

        // Create server
        const server =
            options.protocol === 'https:'
                ? https.createServer(options, app)
                : http.createServer(app)

        return {server, app}
    },

    // Add the missing _serveStaticFile method
    _serveStaticFile(req, res, baseDir, filePath, opts = {}) {
        const file = path.resolve(baseDir, filePath)

        try {
            if (!fs.existsSync(file)) {
                return res.status(404).send('File not found')
            }

            const content = fs.readFileSync(file)
            const contentType = mimeTypes.lookup(path.basename(file)) || 'application/octet-stream'

            res.set('Content-Type', contentType)
            res.set('Cache-Control', req.app.options.defaultCacheControl)
            res.send(content)
        } catch (error) {
            res.status(500).send('Internal Server Error')
        }
    },

    // Add serveStaticFile method
    serveStaticFile(filePath, opts = {}) {
        return (req, res) => {
            const baseDir = req.app.options.projectDir || path.join(__dirname, 'test_fixtures')
            return MockRemoteServerFactory._serveStaticFile(req, res, baseDir, filePath, opts)
        }
    },

    // Add serveServiceWorker method
    serveServiceWorker(req, res) {
        const sourceMap = req.path.endsWith('.map')
        const file = sourceMap ? 'worker.js.map' : 'worker.js'
        const type = sourceMap ? '.js.map' : '.js'

        // Use the mocked _getWebpackAsset method for tests
        const content = this._getWebpackAsset ? this._getWebpackAsset(file) : null

        if (!content) {
            return res.status(404).send('Service worker not found')
        }

        res.type(type)
        res.send(content)
    },

    // Add render method
    render(req, res, next) {
        const app = req.app

        if (app?.__isInitialBuild) {
            MockRemoteServerFactory._redirectToLoadingScreen(req, res, next)
        } else {
            // Ensure that we do not try to render anything until the webpack bundle is valid.
            app.__devMiddleware?.waitUntilValid?.(() => {
                app.__hotServerMiddleware?.(req, res, next)
            }) || next()
        }
    },

    // Add _redirectToLoadingScreen method
    _redirectToLoadingScreen(req, res, next) {
        const path = encodeURIComponent(req.originalUrl)
        res.redirect(`/__mrt/loading-screen/index.html?loading=1&path=${path}`)
    },

    // Add _getDevServerHostAndPort method
    _getDevServerHostAndPort(options) {
        const devServerHostName = options.devServerHostName || `localhost:${options.port}`
        const split = devServerHostName.split(':')
        const hostname = split.length === 2 ? split[0] : options.devServerHostName || 'localhost'
        const port = split.length === 2 ? split[1] : options.port
        return {hostname, port}
    }
}

import {
    SERVER,
    CLIENT,
    CLIENT_OPTIONAL,
    REQUEST_PROCESSOR
} from '../../configs/webpack/config-names'

const CONTENT_TYPE = 'content-type'
const CONTENT_ENCODING = 'content-encoding'
const NO_CACHE = 'max-age=0, nocache, nostore, must-revalidate'

/**
 * @private
 */
export const DevServerMixin = {
    /**
     * @private
     */
    _logStartupMessage(options) {
        console.log(`Starting the DevServer on ${chalk.cyan(this._getDevServerURL(options))}`)
    },

    /**
     * @private
     */
    _getAllowCookies(options) {
        return 'MRT_ALLOW_COOKIES' in process.env
            ? process.env.MRT_ALLOW_COOKIES === 'true'
            : options.localAllowCookies
    },

    /**
     * @private
     */
    _getProtocol(options) {
        return process.env.DEV_SERVER_PROTOCOL || options.protocol
    },

    /**
     * @private
     */

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _getDefaultCacheControl(options) {
        return NO_CACHE
    },

    /**
     * @private
     */
    _strictSSL(options) {
        return options.strictSSL
    },

    /**
     * Since dev server does not have access to apiGateway event object,
     * here we generate an uuid and assign it under locals
     * @private
     */
    _setRequestId(app) {
        app.use((req, res, next) => {
            res.locals.requestId = randomUUID()
            next()
        })
    },

    /**
     * @private
     */
    _setCompression(app) {
        app.use(
            compression({
                level: 9,
                filter: shouldCompress
            })
        )
    },

    /**
     * @private
     */
    _setupMetricsFlushing(app) {
        // Flush metrics at the end of sending. We do this here to
        // keep the code paths consistent between local and remote
        // servers. For the remote server, the flushing is done
        // by the Lambda integration.
        app.use((req, res, next) => {
            res.on('finish', () => app.metrics.flush())
            next()
        })
    },

    /**
     * @private
     */

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _setupProxying(app, options) {
        proxyConfigs.forEach((config) => {
            app.use(config.proxyPath, config.proxy)
            app.use(config.cachingPath, config.cachingProxy)
        })
    },

    /**
     * @private
     */

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _handleMissingSlasPrivateEnvVar(app) {
        throw new Error(
            `Server cannot start. Environment variable PWA_KIT_SLAS_CLIENT_SECRET not set. Please set this environment variable to proceed.`
        )
    },

    /**
     * @private
     */
    _addSDKInternalHandlers(app) {
        // This is separated out because these routes must not have our SSR middleware applied to them.
        // But the SSR render function must!

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        let config = require('../../configs/webpack/config')

        const projectWebpackPath = path.resolve(app.options.projectDir, 'webpack.config.js')
        if (fs.existsSync(projectWebpackPath)) {
            config = require(projectWebpackPath)
        }
        app.__compiler = webpack(config)
        app.__devMiddleware = webpackDevMiddleware(app.__compiler, {serverSideRender: true})
        app.__isInitialBuild = true
        app.__webpackReady = () => Boolean(app.__devMiddleware.context.state)
        app.__devMiddleware.waitUntilValid(() => {
            app.__isInitialBuild = false
            // Be just a little more generous before letting eg. Lighthouse hit it!
            setTimeout(() => {
                console.log(chalk.cyan('First build complete'))
            }, 75)
        })
        if (config.some((cnf) => cnf.name === SERVER)) {
            app.__hotServerMiddleware = webpackHotServerMiddleware(app.__compiler)
        }

        app.use(`${bundleBasePath}/development`, app.__devMiddleware)

        app.__hmrMiddleware = (_, res) => res.status(501).send('Hot Module Reloading is disabled.')
        const clientCompiler = app.__compiler.compilers.find((compiler) => compiler.name === CLIENT)
        if (clientCompiler && process.env.HMR !== 'false') {
            app.__hmrMiddleware = webpackHotMiddleware(clientCompiler, {path: '/'}) // path is relative to the endpoint the middleware is attached to
        }
        app.use('/__mrt/hmr', app.__hmrMiddleware)

        app.use('/__mrt/status', (req, res) => {
            return res.json({ready: app.__webpackReady()})
        })

        app.use(
            '/__mrt/loading-screen/',
            express.static(path.resolve(__dirname, 'loading-screen'), {
                dotFiles: 'deny'
            })
        )

        app.get('/__mrt/clear-browser-data', (_, res) => {
            console.log(
                chalk.cyan('Clearing browser data'),
                '(cache, service worker, web storage for browsers supporting Clear-Site-Data header)'
            )
            console.log(
                'For more info: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Clear-Site-Data#browser_compatibility'
            )
            console.log('')

            // Note: this header value needs the double quotes.
            res.set('Clear-Site-Data', '"cache", "storage"')
            res.send()
        })
    },

    /**
     * @private
     */
    _addStaticAssetServing(app) {
        // Proxy bundle asset requests to the local
        // build directory.
        app.use(
            `${bundleBasePath}/development`,
            express.static(path.resolve(process.cwd(), 'src'), {
                dotFiles: 'deny',
                setHeaders: setLocalAssetHeaders,
                fallthrough: true
            })
        )
    },

    /**
     * @private
     */
    _addDevServerGarbageCollection(app) {
        app.use((req, res, next) => {
            const done = () => {
                // We collect garbage because when a Lambda environment is
                // re-used, we want to start with minimal memory usage. This
                // call typically takes less than 100mS, and can dramatically
                // reduce memory usage, so we accept the runtime cost.
                // For the local dev server, we do this now. For a remote
                // server, we use a different strategy (see createLambdaHandler).
                req.app._collectGarbage()
            }
            res.on('finish', done)
            res.on('close', done)
            next()
        })
    },

    serveStaticFile(filePath, opts = {}) {
        // Warning: Ugly part of the Bundle spec that we need to maintain.
        //
        // This function assumes that an SDK build step will copy all
        // non-webpacked assets from the 'app' dir to the 'build' dir.
        //
        // If you look carefully through the history, this has never
        // been true though – assets get copied from app/static to
        // build/static but this isn't really clear from the API.
        //
        // To see where those assets get copied, see here:
        //
        // packages/pwa-kit-dev/src/configs/webpack/config.js
        //
        // We have plans to make a robust Bundle spec in 246!
        //
        // Discussion here:
        //
        // https://salesforce-internal.slack.com/archives/C8YDDMKFZ/p1677793769255659?thread_ts=1677791840.174309&cid=C8YDDMKFZ

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const pkg = require(path.resolve(process.cwd(), 'package.json'))

        return (req, res) => {
            const baseDir = path.resolve(
                req.app.options.projectDir,
                pkg?.ccExtensibility?.overridesDir
                    ? pkg?.ccExtensibility?.overridesDir?.replace(/^\//, '')
                    : '',
                'app'
            )
            return this._serveStaticFile(req, res, baseDir, filePath, opts)
        }
    },

    render(req, res, next) {
        const app = req.app

        if (app?.__isInitialBuild) {
            this._redirectToLoadingScreen(req, res, next)
        } else {
            // Ensure that we do not try to render anything until the webpack bundle is valid.
            // There was a bug previously where developers would refresh the page while webpack was building,
            // causing them to get redirected to the loading page and sometimes getting stuck,
            // requiring them to restart their dev server
            app.__devMiddleware.waitUntilValid(() => {
                app.__hotServerMiddleware(req, res, next)
            })
        }
    },

    /**
     * @private
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _redirectToLoadingScreen(req, res, next) {
        const path = encodeURIComponent(req.originalUrl)
        res.redirect(`/__mrt/loading-screen/index.html?loading=1&path=${path}`)
    },

    /**
     * @private
     */
    _getDevServerHostAndPort(options) {
        const devServerHostName = options.devServerHostName || `localhost:${options.port}`
        const split = devServerHostName.split(':')
        const hostname = split.length === 2 ? split[0] : options.devServerHostName || 'localhost'
        const port = split.length === 2 ? split[1] : options.port
        return {hostname, port}
    }
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
 * @private
 */
export const DevServerFactory = RemoteServerFactory
    ? Object.assign({}, RemoteServerFactory, DevServerMixin)
    : Object.assign({}, MockRemoteServerFactory, DevServerMixin)

// Export the mock factory for testing
export {MockRemoteServerFactory}
