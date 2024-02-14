/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

'use strict'

import path from 'path'
import {getRuntime} from '@salesforce/pwa-kit-runtime/ssr/server/express'
import {defaultPwaKitSecurityHeaders, injectSlasPrivateClientSecret, proxyHeaderRewrite} from '@salesforce/pwa-kit-runtime/utils/middleware'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import helmet from 'helmet'
import {getAppOrigin} from '@salesforce/pwa-kit-react-sdk/utils/url'

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

// const clientId = process?.env?.SLAS_PRIVATE_CLIENT_ID
const clientId = getConfig().app.commerceAPI.parameters.clientId
const secret = process?.env?.SLAS_PRIVATE_CLIENT_SECRET
const encodedSlasCredentials = Buffer.from(`${clientId}:${secret}`).toString(
    'base64'
)

const {handler} = runtime.createHandler(options, (app) => {
    // Set default HTTP security headers required by PWA Kit
    app.use(defaultPwaKitSecurityHeaders)
    // Set custom HTTP security headers
    app.use(
        helmet({
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

    // // TODO: Should this path be configurable?
    // app.use('/ssr/auth', injectSlasPrivateClientSecret)

    // TODO - Handle replacing the client secret placeholder with the actual secret
    // Exclude SLAS authenticate and new customer registration as they use the
    // authorization header for a different purpose
    app.use(proxyHeaderRewrite({
        rewrite: [{
            path: '/ssr/auth',
            exclusions: new RegExp('/oauth2/login|/shopper-customers'),
            target: 'https://kv7kzm78.api.commercecloud.salesforce.com',
            headers: {
                 Authorization: `Basic ${encodedSlasCredentials}`
            }
        }],
        origin: getAppOrigin()
    }))

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
