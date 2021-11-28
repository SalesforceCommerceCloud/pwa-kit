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
import {BaseServerFactory} from 'pwa-kit-runtime/ssr/server/build-base-server'
import webpack from 'webpack'
import webpackDevMiddleware from 'webpack-dev-middleware'
import webpackHotServerMiddleware from 'webpack-hot-server-middleware'
import config from '../../webpack/config'

const CONTENT_TYPE = 'content-type'
const CONTENT_ENCODING = 'content-encoding'
const NO_CACHE = 'max-age=0, nocache, nostore, must-revalidate'

/**
 * @private
 */
export class DevServerFactory extends BaseServerFactory {
    setupSSRRequestProcessorMiddleware(app) {
        return super.setupSSRRequestProcessorMiddleware(app)
    }

    getProtocol(options) {
        return process.env.DEV_SERVER_PROTOCOL || options.protocol
    }

    getDefaultCacheControl(options) {
        return NO_CACHE
    }

    strictSSL(options) {
        return options.strictSSL
    }

    setCompression(app) {
        app.use(
            compression({
                level: 9,
                filter: shouldCompress,
            })
        )
    }

    setupLogging(app) {
        app.use(expressLogging('dev'))
    }

    setupMetricsFlushing(app) {
        // Flush metrics at the end of sending. We do this here to
        // keep the code paths consistent between local and remote
        // servers. For the remote server, the flushing is done
        // by the Lambda integration.
        app.use((req, res, next) => {
            res.on('finish', () => app.metrics.flush())
            next()
        })
    }

    setupHealthcheck(app) {
        return super.setupHealthcheck(app)
    }

    setupProxying(app, options) {
        return super.setupProxying(app, options)
    }

    setupCommonMiddleware(app, options) {
        return super.setupCommonMiddleware(app, options)
    }

    validateConfiguration(options) {
        return super.validateConfiguration(options)
    }

    serveCompiledAssets(app) {
        // Proxy bundle asset requests to the local
        // build directory.
        app.use(
            '/mobify/bundle/development',
            express.static(path.resolve(process.cwd(), 'src'), {
                dotFiles: 'deny',
                setHeaders: setLocalAssetHeaders,
                fallthrough: true,
            })
        )

        const compiler = webpack(config)
        const devMiddleware = webpackDevMiddleware(compiler, {serverSideRender: true})

        app.use('/mobify/bundle/development', devMiddleware)

        const middleware = webpackHotServerMiddleware(compiler)

        app.use('/__mrt/status', (req, res) => {
            const ready = Boolean(devMiddleware.context.state)
            return res.json({ready})
        })

        app.use('/__mrt', (req, res, next) => {
            const loadingScreen = `
            <!doctype html>
            <head>
                <meta charset="utf-8"/>
                <title>Managed Runtime</title>
                <style>
                    body {
                        background: linear-gradient(-45deg, #e73c7e, #23a6d5, #23d5ab, #ee7752);
                        background-size: 400% 400%;
                        animation: gradient 10s ease infinite;
                        height: 100vh;
                    }
                    @keyframes gradient {
                        0% {
                            background-position: 0% 50%;
                        }
                        50% {
                            background-position: 100% 50%;
                        }
                        100% {
                            background-position: 0% 50%;
                        }
                    }
                    @keyframes fade {
                      0% { opacity: 0 }
                      100% { opacity: 1 }
                    }
                    .fade-in {
                        font-size: 18px;
                        opacity: 0;
                        animation: fade 1s ease-in-out;
                        animation-fill-mode: forwards;
                    }
                    .fade-in-0 { animation-delay: 0s}
                    .fade-in-1 { animation-delay: 4s}
                    .fade-in-2 { animation-delay: 8s}
                    .fade-in-3 { animation-delay: 12s}
                    .fade-in-4 { animation-delay: 16s}
                    .fade-in-5 { animation-delay: 20s}
                    body {
                        font-family: "Helvetica", sans-serif;
                        font-weight: 300;
                        color: rgba(255,255,255,0.8);
                        color: chartreuse;
                    }
                    .loading-screen {
                        mix-blend-mode: color-dodge;
                        display: flex;
                        flex-direction: row;
                        flex-wrap: nowrap;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                    }
                    h1 {
                        font-size: 10em;
                        font-weight: 900;
                        letter-spacing: -0.05em;
                    }
                    .title {
                        text-align: right;
                    }
                    .divider {
                        mix-blend-mode: lighten;
                        width: 8px;
                        background-color: chartreuse;
                        height: 507px;
                        margin-left: 5em;
                        margin-right: 3em;
                    }
                </style>
            </head>
            <body>
                <div class="loading-screen">
                    <div class="panel title">
                        <h1>Managed<br/>Runtime</h1>
                    </div>
                    <div class="panel">
                        <div class="divider"></div>
                    </div>
                    <div class="panel">
                        <p class="fade-in fade-in-0">Compiling Javascript...</p>
                        <p class="fade-in fade-in-1">Optimizing assets...</p>
                        <p class="fade-in fade-in-2">Establishing trust...</p>
                        <p class="fade-in fade-in-3">Facilitating change...</p>
                        <p class="fade-in fade-in-4">Daring to dream...</p>
                        <p class="fade-in fade-in-5">Filing Security Assessments...</p>
                    </div>
                </div>
                <script>
                    const url = new URL(window.location)
                    const loading = url.searchParams.get('loading')
                    if(loading === '1') {
                        setInterval(() => {
                            Promise.resolve()
                                .then(() => fetch('/__mrt/status'))
                                .then((res) => res.json())
                                .then((data) => {
                                    if (data.ready) {
                                        window.location = url.origin;
                                    }
                                })
                        }, 2000)
                    }
                </script>
            </body>
            </html>
        `
            res.send(loadingScreen)
        })

        app.use('/', (req, res, next) => {
            const ready = Boolean(devMiddleware.context.state)
            if (ready) {
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
    }

    createHandler(app) {
        const options = app.options
        const hostname = process.env.LISTEN_ADDRESS || 'localhost'
        const port = options.port
        let server

        if (options.protocol === 'https') {
            const sslFile = fs.readFileSync(options.sslFilePath)
            server = https.createServer({key: sslFile, cert: sslFile}, app)
        } else {
            server = http.createServer(app)
        }

        server.on('error', makeErrorHandler(process, server, console.log))

        server.on('close', () => app.applicationCache.close())

        server.listen({hostname, port}, () => {
            const url = `${options.protocol}://${hostname}:${port}`
            console.log(`${options.protocol.toUpperCase()} development server listening on ${url}`)
            // TODO: Must move this to the CLI – it'll cause us nightmares here.
            const open = require('open')
            open(`${url}/__mrt?loading=1`)
        })

        return {handler: undefined, server}
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