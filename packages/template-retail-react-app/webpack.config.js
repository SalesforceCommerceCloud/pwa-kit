/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import config from '@salesforce/pwa-kit-dev/configs/webpack/config.js'
import configNames from '@salesforce/pwa-kit-dev/configs/webpack/config-names.js'
import {isRemote} from '@salesforce/pwa-kit-runtime/utils/ssr-server.js'

export default config.map((configItem) => {
    if (configItem.name === configNames.CLIENT || configItem.name === configNames.SERVER) {
        return {
            ...configItem,
            devtool: isRemote() ? false : 'source-map',
            module: {
                ...configItem.module,
                rules: [
                    ...configItem.module.rules,
                    {
                        test: /\.css$/i,
                        use: ['style-loader', 'css-loader']
                    }
                ]
            }
        }
    } else {
        return configItem
    }
})
