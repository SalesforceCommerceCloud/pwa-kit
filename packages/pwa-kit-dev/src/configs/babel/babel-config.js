/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const config = {
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
        // [
        //     require('babel-plugin-module-resolver'), 
        //     {
        //         root: ["/Users/bchypak/Projects/pwa-kit/packages/template-typescript-minimal/node_modules"], // or whatever your source directory is
        //         // NOTE: I shouldn't have to use alias's here because the root should be enough to determine there these things exists. But this 
        //         // does show that the plugin is running. So that is good news.
        //         alias: {
        //             '@salesforce/extension-sample/setup-server': '/Users/bchypak/Projects/pwa-kit/packages/extension-sample/src/setup-server.ts',
        //         }
        //     }
        // ],
        // require('@salesforce/pwa-kit-extension-support/configs/babel/plugin-application-extensions'),
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
    ],
    env: {
        test: {
            presets: [require('@babel/preset-env'), require('@babel/preset-react')],
            plugins: [require('babel-plugin-dynamic-import-node-babel-7')]
        }
    }
}

export default config
