/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Third-Party Imports
import {Application} from 'express'

// Platform Imports
import {ApplicationExtension} from '@salesforce/pwa-kit-extension-support/express/application-extension'
// import {ApplicationExtension} from '@salesforce/pwa-kit-extension-support/express' // NOTE: Doing this causes a circular dependency. Looks to fix whatever is happening in the index file.

// Local Imports
import {Config} from './types'

class SampleExtension extends ApplicationExtension<Config> {

    extendApp(app: Application): Application {
        console.log('setup-server: SampleExtension: extendApp: ', app)
        app.get('/sample', (req, res) => {
            console.log('SampleExtension extendApp GET /sample')
            res.send(
                `<p>Hello from an express SampleExtension!</p>
                <pre>extensionConfig = ${JSON.stringify(this.getConfig())}</pre>`
            )
        })

        return app
    }
}

export default SampleExtension
