/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */



class SampleExtension {
    options

    constructor(options) {
        this.options = options
    }

    getName() {
        return 'SampleExtension'
    }

    extendApp(app) {

        app.get('/sample', (req, res) => {
            console.log('SampleExtension extendApp GET /sample')
            res.send('Hello from an express SampleExtension!')
        })

        return app
    }
}

export default SampleExtension
