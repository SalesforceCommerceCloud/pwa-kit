/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
'use strict'

const path = require('path')
const {getRuntime} = require('pwa-kit-runtime/ssr/server/express')
const {isRemote} = require('pwa-kit-runtime/utils/ssr-server')
const {getConfig} = require('pwa-kit-runtime/utils/ssr-config')
const helmet = require('helmet')
const {createProxyMiddleware} = require('http-proxy-middleware')

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

// @@@
const AUTH = {
    username: 'storefront',
    password: 'password'
}

function basicAuthMiddleware(req, res, next) {
    const shouldSkipAuth =
        req.path.startsWith('/proxy') ||
        req.path.startsWith('/mobify') ||
        req.path.startsWith('/callback')
    if (shouldSkipAuth) {
        return next()
    }

    const authorization = (req.get('authorization') || '').split(' ')[1] || ''
    const [username, password] = Buffer.from(authorization, 'base64')
        .toString()
        .split(':')

    const hasValidAuth = username == AUTH.username && password == AUTH.password
    if (hasValidAuth) {
        return next()
    }

    res.set('WWW-Authenticate', 'Basic realm="Storefront"')
    res.status(401).send('Auth Required! :woman-gesturing-no:')
}

// Basic auth credentials are in the `authorization` header, while
// SCAPI/OCAPI JWTs are in `x-authorization`.
function swapAuthHeader(proxyReq, req, res) {
    proxyReq.removeHeader('Authorization')

    const authorization = proxyReq.getHeader('X-Authorization')
    proxyReq.removeHeader('X-Authorization')
    // Avoid OCAPI origin protection.
    proxyReq.removeHeader('Origin')
    if (authorization) {
        proxyReq.setHeader('Authorization', authorization)
    }
}

// Useful for testing!
const proxyHTTPBin = createProxyMiddleware({
    target: 'https://httpbin.org/anything',
    secure: true,
    changeOrigin: true,
    onProxyReq: swapAuthHeader,
    pathRewrite: {
        '.*': ''
    }
})

const proxySCAPI = createProxyMiddleware({
    target: 'https://kv7kzm78.api.commercecloud.salesforce.com',
    secure: true,
    changeOrigin: true,
    onProxyReq: swapAuthHeader,
    pathRewrite: {
        '^/proxy/scapi/': '/'
    }
})

const proxyOCAPI = createProxyMiddleware({
    target: 'https://zzte-053.sandbox.us02.dx.commercecloud.salesforce.com',
    secure: true,
    changeOrigin: true,
    onProxyReq: swapAuthHeader,
    pathRewrite: {
        '^/proxy/ocapi/': '/'
    }
})

const {handler} = runtime.createHandler(options, (app) => {
    app.use(basicAuthMiddleware)
    app.all('/proxy/httpbin/*', proxyHTTPBin)
    app.all('/proxy/scapi/*', proxySCAPI)
    app.all('/proxy/ocapi/*', proxyOCAPI)

    // Set HTTP security headers
    app.use(
        helmet({
            contentSecurityPolicy: {
                useDefaults: true,
                directives: {
                    'img-src': ["'self'", '*.commercecloud.salesforce.com', 'data:'],
                    'script-src': ["'self'", "'unsafe-eval'", 'storage.googleapis.com'],

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
    app.get('/robots.txt', runtime.serveStaticFile('static/robots.txt'))
    app.get('/favicon.ico', runtime.serveStaticFile('static/ico/favicon.ico'))

    app.get('/worker.js(.map)?', runtime.serveServiceWorker)
    app.get('*', runtime.render)
})
// SSR requires that we export a single handler function called 'get', that
// supports AWS use of the server that we created above.
exports.get = handler
