/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const baseConfig = require('@salesforce/pwa-kit-dev/configs/babel/babel-config').default

// Add module resolver plugin for runtime module resolution
// This allows babel-node to resolve @salesforce/retail-react-app imports during server startup
const config = {
    ...baseConfig,
    plugins: [
        ...baseConfig.plugins,
        [
            'babel-plugin-module-resolver',
            {
                root: ['./app'],
                alias: {
                    '@salesforce/retail-react-app': '.',
                    // Handle CSS imports by returning empty modules during server startup
                    '\\.css$': './app/mocks/empty-css.js',
                    '\\.scss$': './app/mocks/empty-css.js',
                    '\\.sass$': './app/mocks/empty-css.js'
                }
            }
        ]
    ]
}

module.exports = config
