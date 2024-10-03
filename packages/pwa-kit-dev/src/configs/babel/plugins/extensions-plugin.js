/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
const parser = require("@babel/parser");
const generate = require("@babel/generator").default;
let extensionLoader = require('../../webpack/loaders/extensions-loader')
import fse from 'fs-extra'
import path, {resolve} from 'path'

const projectDir = process.cwd()
const pkg = fse.readJsonSync(resolve(projectDir, 'package.json'))

console.log('extensionLoader: ', extensionLoader)
extensionLoader = extensionLoader.bind({
    getOptions: () => {
        return {
            pkg
        }
    }
})
console.log('extensionLoader: ', extensionLoader())

module.exports = function replaceFileContentPlugin({types: t}) {
    return {
        visitor: {
            Program(path, state) {
                const filePath = state.file.opts.filename
                const filesToReplace = state.opts.filesToReplace || {}

                // Check if the file matches one of the files we want to replace
                if (filesToReplace[filePath]) {
                    console.log('Found file to repalce!')
                    const newContent = filesToReplace[filePath];


                    let parsedAst;
                    try {
                        // Parse the content string as JavaScript code using Babel's parser
                        parsedAst = parser.parseExpression(newContent);
                    } catch (error) {
                        throw new Error(`Failed to parse content for ${filePath}: ${error.message}`);
                    }
                    
                    
                    // Replace the entire content of the file with new content
                    path.replaceWith(
                        t.program([
                            t.expressionStatement(
                                t.assignmentExpression(
                                    "=",
                                    t.memberExpression(
                                        t.identifier("module"),
                                        t.identifier("exports")
                                    ),
                                    parsedAst // Assign the parsed object or string to module.exports
                                )
                            )
                        ])
                    )

                    path.stop()
                }
            }
        }
    }
}
