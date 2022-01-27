/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
'use strict'

/* global WEBPACK_PACKAGE_JSON_MOBIFY */

import fs from 'fs'
import path from 'path'
import {createApp, createHandler, serveStaticFile} from 'pwa-kit-react-sdk/ssr/server/express'
import {isRemote} from 'pwa-kit-react-sdk/utils/ssr-server'
import {render} from 'pwa-kit-react-sdk/ssr/server/react-rendering'
import helmet from 'helmet'
import {createProxyMiddleware, fixRequestBody} from 'http-proxy-middleware'
import {Agent as HTTPSProxyAgent} from 'better-https-proxy-agent'


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
    protocol: 'http',

    enableLegacyRemoteProxying: false
})

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


const HTTPS_AGENT_OPTIONS = {}

const PROXY_REQUEST_OPTIONS = {
    protocol: 'https:',
    host: '127.0.0.1',
    port: 8080,
    cert: fs.readFileSync('mitmproxy-ca-cert.pem')
}

const shouldUseCorporateHTTPProxy = !isRemote()
if (shouldUseCorporateHTTPProxy) {
    app.all(
        '/proxy/test/*',
        createProxyMiddleware({
            agent: new HTTPSProxyAgent(HTTPS_AGENT_OPTIONS, PROXY_REQUEST_OPTIONS),
            target: 'https://httpbin.org/anything',
            secure: true,
            changeOrigin: true,
            onProxyReq: fixRequestBody,
            pathRewrite: {
                '.*': ''
            }
        })
    )

    app.all(
        '/proxy/scapi/*',
        createProxyMiddleware({
            agent: new HTTPSProxyAgent(HTTPS_AGENT_OPTIONS, PROXY_REQUEST_OPTIONS),
            target: 'https://kv7kzm78.api.commercecloud.salesforce.com',
            secure: true,
            changeOrigin: true,
            onProxyReq: fixRequestBody,
            pathRewrite: {
                '^/proxy/scapi/': '/'
            }
        })
    )

    app.all(
        '/proxy/ocapi/*',
        createProxyMiddleware({
            agent: new HTTPSProxyAgent(HTTPS_AGENT_OPTIONS, PROXY_REQUEST_OPTIONS),
            target: 'https://zzrf-001.sandbox.us01.dx.commercecloud.salesforce.com',
            secure: true,
            changeOrigin: true,
            onProxyReq: (proxyReq, req, res) => {
                // Don't forward the Origin header to OCAPI to prevent CORS errors.
                proxyReq.removeHeader('origin')
                
                return fixRequestBody(proxyReq, req, res)
            },
            pathRewrite: {
                '^/proxy/ocapi/': '/'
            }
        })
    )
}

// Handle the redirect from SLAS as to avoid error
app.get('/callback?*', (req, res) => {
    res.send()
})
app.get('/robots.txt', serveStaticFile('static/robots.txt'))
app.get('/*', render)

// SSR requires that we export a single handler function called 'get', that
// supports AWS use of the server that we created above.
export const get = createHandler(app)
