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
import {getConfig} from './utils/utils'

// const config = getConfig()

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

const renderWithConfig = async (req, res, next) => {
    // Add the config to the locals which we will write to the html later.
    res.locals.config = getConfig({
        req,
        moduleNameResolver: (req, defaultModuleName) => {
            // Example customization.
            if (req.location.host.endsWith('.eu')) {
                return `${defaultModuleName}-eu` // This means that the file `config/production-en.config` will be used.
            }

            return defaultModuleName
        }
    })

    return render(req, res, next)
}

// Handle the redirect from SLAS as to avoid error
app.get('/callback?*', (req, res) => {
    res.send()
})
app.get('/robots.txt', serveStaticFile('static/robots.txt'))
app.get('/*', renderWithConfig)

// SSR requires that we export a single handler function called 'get', that
// supports AWS use of the server that we created above.
export const get = createHandler(app)
