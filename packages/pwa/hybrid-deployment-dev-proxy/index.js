/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const express = require('express')
const {createProxyMiddleware, responseInterceptor} = require('http-proxy-middleware')

const PORT = 8000

const SFRA_INSTANCE_ORIGIN = 'https://zzrf-002.sandbox.us01.dx.commercecloud.salesforce.com'
const LOCAL_PWA_ORIGIN = 'http://localhost:3000'

const options = {
    target: SFRA_INSTANCE_ORIGIN,
    secure: false,
    changeOrigin: true,
    autoRewrite: true,
    cookieDomainRewrite: {
        SFRA_INSTANCE_DOMAIN: 'localhost'
    },

    pathRewrite: {
        '/sfra': '/',
        '/pwa': '/'
    },

    router: {
        '/sfra': SFRA_INSTANCE_ORIGIN,
        '/pwa': LOCAL_PWA_ORIGIN,

        // handles
        // a. ssr proxy: /mobify/proxy
        // b. dev assets: /mobify/development/bundle
        '/mobify': LOCAL_PWA_ORIGIN,

        // slas
        '/callback': LOCAL_PWA_ORIGIN
    },

    selfHandleResponse: true,
    onProxyRes: (proxyRes, req, res) => {
        // Remove HttpOnly flag from cookies
        if (proxyRes.headers['set-cookie']) {
            proxyRes.headers['set-cookie'] = proxyRes.headers['set-cookie'].map((cookie) =>
                cookie.replace(/; HttpOnly/gi, '')
            )
        }

        return responseInterceptor(async (responseBuffer) => {
            const response = responseBuffer.toString()

            return (
                response
                    // some SFRA links are absolute URLs
                    // replace them so they go through the proxy
                    .replace(new RegExp(`${SFRA_INSTANCE_ORIGIN}`, 'g'), `http://localhost:${PORT}`)
            )
        })(proxyRes, req, res)
    }
}

const app = express()

app.use(createProxyMiddleware(options))

app.listen(PORT, () => {
    console.log(`===================================================`)
    console.log(`===> SFRA: http://localhost:${PORT}/sfra/s/RefArch`)
    console.log(`===> PWA: http://localhost:${PORT}/pwa`)
})
