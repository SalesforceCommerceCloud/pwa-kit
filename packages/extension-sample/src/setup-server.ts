/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* istanbul ignore next */


class Sample {
    private config

    constructor(config) {
        this.config = config
    }
    
    getConfig(): object {
        return this.config
    }

    getName(): string {
        return 'sample'
    }

    extendApp(app) {
        app.get('/sample', (req, res) => {
            console.log('SampleExtension extendApp GET /sample')
            res.send(
                `<p>Hello from an express SampleExtension!</p>`
            )
        })
    }
}

export default Sample