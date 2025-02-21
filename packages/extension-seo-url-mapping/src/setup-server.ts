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
import extensionMeta from '../extension-meta.json'

class StarterExtension extends ApplicationExtension<Config> {
    static readonly id = extensionMeta.id

    /**
     * Use this method to enhance or modify your ExpressJS Application by adding route handlers and middleware.
     */
    extendApp(app: Application): Application {
        app.get('/sample', (req, res) => {
            console.log('StarterExtension extendApp GET /sample')
            res.send(
                `<p>Hello starter extension!</p>
                <pre>extensionConfig = ${JSON.stringify(this.getConfig())}</pre>`
            )
        })

        return app
    }
}

export default StarterExtension
