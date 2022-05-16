/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const path = require('path')
const {getRuntime} = require('pwa-kit-runtime/ssr/server/express')
const pkg = require('../package.json')

const options = {
    buildDir: path.resolve(process.cwd(), 'build'),
    faviconPath: path.resolve(__dirname, 'static', 'favicon.ico'),
    defaultCacheTimeSeconds: 600,
    mobify: pkg.mobify,
    enableLegacyRemoteProxying: false,
    protocol: 'http'
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

exports.get = handler
