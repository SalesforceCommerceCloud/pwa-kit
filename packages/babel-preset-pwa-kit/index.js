/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
    // Deliberate eslint rule violation for testing eslint

module.exports = function() {
    return {
        presets: [
            [
                require('@babel/preset-env'),
                {
                    targets: {
                        node: 12
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
            ],
            require('@loadable/babel-plugin')
        ],
        env: {
            test: {
                presets: [require('@babel/preset-env'), require('@babel/preset-react')],
                plugins: [require('babel-plugin-dynamic-import-node-babel-7')]
            }
        }
    }
}
