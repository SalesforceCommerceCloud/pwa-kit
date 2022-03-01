/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const express = require('express')
const {createProxyMiddleware, responseInterceptor} = require('http-proxy-middleware')

const isRemote = () => !!process.env.HEROKU

const PORT = process.env.PORT || 8000

const PROXY_ORIGIN = isRemote()
    ? 'https://pwa-hybrid-deployment.herokuapp.com'
    : `http://localhost:${PORT}`
const SFRA_INSTANCE_ORIGIN = 'https://development-internal-ccdemo.demandware.net'
const PWA_ORIGIN = isRemote()
    ? 'https://scaffold-pwa-hybrid-deployment.mobify-storefront.com'
    : 'http://localhost:3000'

const options = {
    target: SFRA_INSTANCE_ORIGIN,
    secure: false,
    changeOrigin: true,
    autoRewrite: true,
    hostRewrite: true,
    cookieDomainRewrite: {
        SFRA_INSTANCE_DOMAIN: 'localhost'
    },

    pathRewrite: {
        '/sfra': '/',
        '/pwa': '/'
    },

    router: {
        '/sfra': SFRA_INSTANCE_ORIGIN,
        '/pwa': PWA_ORIGIN,

        // handles
        // a. ssr proxy: /mobify/proxy
        // b. dev assets: /mobify/development/bundle
        '/mobify': PWA_ORIGIN,

        // slas
        '/callback': PWA_ORIGIN
    },

    selfHandleResponse: true,
    onProxyRes: (proxyRes, req, res) => {
        // Remove HttpOnly flag from cookies
        if (proxyRes.headers['set-cookie']) {
            proxyRes.headers['set-cookie'] = proxyRes.headers['set-cookie'].map((cookie) =>
                cookie.replace(/; HttpOnly/gi, '')
            )
        }

        // For some reason the redirect 'location' header is not re-written
        // under certain cases. Manually rewrite redirect location.
        if (proxyRes.headers['location']) {
            proxyRes.headers['location'] = proxyRes.headers['location'].replace(
                new RegExp(`${SFRA_INSTANCE_ORIGIN}`, 'g'),
                PROXY_ORIGIN
            )
        }

        return responseInterceptor(async (responseBuffer) => {
            const response = responseBuffer.toString()

            return (
                response
                    // some SFRA links are absolute URLs
                    // replace them so they go through the proxy
                    .replace(new RegExp(`${SFRA_INSTANCE_ORIGIN}`, 'g'), PROXY_ORIGIN)
            )
        })(proxyRes, req, res)
    }
}

const app = express()

app.get('/', (req, res) => {
    res.send(
        `<a href="${PROXY_ORIGIN}/sfra/s/RefArch">Go to SFRA</a><br/><a href="${PROXY_ORIGIN}/pwa">Go to PWA</a>`
    )
})
app.use(createProxyMiddleware(options))

app.listen(PORT, () => {
    console.log(`===================================================`)
    console.log(`===> SFRA: ${PROXY_ORIGIN}/sfra/s/RefArch`)
    console.log(`===> PWA: ${PROXY_ORIGIN}/pwa`)
})
