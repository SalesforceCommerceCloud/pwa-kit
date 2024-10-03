/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    Application as ExpressApplication,
    ApplicationExtension as ExpressApplicationExtension
} from '@salesforce/pwa-kit-runtime/ssr/server/extensibility'
import {ServerExtensionConfig as Config} from './types'

import {defaultPwaKitSecurityHeaders} from '@salesforce/pwa-kit-runtime/utils/middleware'
import {getRuntime} from '@salesforce/pwa-kit-runtime/ssr/server/express'
import helmet from 'helmet'

const runtime = getRuntime()

class SampleExtension extends ExpressApplicationExtension<Config> {
    extendApp(app: ExpressApplication): ExpressApplication {
        console.log('--- extending the express app')
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

        // TODO: serveStaticFile needs to be aware of app extensions
        app.get('/robots.txt', runtime.serveStaticFile('static/robots.txt'))
        app.get('/worker.js(.map)?', runtime.serveServiceWorker)

        return app
    }
}

export default SampleExtension
