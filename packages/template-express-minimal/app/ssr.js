/*
 * Copyright (c) 2021, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const path = require('path')
const {getRuntime} = require('@salesforce/pwa-kit-runtime/ssr/server/express')
const pkg = require('../package.json')

const options = {
    buildDir: path.resolve(process.cwd(), 'build'),
    defaultCacheTimeSeconds: 600,
    mobify: pkg.mobify,
    enableLegacyRemoteProxying: false,
    protocol: 'http'
}

const runtime = getRuntime()

const handler = runtime.createHandler(options, (app) => {
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
                
                
                <h1>Storefront Preview App parent wrapper</h1>
                 <h3>Retail React App http://localhost:3000/ on an iframe</h3>
                <p>Parent envVar: <span id="vars"></span></p>
                <iframe src="http://localhost:3000/" id="iframe"></iframe>
                <script>
                    window.addEventListener("message", ({data}) => {
                        const {source, event, payload} = data
                        console.log('message data:', data)
                        document.getElementById("vars").innerHTML = data.payload
                        

                    })
                </script>



            </html>
        `)
    })
})

// SSR requires that we export a single handler function called 'get', that
// supports AWS use of the server that we created above.
handler.get = handler.handler
module.exports = handler
