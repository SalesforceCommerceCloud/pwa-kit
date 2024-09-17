/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'path'
import webpack from 'webpack'
import {createFsFromVolume, Volume} from 'memfs'

export const BASE_DIR = '/virtual/project'

// TODO: This should be coming from a shared location (config or constants) but we can't do that just yet
// as the config is immediately invoked so it causes errors in this file.
export const SUPPORTED_FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json']

/**
 * Runs the Webpack compiler with a virtual file system.
 *
 * @param {string} fixture - The name of the entry file for Webpack to compile.
 * @param {Object} [options={}] - Optional configuration for the Webpack compiler.
 * @param {Object} [options.files={}] - An object representing the virtual file system. The keys are file paths and the values are file content.
 * @param {Function} [options.buildPlugins] - A function that returns an array of Webpack plugins. It is passed the virtual file system.
 *
 * @returns {Promise} A promise that resolves with the Webpack stats object or rejects with errors.
 *
 * @example
 * const fixture = 'src/index.js';
 * const files = {
 *   '/src/index.js': 'console.log("Hello, world!");',
 *   '/package.json': '{"name": "test"}'
 * };
 * const plugins = (fs) => [new MyCustomPlugin()];
 * runWebpackCompiler(fixture, { files, buildPlugins: plugins })
 *   .then((stats) => console.log('Compilation successful'))
 *   .catch((errors) => console.error('Compilation failed', errors));
 */
export const runWebpackCompiler = (fixture, options = {}) => {
    const {buildPlugins = () => [], files = {}} = options

    // Setup the virtual filesystem with the provided files.
    const volume = Volume.fromJSON(files)
    const fileSystem = createFsFromVolume(volume)

    const plugins = buildPlugins({fileSystem})

    const compiler = webpack({
        context: BASE_DIR,
        entry: `./${fixture}`,
        output: {
            path: path.resolve(BASE_DIR),
            filename: 'bundle.js'
        },
        resolve: {
            plugins,
            extensions: SUPPORTED_FILE_EXTENSIONS
        }
    })

    // Tell Webpack to use the previously created virtual fs.
    compiler.inputFileSystem = fileSystem
    compiler.outputFileSystem = fileSystem

    return new Promise((resolve, reject) => {
        compiler.run((err, stats) => {
            if (err) reject(err)
            if (stats.hasErrors()) reject(stats.toJson().errors)

            resolve(stats)
        })
    })
}
