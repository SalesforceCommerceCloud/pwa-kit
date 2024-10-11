/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const parser = require("@babel/parser")
const babel = require("@babel/core")
// TODO: Refactor the shared logic
let extensionLoader = require('../webpack/loaders/extensions-loader')
import fse from 'fs-extra'
import _path, {resolve} from 'path'

const projectDir = process.cwd()
const pkg = fse.readJsonSync(resolve(projectDir, 'package.json'))

// const Module = require('module');
// const originalRequire = Module.prototype.require;

const getOptions =() => {
    return {
        pkg,
        getConfig: () => ({
            app: {
                extensions: ['@salesforce/extension-sample']
            }
        }),
        mode: 'server'
    }
}
// application-extensions-placeholder
// const fileToReplace = 'assets/application-extensions-placeholder.js'
const repalcementContent = extensionLoader({getOptions}, {getOptions})
// A Set to keep track of processed file paths
const processedFiles = new Set()

module.exports = function replaceFileContentPlugin() {
    return {
        // pre() {
        //     // Hook into `require` to customize the module resolution logic
        //     Module.prototype.require = function (request: any) {
        //         console.log('request: ', request)
        //         if (false) {
        //             const resolvedPath = _path.resolve(projectDir, request);
        //             return originalRequire.call(this, resolvedPath);
        //         }   
        //         return originalRequire.call(this, request)
        //     }
        // },
        // post() {
        //     // Restore the original `require` function after the plugin finishes
        //     Module.prototype.require = originalRequire;
        // },
        visitor: {
            Program(path: any, state: any) {
                const filePath = state.file.opts.filename

                // Add a marker to the state to prevent reprocessing
                if (processedFiles.has(filePath)) {
                    // If the file has been processed, skip further transformations
                    return
                }

                // Check if the file matches one of the files we want to replace
                if (filePath.endsWith('assets/application-extensions-placeholder.js')) {
                    console.log('Project Directory: ', projectDir)
                    const newContent = repalcementContent

                    let parsedAst;
                    try {
                        // Parse the new content as a full program
                        parsedAst = parser.parse(newContent, {
                            sourceType: "module", // Ensure it supports import/export
                            plugins: [
                                "jsx", 
                                "typescript"], // Add additional plugins if needed
                        }).program;
                    } catch (error: any) {
                        throw new Error(`Failed to parse content for ${filePath}: ${error.message}`)
                    }
                    
                    // Mark the file as processed by adding its path to the Set
                    processedFiles.add(filePath)

                    // Replace the entire file content with the parsed AST
                    path.replaceWith(parsedAst)

                    // Manually transpile the code to ES5 using Babel
                    const transpiledCode = babel.transformFromAstSync(parsedAst, newContent, {
                        filename: filePath,
                        presets: [
                            [
                                '/Users/bchypak/Projects/pwa-kit/packages/pwa-kit-dev/node_modules/@babel/preset-env', 
                                { 
                                    targets: { 
                                        node: "current" 
                                    } 
                                }
                            ]
                        ],  // Transpile to ES5
                    }).code

                    // Parse the transpiled code and replace the current program node with it
                    const transpiledAst = parser.parse(transpiledCode, {
                        sourceType: "script",  // Now using script because it's ES5
                    }).program

                    // Replace with the transpiled AST and complete the plugin execution.
                    path.replaceWith(transpiledAst)
                    path.stop()
                }
            }
        }
    }
}
