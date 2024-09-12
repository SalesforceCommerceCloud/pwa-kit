/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'path'
import webpack from 'webpack'
import {createFsFromVolume, Volume} from 'memfs'

//
export default (fixture, options = {}) => {
    const compiler = webpack({
        context: __dirname,
        entry: `./${fixture}`,
        output: {
            path: path.resolve(__dirname),
            filename: 'bundle.js'
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    use: {
                        loader: path.resolve(__dirname, '../extensions-loader.js'),
                        options
                    }
                }
            ]
        },
        resolve: {
            alias: {
                ['@salesforce/pwa-kit-runtime/utils/ssr-config']: path.resolve(
                    __dirname,
                    '../test/mock-get-config.js'
                ),
                ['@salesforce/extension-this/setup-app']: path.resolve(
                    __dirname,
                    '../test/mock-module.js'
                ),
                ['@salesforce/extension-that/setup-app']: path.resolve(
                    __dirname,
                    '../test/mock-module.js'
                ),
                ['@companyx/extension-another/setup-app']: path.resolve(
                    __dirname,
                    '../test/mock-module.js'
                ),
                ['extension-this/setup-app']: path.resolve(__dirname, '../test/mock-module.js')
            }
        }
    })

    compiler.outputFileSystem = createFsFromVolume(new Volume())
    compiler.outputFileSystem.join = path.join.bind(path)

    return new Promise((resolve, reject) => {
        compiler.run((err, stats) => {
            if (err) reject(err)
            if (stats.hasErrors()) reject(stats.toJson().errors)

            resolve(stats)
        })
    })
}
