/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

'use strict'

import path from 'path'
import {getRuntime} from '@salesforce/pwa-kit-runtime/ssr/server/express'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {createProxyMiddleware} from 'http-proxy-middleware'
import helmet from 'helmet'
import {secret, clientId, shortCode} from '../env-vars.json';

const options = {
    // The build directory (an absolute path)
    buildDir: path.resolve(process.cwd(), 'build'),

    // The cache time for SSR'd pages (defaults to 600 seconds)
    defaultCacheTimeSeconds: 600,

    // The contents of the config file for the current environment
    mobify: getConfig(),

    // The port that the local dev server listens on
    port: 3000,

    // The protocol on which the development Express app listens.
    // Note that http://localhost is treated as a secure context for development,
    // except by Safari.
    protocol: 'http'
}

const runtime = getRuntime()

const {handler} = runtime.createHandler(options, (app) => {
    // Set HTTP security headers
    app.use(
        helmet({
            // pwa-kit-runtime ensures that the Content-Security-Policy header always contains the
            // directives required for PWA Kit to function. Add custom directives here.
            contentSecurityPolicy: {
                useDefaults: true,
                directives: {
                    'img-src': [
                        // Default source for product images - replace with your CDN
                        '*.commercecloud.salesforce.com'
                    ],
                    'script-src': [
                        // Used by the service worker in /worker/main.js
                        'storage.googleapis.com'
                    ],
                    'connect-src': [
                        // Connect to Einstein APIs
                        'api.cquotient.com'
                    ]
                }
            }
        })
    )

    const createSlasHandler = ({clientId, secret, shortCode}) => {
        const proxy = createProxyMiddleware({
            target: `https://${shortCode}.api.commercecloud.salesforce.com`,
            changeOrigin: true,
            onProxyReq: (outGoingReq, incomingReq) => {

                if (incomingReq.path.includes('/token')) {
                    const encodedClientCredential = Buffer.from(`${clientId}:${secret}`).toString(
                        'base64'
                    )

                    outGoingReq.setHeader('Authorization', `Basic ${encodedClientCredential}`)
                }
            }
        })
        return (req, res, next) => {
            if (!req.path.startsWith('/shopper/auth')) {
                return next()
            }
            proxy(req, res, next)
        }
    }

    app.use(
        // bodyParser.urlencoded({extended: true}),
        createSlasHandler({clientId, secret, shortCode})
    )

    // Handle the redirect from SLAS as to avoid error
    app.get('/callback?*', (req, res) => {
        // This endpoint does nothing and is not expected to change
        // Thus we cache it for a year to maximize performance
        res.set('Cache-Control', `max-age=31536000`)
        res.send()
    })
    app.get('/robots.txt', runtime.serveStaticFile('static/robots.txt'))
    app.get('/favicon.ico', runtime.serveStaticFile('static/ico/favicon.ico'))

    app.get('/worker.js(.map)?', runtime.serveServiceWorker)
    app.get('*', runtime.render)
})
// SSR requires that we export a single handler function called 'get', that
// supports AWS use of the server that we created above.
export const get = handler
