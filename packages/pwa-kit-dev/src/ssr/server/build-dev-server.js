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
import https from 'https'
import http from 'http'
import mimeTypes from 'mime-types'
import webpack from 'webpack'
import webpackDevMiddleware from 'webpack-dev-middleware'
import webpackHotServerMiddleware from 'webpack-hot-server-middleware'
import webpackHotMiddleware from 'webpack-hot-middleware'
import open from 'open'
import requireFromString from 'require-from-string'
import {RemoteServerFactory} from '@salesforce/pwa-kit-runtime/ssr/server/build-remote-server'
import {proxyConfigs} from '@salesforce/pwa-kit-runtime/utils/ssr-shared'
import {bundleBasePath} from '@salesforce/pwa-kit-runtime/utils/ssr-namespace-paths'
import {
    SERVER,
    CLIENT,
    CLIENT_OPTIONAL,
    REQUEST_PROCESSOR
} from '../../configs/webpack/config-names'

import {randomUUID} from 'crypto'
import chalk from 'chalk'

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

    serveServiceWorker(req, res) {
        req.app.__devMiddleware.waitUntilValid(() => {
            const sourceMap = req.path.endsWith('.map')
            const file = sourceMap ? 'worker.js.map' : 'worker.js'
            const type = sourceMap ? '.js.map' : '.js'
            const content = DevServerFactory._getWebpackAsset(req, CLIENT_OPTIONAL, file)
            if (content === null) {
                // Service worker does not exist. Reminder that SW is optional for MRT apps.
                res.sendStatus(404)
            } else {
                res.type(type)
                res.send(content)
            }
        })
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
        const split = options.devServerHostName.split(':')
        const hostname = split.length === 2 ? split[0] : options.devServerHostName
        const port = split.length === 2 ? split[1] : options.port
        return {hostname, port}
    },

    /**
     * @private
     */
    _getDevServerURL(options) {
        const {protocol} = options
        const {hostname, port} = this._getDevServerHostAndPort(options)
        return `${protocol}://${hostname}:${port}`
    },

    /**
     * @private
     */
    _createHandler(app) {
        const {protocol, sslFilePath} = app.options
        const {hostname, port} = this._getDevServerHostAndPort(app.options)

        let server

        if (protocol === 'https') {
            const sslFile = fs.readFileSync(sslFilePath)
            server = https.createServer({key: sslFile, cert: sslFile}, app)
        } else {
            server = http.createServer(app)
        }

        server.on('error', makeErrorHandler(process, server, console.log))

        server.on('close', () => app.applicationCache.close())

        server.listen({hostname, port}, () => {
            /* istanbul ignore next */
            if (process.env.NODE_ENV !== 'test') {
                open(
                    `${this._getDevServerURL(
                        app.options
                    )}/__mrt/loading-screen/index.html?loading=1`
                )
            }
        })

        return {handler: undefined, server, app}
    },

    /**
     * Load any request processor code to emulate in the dev server the code
     * that would run on a Lambda Edge function.
     *
     * @private
     */
    _getRequestProcessor(req) {
        const compiled = this._getWebpackAsset(req, REQUEST_PROCESSOR, 'request-processor.js')
        if (compiled) {
            const module = requireFromString(compiled)
            if (!module.processRequest) {
                throw new Error(
                    `Request processor module "request-processor.js" does not export processRequest`
                )
            }
            return module
        } else {
            return null
        }
    },

    /**
     * Return the compiled source for a webpack asset as a string.
     *
     * @param req
     * @param compilerName
     * @param fileName
     * @returns {null|String}
     * @private
     */
    _getWebpackAsset(req, compilerName, fileName) {
        if (req.app.__webpackReady()) {
            const outputFileSystem = req.app.__devMiddleware.context.outputFileSystem
            // Projects may have a large amount of stats data to process that can lead to performance issues
            // we pass in options that help prevent that - preset: 'none' processes no data (TODO: make configurable)
            const jsonWebpackStats = req.app.__devMiddleware.context.stats.toJson({
                preset: 'none',
                outputPath: true
            })

            try {
                const rp = jsonWebpackStats.children.find((child) => child.name === compilerName)
                const assetPath = path.join(rp.outputPath, fileName)
                return outputFileSystem.readFileSync(assetPath, 'utf-8')
            } catch (e) {
                // The file doesn't exist – this is fine, many are optional
                return null
            }
        } else {
            // The file isn't compiled yet
            return null
        }
    }
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
export const setLocalAssetHeaders = (res, assetPath) => {
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
export const DevServerFactory = Object.assign({}, RemoteServerFactory, DevServerMixin)
