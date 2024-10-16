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

class SampleExtension extends ExpressApplicationExtension<Config> {

    extendApp(app: ExpressApplication): ExpressApplication {

         // This endpoint serves as an example of how to extend the existing PWA Kit App Express server application
         // It demonstrates the process of adding a new route and handling function for a GET request
         // Upon receiving a request to the '/sample' path, the endpoint sends a response showcasing the server's functionality
         // It also includes the current extension configuration as part of the response
        app.get('/sample', (req, res) => {
            console.log('SampleExtension extendApp GET /sample')
            res.send(
                `<p>Hello from an Express SampleExtension!</p>
                <pre>extensionConfig = ${JSON.stringify(this.getConfig())}</pre>`
            )
        })

        return app
    }
}

export default SampleExtension
