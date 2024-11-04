/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Third-Party Imports
import {Application, Request, Response} from 'express'

// Platform Imports
import {ApplicationExtension} from '@salesforce/pwa-kit-extension-sdk/express'

// Local Imports
import {Config} from './types'

class SampleExtension extends ApplicationExtension<Config> {
    extendApp(app: Application): Application {
        app.get('/sample', (req: Request, res: Response) => {
            console.log('DEBUG extension-sample.setup-server.extendApp res.locals:', res.locals)

            res.send(
                `<p>Hello from an express SampleExtension!</p>
                <pre>extensionConfig = ${JSON.stringify(this.getConfig())}</pre>`
            )
        })

        return app
    }
}

export default SampleExtension
