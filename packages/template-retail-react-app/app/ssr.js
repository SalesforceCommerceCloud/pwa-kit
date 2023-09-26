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
    port: 3000,

    // The protocol on which the development Express app listens.
    // Note that http://localhost is treated as a secure context for development,
    // except by Safari.
    protocol: 'http'
}

const runtime = getRuntime()

const {handler} = runtime.createHandler(options, (app) => {
    // Set HTTP security headers
    app.use(helmet({hsts: isRemote()}))

    app.use((req, res, next) => {
        // TODO: Special handling for 'upgrade-insecure-requests': isRemote() ? [] : null
        const runtimeAdmin = '*.mobify-storefront.com' // TODO: Revert
        // const runtimeAdmin = isRemote() ? 'https://runtime.commercecloud.com' : 'localhost:*'
        const defaultDirectives = {
            'connect-src': ["'self'", 'api.cquotient.com', runtimeAdmin],
            'frame-ancestors': [runtimeAdmin],
            'img-src': ["'self'", '*.commercecloud.salesforce.com', 'data:'],
            'script-src': ["'self'", "'unsafe-eval'", 'storage.googleapis.com', runtimeAdmin]
        }
        // Parse current CSP header
        const directives = res
            .getHeader('Content-Security-Policy')
            .split(';')
            .reduce((obj, text) => {
                const [directive, ...values] = text.split(' ')
                obj[directive] = values
                return obj
            }, {})
        // Add missing default CSP directives
        for (const [directive, defaultValues] of Object.entries(defaultDirectives)) {
            directives[directive] = [
                // Wrapping with `[...new Set(array)]` removes duplicate entries
                ...new Set([...(directives[directive] ?? []), ...defaultValues])
            ]
        }
        // Always upgrade insecure requests when deployed, never upgrade on local dev server
        if (isRemote()) {
            directives['upgrade-insecure-requests'] = []
        } else {
            delete directives['upgrade-insecure-requests']
        }
        // Re-construct header string
        const header = Object.entries(directives)
            .map(([directive, values]) => [directive, ...values].join(' '))
            .join(';')
        res.setHeader('Content-Security-Policy', header)

        next()
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
