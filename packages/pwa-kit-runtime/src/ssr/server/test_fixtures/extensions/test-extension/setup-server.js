/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {ApplicationExtension} from '../../../extensibility'
class TestExtension extends ApplicationExtension {
    extendApp(app) {
        console.log(
            'ApplicationExtensionApplicationExtensionApplicationExtensionApplicationExtensionApplicationExtensionApplicationExtension: ',
            ApplicationExtension
        )

        app.get('/test-extension', (req, res) => {
            res.send('test')
        })
        app.get('/test-extension-config', (req, res) => {
            const config = JSON.stringify(this.getConfig())
            res.send(config)
        })

        return app
    }
}

export default TestExtension
