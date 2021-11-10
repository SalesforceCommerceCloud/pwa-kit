/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
'use strict'

/* global WEBPACK_PACKAGE_JSON_MOBIFY */

import path from 'path'
import {createApp, createHandler, serveStaticFile} from 'pwa-kit-react-sdk/ssr/server/express'
import {render} from 'pwa-kit-react-sdk/ssr/server/react-rendering'
import {createProxyMiddleware} from 'http-proxy-middleware'
import querystring from 'querystring'

const app = createApp({
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
    // provided by a webpack DefinePlugin
    mobify: WEBPACK_PACKAGE_JSON_MOBIFY,

    // The port that the local dev server listens on
    port: 3000,

    // The protocol on which the development Express app listens.
    // Note that http://localhost is treated as a secure context for development.
    protocol: 'http'
})

const scapiProxy = createProxyMiddleware({
    target: 'https://8o7m175y.api.commercecloud.salesforce.com',
    changeOrigin: true,
    secure: true,
    pathRewrite: {
        '^/scapi-proxy/': '/'
    },
    onProxyReq: function(proxyReq, req) {
        // Drop the nefarious `Origin` header.
        delete proxyReq['origin']

        // Work around the built in body parser:
        // https://github.com/chimurai/http-proxy-middleware/issues/320
        // https://github.com/SalesforceCommerceCloud/pwa-kit/blob/107d7d9aab2a65718b3e029ef0f7515de9b247a8/packages/pwa-kit-react-sdk/src/ssr/server/express.js#L284-L294
        if (!req.body || !Object.keys(req.body).length) {
            return
        }

        const contentType = proxyReq.getHeader('Content-Type')
        const writeBody = (bodyData) => {
            proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData))
            proxyReq.write(bodyData)
        }

        if (contentType === 'application/json') {
            writeBody(JSON.stringify(req.body))
        }

        if (contentType === 'application/x-www-form-urlencoded') {
            writeBody(querystring.stringify(req.body))
        }
    }
})

app.all('/scapi-proxy/*', scapiProxy)

// Handle the redirect from SLAS as to avoid error
app.get('/callback?*', (req, res) => {
    res.send()
})
app.get('/robots.txt', serveStaticFile('static/robots.txt'))
app.get('/*', render)

// SSR requires that we export a single handler function called 'get', that
// supports AWS use of the server that we created above.
export const get = createHandler(app)
