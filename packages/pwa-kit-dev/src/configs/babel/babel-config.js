/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// PWA-Kit Imports
import {getConfiguredExtensions} from '@salesforce/pwa-kit-extension-sdk/shared/utils'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import path from 'path'

export default {
    sourceType: 'unambiguous',
    presets: [
        [
            require('@babel/preset-env'),
            {
                targets: {
                    node: 18
                }
            }
        ],
        require('@babel/preset-typescript'),
        require('@babel/preset-react')
    ],
    plugins: [
        [
            require('@salesforce/pwa-kit-extension-sdk/configs/babel/plugin-application-extensions'),
            {
                target: 'node',
                configured: getConfiguredExtensions(getConfig())
            }
        ],
        require('@babel/plugin-transform-async-to-generator'),
        require('@babel/plugin-proposal-object-rest-spread'),
        require('@babel/plugin-transform-object-assign'),
        [
            require('@babel/plugin-transform-runtime'),
            {
                regenerator: true
            }
        ],
        require('@babel/plugin-syntax-dynamic-import'),
        require('@loadable/babel-plugin'),
        require('@babel/plugin-proposal-optional-chaining'),
        [
            require('babel-plugin-formatjs'),
            {
                idInterpolationPattern: '[sha512:contenthash:base64:6]',
                ast: true
            }
        ],
        require('@babel/plugin-transform-async-generator-functions')
    ].filter(Boolean),
    env: {
        test: {
            presets: [require('@babel/preset-env'), require('@babel/preset-react')],
            plugins: [require('babel-plugin-dynamic-import-node-babel-7')]
        }
    },
    ignore: [
        function (filepath) {
            const normalizedPath = path.normalize(filepath)

            const extensionRegex = new RegExp(
                `node_modules\\${path.sep}[^\\${path.sep}]+\\${path.sep}(pwa-kit-extension-sdk|@[^\\${path.sep}]+\\${path.sep}extension-|extension-)`
            )

            // Return false if it's an allowed extension package @salesforce/pwa-kit-extension-sdk and extension-*
            if (extensionRegex.test(normalizedPath)) {
                return false
            }

            // Return true if it's in node_modules (excluding allowed packages handled above)
            if (/node_modules/.test(normalizedPath)) {
                return true
            }

            // Return false for all other files
            return false
        }
    ]
}
