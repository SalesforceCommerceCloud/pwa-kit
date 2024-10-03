/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const parser = require("@babel/parser")
const generate = require("@babel/generator").default
const babel = require("@babel/core")
let extensionLoader = require('../../webpack/loaders/extensions-loader')
import fse from 'fs-extra'
import _path, {resolve} from 'path'

const projectDir = process.cwd()
const pkg = fse.readJsonSync(resolve(projectDir, 'package.json'))

console.log('extensionLoader: ', extensionLoader)
extensionLoader = extensionLoader.bind({
    getOptions: () => {
        return {
            pkg,
            mode: 'server'
        }
    }
})
// console.log('extensionLoader: ', extensionLoader())

const fileToReplace = '/Users/bchypak/Projects/pwa-kit/packages/pwa-kit-dev/dist/ssr/server/extensions.js'
const repalcementContent = extensionLoader()

    // A Set to keep track of processed file paths
const processedFiles = new Set();


module.exports = function replaceFileContentPlugin({types: t}) {
    return {
        visitor: {
            Program(path, state) {
                const filePath = state.file.opts.filename
                // const filesToReplace = state.opts.filesToReplace || {}

                // Add a marker to the state to prevent reprocessing
                if (processedFiles.has(filePath)) {
                    // If the file has been processed, skip further transformations
                    return
                }

                // Check if the file matches one of the files we want to replace
                if (filePath === fileToReplace) {
                    console.log('Found file to replace!')
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
                    } catch (error) {
                        throw new Error(`Failed to parse content for ${filePath}: ${error.message}`);
                    }
                    
                    // Mark the file as processed by adding its path to the Set
                    processedFiles.add(filePath)

                    // Replace the entire file content with the parsed AST
                    path.replaceWith(parsedAst)

                    // Manually transpile the code to ES5 using Babel
                    console.log('before transpile')
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
                    console.log('after transpile')

                    // Parse the transpiled code and replace the current program node with it
                    const transpiledAst = parser.parse(transpiledCode, {
                        sourceType: "script",  // Now using script because it's ES5
                    }).program

                    // Replace with the transpiled AST
                    path.replaceWith(transpiledAst)

                    path.stop()
                    console.log('done!!')
                }
            }
        }
    }
}
