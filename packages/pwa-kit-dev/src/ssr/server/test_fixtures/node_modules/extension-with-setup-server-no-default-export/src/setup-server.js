/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

class AnotherExtension {
    options

    constructor(options) {
        this.options = options
    }

    getName() {
        return 'AnotherExtension'
    }

    extendApp(app) {
        app.get('/another-extension', (req, res) => {
            res.send('test')
        })

        return app
    }
}
