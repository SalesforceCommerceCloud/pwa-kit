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

function buildAuthURL() {
    const base = 'https://account.demandware.com/dwsso/oauth2/authorize'
    const query = new URLSearchParams({
        client_id: '056a095b-fa17-4fcb-bc76-806718566248',
        redirect_uri: `http://localhost:3443/callback-am`,
        response_type: 'token'
    })
    const authURL = `${base}?${query}`
    return authURL
}

function handlerCallbackAM(req, res) {
    return res.send(`
        <html>
            <head>
                <meta charset="UTF-8" />
                <title>Account Manager Callback</title>
            </head>
            <body>
                <h1>Loading...</h1>
                <script>    
                    // 1. dig the param out
                    // 2. shove it localstorage
                    // 3. redirect to the hompage
                    const accessToken = new URLSearchParams(window.location.hash.substr(1)).get('access_token')
                    console.log('accessToken', accessToken)
                    localStorage.setItem('access_token', accessToken)
                    window.location.href = '/'
                </script>
            </body>
        </html>
    `)
}

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
                        display: block;   
                        height: 100vh;     
                        width: 100vw;       
                        border: none; 
                        background: lightseagreen; 
                    }
                </style>
                
                <h1>Storefront Preview App wrapper</h1>
                 <h3>Retail React App http://localhost:3000/ on an iframe</h3>
                 <a href="${buildAuthURL()}">Login with AM</a>
                <iframe src="http://localhost:3000/"></iframe>
                
            </html>
        `)
    })

    // Shopper Context handler
    // app.post('/preview', handlerStorefrontPreview)
    //
    app.get('/callback-am', handlerCallbackAM)
})

// SSR requires that we export a single handler function called 'get', that
// supports AWS use of the server that we created above.
handler.get = handler.handler
module.exports = handler
