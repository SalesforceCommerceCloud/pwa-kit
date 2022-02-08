/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const webpack = require('webpack')
const config = require('pwa-kit-react-sdk/webpack/config')

config[0].plugins = [
    ...config[0].plugins,
    new webpack.ProvidePlugin({
        cosmiconfig: undefined
    })
]
module.exports = config
