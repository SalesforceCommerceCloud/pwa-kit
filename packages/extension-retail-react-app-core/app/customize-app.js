/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// import _customizeApp from '*/app/customize-app'

const customizeApp = ({app, runtime}) => {
    // NOTE: We aren't going to be short-circuting this in production, instead it will resolve to the SDK where the base implementation lives.
    // _customizeApp({app, runtime})

    // Start customization.
    app.get('/callback?*', (req, res) => {
        res.send()
    })
}

export default customizeApp