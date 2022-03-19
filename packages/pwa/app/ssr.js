/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
'use strict'

const path = require('path')
const {getRuntime, serveStaticFile} = require('pwa-kit-runtime/ssr/server/express')
const {isRemote} = require('pwa-kit-runtime/utils/ssr-server')
const helmet = require('helmet')
const pkg = require('../package.json')

const options = {
    // The build directory (an absolute path)
    buildDir: path.resolve(process.cwd(), 'build'),

    // The cache time for SSR'd pages (defaults to 600 seconds)
    defaultCacheTimeSeconds: 600,

    // The path to the favicon. This must also appear in
    // the mobify.ssrShared section of package.json.
    faviconPath: path.resolve(process.cwd(), 'build/static/ico/favicon.ico'),

    // The location of the apps manifest file relative to the build directory
    manifestPath: 'static/manifest.json',

    // This is the value of the 'mobify' object from package.json
    mobify: pkg.mobify,

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
                    'img-src': ["'self'", '*.commercecloud.salesforce.com', 'data:'],
                    'script-src': ["'self'", "'unsafe-eval'"],

                    // Do not upgrade insecure requests for local development
                    'upgrade-insecure-requests': isRemote() ? [] : null
                }
            },
            hsts: isRemote()
        })
    )

    // Handle the redirect from SLAS as to avoid error
    app.get('/callback?*', (req, res) => {
        res.send()
    })
    app.get('/robots.txt', serveStaticFile('static/robots.txt'))

    runtime.addSSRRenderer(app)
})

// SSR requires that we export a single handler function called 'get', that
// supports AWS use of the server that we created above.
exports.get = handler
