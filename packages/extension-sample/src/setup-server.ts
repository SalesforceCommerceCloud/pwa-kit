/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { IExpressApplicationExtension } from '@salesforce/pwa-kit-runtime/ssr/server/extensibility/types'
import { Application } from 'express'

class SampleExtension implements IExpressApplicationExtension {
    private options: any
    private extensionConfig: any

    constructor(options: any, extensionConfig: any) {
        this.options = options
        this.extensionConfig = extensionConfig
    }

    getName(): string {
        return 'SampleExtension'
    }

    extendApp(app: Application): Application {

        app.get('/sample', (req, res) => {
            console.log('SampleExtension extendApp GET /sample')
            res.send(
                `<p>Hello from an express SampleExtension!</p>
                <pre>options = ${JSON.stringify(this.options)}</pre>
                <pre>extensionConfig = ${JSON.stringify(this.extensionConfig)}</pre>`
            )
        })

        return app
    }
}

export default SampleExtension
