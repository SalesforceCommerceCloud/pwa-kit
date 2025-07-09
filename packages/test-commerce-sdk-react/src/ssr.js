/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
const {getRuntime} = require('@salesforce/pwa-kit-runtime/ssr/server/express')
const pkg = require('../package.json')

const options = {
    // The build directory (an absolute path)
    buildDir: path.resolve(process.cwd(), 'build'),

    // The cache time for SSR'd pages (defaults to 600 seconds)
    defaultCacheTimeSeconds: 600,

    // The port that the local dev server listens on
    port: 3000,

    // The protocol on which the development Express app listens.
    // Note that http://localhost is treated as a secure context for development,
    // except by Safari.
    protocol: 'http',

    mobify: pkg.mobify
}

const runtime = getRuntime()

const {handler} = runtime.createHandler(options, (app) => {
    // Handle the redirect from SLAS as to avoid error
    app.get('/callback?*', (req, res) => {
        res.send()
    })

    app.get('/favicon.ico', runtime.serveStaticFile('static/favicon.ico'))

    app.get('*', runtime.render)
})

// SSR requires that we export a single handler function called 'get', that
// supports AWS use of the server that we created above.
exports.get = handler
