/*
 * Copyright (c) 2021, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const path = require('path')
const {getRuntime} = require('pwa-kit-runtime/ssr/server/express')
const pkg = require('../package.json')
const helmet = require('helmet')
const {isRemote} = require('pwa-kit-runtime/utils/ssr-server')

const options = {
    buildDir: path.resolve(process.cwd(), 'build'),
    defaultCacheTimeSeconds: 600,
    mobify: pkg.mobify,
    enableLegacyRemoteProxying: false,
    protocol: 'http'
}

const runtime = getRuntime()

const handler = runtime.createHandler(options, (app) => {
    // Set HTTP security headers
    app.use(
        helmet({
            contentSecurityPolicy: {
                useDefaults: false,
                directives: {
                    'frame-ancestors': ["'self'", 'localhost:*', '*.mobify-storefront.com'],
                    'default-src': helmet.contentSecurityPolicy.dangerouslyDisableDefaultSrc
                }
            },
            hsts: isRemote()
        })
    )

    app.get('/', (req, res) => {
        res.send(`
            <html>
                <style>
                    iframe{      
                        display: block;  /* iframes are inline by default */   
                        height: 100vh;  /* Set height to 100% of the viewport height */   
                        width: 100vw;  /* Set width to 100% of the viewport width */     
                        border: none; /* Remove default border */
                        background: lightyellow; /* Just for styling */
                    }
                </style>
                
                <h1>Storefront Preview App wrapper</h1>
                 <h3>Retail React App Iframe</h3>
                <iframe src="http://localhost:3000/"></iframe>
            </html>
        `)
    })
})

// SSR requires that we export a single handler function called 'get', that
// supports AWS use of the server that we created above.
handler.get = handler.handler
module.exports = handler
