/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const webpack = require('webpack')
const {Volume} = require('memfs')
const path = require('path')

// Log the resolved path to check correctness
const loaderPath = path.resolve(__dirname, './loader.js')
console.log('Loader Path:', loaderPath) // Debug the loader path

// Define the Webpack configuration for the test
const createWebpackConfig = () => ({
    entry: '/src/index.js', // Virtual input file in memfs
    output: {
        path: '/dist', // Virtual output in memfs
        filename: 'bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: [
                    {
                        loader: loaderPath // Use the loader we created
                    }
                ]
            }
        ]
    },
    resolve: {
        alias: {
            '@loadable/components$': path.resolve(__dirname, 'node_modules/@loadable/components')
        },
        extensions: ['.js'] // Add '.ts' here if you're using TypeScript
    }
})

// Test suite
describe('Webpack Loader Test', () => {
    let vol
    let compiler

    // Set up a new memfs instance before each test
    beforeEach(() => {
        vol = Volume.fromJSON({
            '@loadable/components': 'CCCC',
            '/Users/bchypak/Projects/pwa-kit/packages/pwa-kit-extension-support/src/configs/webpack/loaders/loader.js': `B====D`,
            '/src/index.js': `console.log("Hello World");`
        })
        compiler = webpack(createWebpackConfig())
        compiler.inputFileSystem = vol
        compiler.outputFileSystem = vol
    })

    it('should process the file and prepend the comment', (done) => {
        compiler.run((err, stats) => {
            if (err) {
                done(err)
                return
            }

            if (stats.hasErrors()) {
                console.error(stats.toJson().errors) // Log errors for debugging
                done(stats.toJson().errors)
                return
            }

            // Read the output file from memfs
            const output = vol.readFileSync('/dist/bundle.js', 'utf-8')

            // Expect the comment from the loader to be present
            expect(output).toContain('// This file was processed by loader.js')
            done()
        })
    })
})
