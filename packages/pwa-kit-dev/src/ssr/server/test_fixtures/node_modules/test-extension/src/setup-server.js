/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

class TestExtension {
    options

    constructor(options) {
        this.options = options
    }

    getName() {
        return 'TestExtension'
    }

    extendApp(app) {
        app.get('/test-extension', (req, res) => {
            res.send('test')
        })

        return app
    }
}

export default TestExtension
