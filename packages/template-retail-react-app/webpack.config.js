/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const config = require('@salesforce/pwa-kit-dev/configs/webpack/config.js')
const configNames = require('@salesforce/pwa-kit-dev/configs/webpack/config-names.js')
const {isRemote} = require('@salesforce/pwa-kit-runtime/utils/ssr-server.js')
const path = require('path')

module.exports = config.map((configItem) => {
    if (configItem.name === configNames.CLIENT || configItem.name === configNames.SERVER) {
        return {
            ...configItem,
            devtool: isRemote() ? false : 'source-map',
            resolve: {
                ...configItem.resolve,
                alias: {
                    ...configItem.resolve?.alias,
                    '@salesforce/retail-react-app/app': path.resolve(__dirname, 'app')
                }
            },
            module: {
                ...configItem.module,
                rules: [
                    {
                        oneOf: [
                            {
                                test: /\.css$/,
                                use: [
                                    'style-loader',
                                    {
                                        loader: 'css-loader',
                                        options: {
                                            modules: false,
                                            sourceMap: true,
                                            esModule: false
                                        }
                                    }
                                ]
                            }
                        ]
                    },
                    ...configItem.module.rules
                ]
            }
        }
    } else {
        return configItem
    }
})
