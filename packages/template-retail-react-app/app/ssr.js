/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
'use strict'

import path from 'path'
import {getRuntime} from 'pwa-kit-runtime/ssr/server/express'
import {isRemote} from 'pwa-kit-runtime/utils/ssr-server'
import {getConfig} from 'pwa-kit-runtime/utils/ssr-config'
import helmet from 'helmet'

const options = {
    // The build directory (an absolute path)
    buildDir: path.resolve(process.cwd(), 'build'),

    // The cache time for SSR'd pages (defaults to 600 seconds)
    defaultCacheTimeSeconds: 600,

    // This is the value of the 'mobify' object from package.json
    mobify: getConfig(),

    // The port that the local dev server listens on
    port: 3000,

    // The protocol on which the development Express app listens.
    // Note that http://localhost is treated as a secure context for development.
    protocol: 'http'
}

const runtime = getRuntime()

const {handler} = runtime.createHandler(options, (app) => {
    // Set HTTP security headers
    app.use(
        helmet({
            contentSecurityPolicy: {
                useDefaults: true,
                directives: {
                    'img-src': [
                        "'self'",
                        '*.commercecloud.salesforce.com',
                        'data:',
                        '*.cdn.content.amplience.net',
                        'cdn.media.amplience.net',
                        '*.staging.bigcontent.io',
                        'i8.amplience.net',
                        '*.stylitics.com'
                    ],
                    'script-src': [
                        "'self'",
                        "'unsafe-eval'",
                        'storage.googleapis.com',
                        '*.cdn.content.amplience.net',
                        'cdn.media.amplience.net',
                        '*.staging.bigcontent.io',
                        '*.brightcove.net',
                        '*.stylitics.com',
                        "'unsafe-inline'"
                    ],
                    'connect-src': [
                        "'self'",
                        "'unsafe-eval'",
                        'api.cquotient.com',
                        '*.cdn.content.amplience.net',
                        'cdn.media.amplience.net',
                        'cdn.static.amplience.net',
                        '*.staging.bigcontent.io',
                        '*.stylitics.com'
                    ],
                    'default-src': [
                        "'self'",
                        "'unsafe-eval'",
                        '*.cdn.content.amplience.net',
                        'cdn.media.amplience.net',
                        'cdn.static.amplience.net',
                        '*.staging.bigcontent.io',
                        '*.brightcove.net',
                        '*.stylitics.com',
                        'data:'
                    ],
                    'frame-ancestors': ["'self'", '*.amplience.net'],
                    // Do not upgrade insecure requests for local development
                    'upgrade-insecure-requests': isRemote() ? [] : null
                }
            },
            hsts: isRemote()
        })
    )

    // Convert %2F to '/' in path coming from category node visualisation
    app.get('*%2F*', async (req, res) => {
        const [path, query] = req.url.split('?')
        res.redirect(`${path.replace(/%2F/, '/')}?${query}`)
    })

    // If you gave something with a // in the first instance, put in the default locale
    app.get('//*', async (req, res) => {
        const [path, query] = req.url.split('?')
        // TODO: calculate the default locale instead of hard coding to en-US
        res.redirect(`${path.replace(/^\/\//, '/en-US/')}?${query}`)
    })

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
