/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const config = {
    presets: [
        [
            require('@babel/preset-env'),
            {
                targets: {
                    // The _minimum_ Node version supported. See https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/upgrade-node-version.html#supported-node-versions
                    node: '18'
                }
            }
        ],
        require('@babel/preset-typescript'),
        require('@babel/preset-react')
    ],
    plugins: [
        require('@babel/plugin-transform-async-to-generator'),
        require('@babel/plugin-proposal-object-rest-spread'),
        require('@babel/plugin-transform-object-assign'),
        require('@babel/plugin-syntax-dynamic-import'),
        require('@babel/plugin-proposal-optional-chaining'),
        [
            require('babel-plugin-formatjs'),
            {
                idInterpolationPattern: '[sha512:contenthash:base64:6]',
                ast: true
            }
        ]
    ],
    env: {
        test: {
            presets: [require('@babel/preset-env'), require('@babel/preset-react')],
            plugins: [require('babel-plugin-dynamic-import-node-babel-7')]
        }
    }
}

module.exports = config
