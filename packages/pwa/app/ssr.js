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
import {isRemote} from 'pwa-kit-react-sdk/utils/ssr-server'
import {render} from 'pwa-kit-react-sdk/ssr/server/react-rendering'
import helmet from 'helmet'
// import {DEFAULT_CONFIG_MODULE_NAME} from 'pwa-kit-react-sdk/ssr/universal/utils'

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

    // CUSTOMIZATION:
    // Use the `fileNameResolver` to determine custom config files to be loaded. If for
    // example we want to use `production-eu-config.json` when the top level domain is `eu`
    // we would do the following. This is important for those deployments where it's a single
    // code base that handles multiple sites.
    // configFileName: (req) => {
    //     const {host} = req.location
    //     let returnVal

    //     switch (host) {
    //         case 'example.eu':
    //             returnVal = `${DEFAULT_CONFIG_MODULE_NAME}-eu`
    //             break
    //         case 'example.com/it':
    //             returnVal = `${DEFAULT_CONFIG_MODULE_NAME}-it`
    //             break
    //         default:
    //             returnVal = DEFAULT_CONFIG_MODULE_NAME
    //     }
    //     return returnVal
    // }
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

// Handle the redirect from SLAS as to avoid error
app.get('/callback?*', (req, res) => {
    res.send()
})
app.get('/robots.txt', serveStaticFile('static/robots.txt'))
app.get('/*', render)

// SSR requires that we export a single handler function called 'get', that
// supports AWS use of the server that we created above.
export const get = createHandler(app)
