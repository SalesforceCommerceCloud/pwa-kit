/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import compression from 'compression'
import expressLogging from 'morgan'
import express from 'express'
import path from 'path'
import fs from 'fs'
import https from 'https'
import http from 'http'
import mimeTypes from 'mime-types'
import webpack from 'webpack'
import webpackDevMiddleware from 'webpack-dev-middleware'
import webpackHotServerMiddleware from 'webpack-hot-server-middleware'
import open from 'open'
import requireFromString from 'require-from-string'
import config from '../../configs/webpack/config'
import {loadingScreen} from './loading-screen'
import {RemoteServerFactory} from 'pwa-kit-runtime/ssr/server/build-remote-server'

const chalk = require('chalk')

const CONTENT_TYPE = 'content-type'
const CONTENT_ENCODING = 'content-encoding'
const NO_CACHE = 'max-age=0, nocache, nostore, must-revalidate'

/**
 * @private
 */
export const DevServerMixin = {
    logStartupMessage(options) {
        console.log(`Starting the DevServer on ${chalk.cyan(this._getDevServerURL(options))}\n`)
    },

    getProtocol(options) {
        return process.env.DEV_SERVER_PROTOCOL || options.protocol
    },

    // eslint-disable-next-line no-unused-vars
    getDefaultCacheControl(options) {
        return NO_CACHE
    },

    strictSSL(options) {
        return options.strictSSL
    },

    setCompression(app) {
        app.use(
            compression({
                level: 9,
                filter: shouldCompress
            })
        )
    },

    setupLogging(app) {
        app.use(expressLogging('dev'))
    },

    setupMetricsFlushing(app) {
        // Flush metrics at the end of sending. We do this here to
        // keep the code paths consistent between local and remote
        // servers. For the remote server, the flushing is done
        // by the Lambda integration.
        app.use((req, res, next) => {
            res.on('finish', () => app.metrics.flush())
            next()
        })
    },

    setupProxying(app, options) {
        // See the remote server implementation
        return this._setupProxying(app, options)
    },

    addSDKInternalHandlers(app) {
        // This is separated out from addSSRRenderer because these
        // routes must not have our SSR middleware applied to them.
        // But the SSR render function must!
        app.__compiler = webpack(config)
        app.__devMiddleware = webpackDevMiddleware(app.__compiler, {serverSideRender: true})
        app.__webpackReady = () => Boolean(app.__devMiddleware.context.state)
        app.__waitForWebpackReady = () => {
            return new Promise((resolve) => {
                const inner = () => {
                    if (app.__webpackReady()) {
                        resolve()
                    } else {
                        setTimeout(inner, 75)
                    }
                }
                inner()
            })
        }

        app.use('/mobify/bundle/development', app.__devMiddleware)

        app.use('/__mrt/status', (req, res) => {
            return res.json({ready: app.__webpackReady()})
        })

        app.use('/__mrt', (req, res) => {
            res.send(loadingScreen())
        })
    },

    addSSRRenderer(app) {
        // Proxy bundle asset requests to the local
        // build directory.
        app.use(
            '/mobify/bundle/development',
            express.static(path.resolve(process.cwd(), 'src'), {
                dotFiles: 'deny',
                setHeaders: setLocalAssetHeaders,
                fallthrough: true
            })
        )

        const middleware = webpackHotServerMiddleware(app.__compiler)

        app.use('/', (req, res, next) => {
            if (app.__webpackReady()) {
                middleware(req, res, next)
            } else {
                res.redirect(301, '/__mrt?loading=1')
            }
        })

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

    _getDevServerHostAndPort(options) {
        const split = options.devServerHostName.split(':')
        const hostname = split.length === 2 ? split[0] : options.devServerHostName
        const port = split.length === 2 ? split[1] : options.port
        return {hostname, port}
    },

    _getDevServerURL(options) {
        const {protocol} = options
        const {hostname, port} = this._getDevServerHostAndPort(options)
        return `${protocol}://${hostname}:${port}`
    },

    _createHandler(app) {
        const {protocol, sslFilePath} = app.options
        const {hostname, port} = this._getDevServerHostAndPort(app.options)

        // Log an empty line between server startup messages and HTTP
        // request logging.
        console.log('')

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
            if (process.env.NODE_ENV !== 'test') {
                open(`${this._getDevServerURL(app.options)}/__mrt?loading=1`)
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
    getRequestProcessor(req) {
        if (req.app.__webpackReady()) {
            const outputFileSystem = req.app.__devMiddleware.context.outputFileSystem
            const jsonWebpackStats = req.app.__devMiddleware.context.stats.toJson()
            const rp = jsonWebpackStats.children.find((child) => child.name === 'request-processor')
            const requestProcessorPath = path.join(rp.outputPath, 'request-processor.js')
            const compiled = outputFileSystem.readFileSync(requestProcessorPath, 'utf-8')
            const requestProcessor = requireFromString(compiled)
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

export const DevServerFactory = Object.assign({}, RemoteServerFactory, DevServerMixin)
