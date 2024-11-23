/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Third-Party Imports
import {Application} from 'express'
import helmet from 'helmet'

// Platform Imports
import {ApplicationExtension} from '@salesforce/pwa-kit-extension-sdk/express'
import {defaultPwaKitSecurityHeaders} from '@salesforce/pwa-kit-runtime/utils/middleware'

// Local Imports
import {Config} from './types'
import extensionMeta from '../extension-meta.json'
class RetailReactAppExtension extends ApplicationExtension<Config> {
    static readonly id = extensionMeta.id
    extendApp(app: Application): Application {
        // Set default HTTP security headers required by PWA Kit
        app.use(defaultPwaKitSecurityHeaders)
        // Set custom HTTP security headers
        app.use(
            helmet({
                contentSecurityPolicy: {
                    useDefaults: true,
                    directives: {
                        'img-src': [
                            // Default source for product images - replace with your CDN
                            '*.commercecloud.salesforce.com'
                        ],
                        'script-src': [
                            // Used by the service worker in /worker/main.js
                            'storage.googleapis.com'
                        ],
                        'connect-src': [
                            // Connect to Einstein APIs
                            'api.cquotient.com'
                        ]
                    }
                }
            })
        )

        // Handle the redirect from SLAS as to avoid error
        app.get('/callback?*', (req, res) => {
            // This endpoint does nothing and is not expected to change
            // Thus we cache it for a year to maximize performance
            res.set('Cache-Control', `max-age=31536000`)
            res.send()
        })

        return app
    }
}

export default RetailReactAppExtension
