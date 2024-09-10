/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { IApplicationExtension } from '@salesforce/pwa-kit-runtime/ssr/server/extensibility/types'
import { Application } from 'express'

class SampleExtension implements IApplicationExtension {
    private options: any

    constructor(options: any) {
        this.options = options
    }

    getName(): string {
        return 'SampleExtension'
    }

    extendApp(app: Application): Application {

        app.get('/sample', (req, res) => {
            console.log('SampleExtension extendApp GET /sample')
            res.send('Hello from an express SampleExtension!')
        })

        return app
    }
}

export default SampleExtension
