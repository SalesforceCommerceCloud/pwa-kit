/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

'use strict'

import path from 'path'
import {getRuntime} from '@salesforce/pwa-kit-runtime/ssr/server/express'
import {isRemote} from '@salesforce/pwa-kit-runtime/utils/ssr-server'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import helmet from 'helmet'

const options = {
    // The build directory (an absolute path)
    buildDir: path.resolve(process.cwd(), 'build'),

    // The cache time for SSR'd pages (defaults to 600 seconds)
    defaultCacheTimeSeconds: 600,

    // This is the value of the 'mobify' object from package.json
    mobify: getConfig(),

    // The port that the local dev server listens on
    port: 3002,

    // The protocol on which the development Express app listens.
    // Note that http://localhost is treated as a secure context for development,
    // except by Safari.
    protocol: 'http'
}

const runtime = getRuntime()

const {handler} = runtime.createHandler(options, (app) => {
    const getCSP = (nodeEnv) => {
        const trustedMap = {
            development: [
                'localhost:*',
                '*.commercecloud.salesforce.com',
                '*.demandware.net',
                '*.mobify-staging.com',
                '*.mobify-storefront-staging.com',
                '*.mobify-storefront.com',
                'runtime.commercecloud.com'
            ],
            staging: [
                '*.demandware.net',
                '*.mobify-staging.com',
                '*.mobify-storefront-staging.com',
                '*.mobify-storefront.com',
                '*.commercecloud.salesforce.com',
                'runtime.commercecloud.com'
            ],
            production: [
                '*.demandware.com',
                '*.mobify.com',
                '*.mobify-storefront.com',
                '*.commercecloud.salesforce.com',
                'runtime.commercecloud.com',
                // TODO: Revert once we have a Runtime Admin we can use that's not in staging
                '*.mobify-storefront-staging.com'
            ]
        }
        const trusted = ["'self'", ...(trustedMap[nodeEnv] ? trustedMap[nodeEnv] : [])]

        return {
            'connect-src': ['api.cquotient.com', ...trusted],
            'frame-ancestors': [...trusted],
            'img-src': ['data:', ...trusted],
            'script-src': ["'unsafe-eval'", 'storage.googleapis.com', ...trusted],

            // Do not upgrade insecure requests for local development
            'upgrade-insecure-requests': isRemote() ? [] : null
        }
    }
    // Set HTTP security headers
    app.use(
        helmet({
            contentSecurityPolicy: {
                useDefaults: true,
                directives: getCSP(process.env.NODE_ENV ?? 'development')
            },
            hsts: isRemote()
        })
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
