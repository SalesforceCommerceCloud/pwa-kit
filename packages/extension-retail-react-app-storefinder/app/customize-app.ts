
/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import _customizeApp from '*/app/customize-app'

const data = {
    'store_1': {
        name: 'Coquitlam Central',
        lat: '',
        long: ''
    }
}

const customizeApp = ({app, runtime}: any) => {
    _customizeApp({app, runtime})

    // Start customization.
    app.get('/get-stores', (req: any, res: any) => {
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(data))
    })
}

export default customizeApp