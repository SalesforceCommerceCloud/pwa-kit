/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Third-Party Imports
import {Application} from 'express'

// Platform Imports
import {ApplicationExtension} from '@salesforce/pwa-kit-extension-sdk/express'

// Local Imports
import {Config} from './types'

class Sample2Extension extends ApplicationExtension<Config> {
    extendApp(app: Application): Application {
        // I'm not sure what it looks to extend the behavior of the _same_ endpoint
        app.get('/sample', (req, res, next) => {
            console.log('Sample2Extension extendApp GET /sample')
            // We can't call next() because already calling send here
            res.send(
                `<p>Hello from an express Sample2Extension!</p>
                <pre>extensionConfig = ${JSON.stringify(this.getConfig())}</pre>`
            )
        })

        return app
    }
}

export default Sample2Extension
