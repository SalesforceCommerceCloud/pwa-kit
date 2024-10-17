/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const DEFAULT_TARGET = 'node'

// PWA-Kit Imports
import {getApplicationExtensionInfo} from '@salesforce/pwa-kit-extension-support/shared/utils'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

const config = (api) => {

    return {
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
                require('@salesforce/pwa-kit-extension-support/configs/babel/plugin-application-extensions'), 
                { 
                    target: api.caller(caller => caller?.target || DEFAULT_TARGET),
                    ...getApplicationExtensionInfo(getConfig)
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
        }
    }    
}
export default config
