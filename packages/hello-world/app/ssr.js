/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const path = require('path')
const {createHandler} = require('pwa-kit-runtime/ssr/server/express')
const pkg = require('../package.json')

const options = {
    buildDir: path.resolve(process.cwd(), 'build'),
    faviconPath: path.resolve(__dirname, 'static', 'favicon.ico'),
    defaultCacheTimeSeconds: 600,
    mobify: pkg.mobify,
    enableLegacyRemoteProxying: false,
    protocol: 'http'
}

const {handler} = createHandler(options, (app) => {
    app.get('/', (req, res) => {
        return res.json({
            protocol: req.protocol,
            method: req.method,
            path: req.path,
            query: req.query,
            body: req.body,
            headers: req.headers,
            ip: req.ip
        })
    })
})

exports.get = handler
