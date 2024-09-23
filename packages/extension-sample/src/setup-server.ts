/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    Application as ExpressApplication,
    ApplicationExtension as ExpressApplicationExtension,
} from '@salesforce/pwa-kit-runtime/ssr/server/extensibility'
import {ApplicationExtensionConfig} from '@salesforce/pwa-kit-runtime/ssr/server/extensibility/types'

interface Config extends ApplicationExtensionConfig {
    path?: string

}

class SampleExtension extends ExpressApplicationExtension<Config> {

    extendApp(app: ExpressApplication): ExpressApplication {

        app.get('/sample', (req, res) => {
            console.log('SampleExtension extendApp GET /sample')
            this.getConfig
            res.send(
                `<p>Hello from an express SampleExtension!</p>
                <pre>options = ${JSON.stringify(this.getServerOptions())}</pre>
                <pre>extensionConfig = ${JSON.stringify(this.getConfig())}</pre>`
            )
        })

        return app
    }
}

export default SampleExtension
