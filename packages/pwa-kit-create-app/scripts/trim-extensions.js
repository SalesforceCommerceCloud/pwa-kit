/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs')
const parser = require('@babel/parser')
const traverse = require('@babel/traverse').default
const path = require('path')
const pluginConfig = require('../assets/plugin-config')

const removeComponentCandidates = new Set() // List of files that are candidates for removal, as a result of trimming.
const SEPARATOR = path.sep // Use OS-specific path separator
const COMPONENT_SCAN_PATHS = [
    path.join(SEPARATOR, 'src', 'components', SEPARATOR),
    path.join(SEPARATOR, 'src', 'pages', SEPARATOR),
    path.join(SEPARATOR, 'src', 'hooks', SEPARATOR),
    path.join(SEPARATOR, 'src', 'routes.tsx'),
    path.join(SEPARATOR, 'config', 'constants.js')
]
const SINGLE_LINE_MARKER = '@sfdc-extension-line'
const BLOCK_MARKER_START = '@sfdc-extension-block-start'
const BLOCK_MARKER_END = '@sfdc-extension-block-end'

/**
 * Trim the directory to remove unused components and unused plugins.
 * @param {*} directory - The directory to trim.
 * @param {*} generatedPlugins - The plugins that were seleted/unselected by the user.
 * @returns {void}
 */
function trimExtensions(directory, generatedPlugins) {
    // clear removeComponentCandidates for each run
    removeComponentCandidates.clear()
    // read plugins from config file
    const configPlugins = pluginConfig.plugins || {}
    const plugins = {}
    Object.keys(configPlugins).forEach((pluginKey) => {
        plugins[pluginKey] = generatedPlugins?.[pluginKey] || false
    })

    if (Object.keys(plugins).length === 0) {
        console.log('No plugins found, skipping trim')
        return
    }

    // Helper function to recursively process directory
    const processDirectory = (dir) => {
        const files = fs.readdirSync(dir)
        files.forEach((file) => {
            const filePath = path.join(dir, file)
            const stats = fs.statSync(filePath)

            if (!filePath.includes('node_modules')) {
                if (stats.isDirectory()) {
                    processDirectory(filePath)
                } else if (
                    file.endsWith('.jsx') ||
                    file.endsWith('.tsx') ||
                    file.endsWith('.js') ||
                    file.endsWith('.ts')
                ) {
                    processFile(filePath, plugins)
                }
            }
        })
    }

    // Start recursive processing from root directory
    processDirectory(directory)
    removeUnusedComponents(directory)
}

function processFile(filePath, plugins) {
    let modified = false // flag to indicate if the file was modified
    let blockMarkers = [] // stack of block markers
    let removedBlocks = [] // list of blocks that were removed
    let skippingBlock = false // flag to indicate if we are skipping a block

    // Read source file
    const source = fs.readFileSync(filePath, 'utf-8')

    // Search file content for plugin references
    const pluginRegex = new RegExp(Object.keys(plugins).join('|'), 'g')
    if (pluginRegex.test(source)) {
        const lines = source.split('\n')
        const newLines = []
        let i = 0
        while (i < lines.length) {
            const line = lines[i]
            if (line.includes(SINGLE_LINE_MARKER)) {
                const matchingPlugin = Object.keys(plugins).find((plugin) => line.includes(plugin))
                if (matchingPlugin && plugins[matchingPlugin] === false) {
                    removedBlocks.push(lines[i + 1]) // add the line that was removed to the list of removed blocks
                    i += 2 // skip this line and the next
                    modified = true
                    continue
                }
            } else if (line.includes(BLOCK_MARKER_START)) {
                const matchingPlugin = Object.keys(plugins).find((plugin) => line.includes(plugin))
                if (matchingPlugin) {
                    // push a new block marker, if the plugin is false, we will start skipping the block
                    blockMarkers.push({plugin: matchingPlugin, line: i})
                    skippingBlock = plugins[matchingPlugin] === false
                }
            } else if (line.includes(BLOCK_MARKER_END)) {
                const plugin = Object.keys(plugins).find((p) => line.includes(p))
                // check if we have any start markers
                if (blockMarkers.length === 0) {
                    throw new Error(
                        `Block marker mismatch in ${filePath}, encountered end marker ${plugin} without a matching start marker at line ${i}:\n${lines[i]}`
                    )
                }
                const startMarker = blockMarkers.pop()
                if (startMarker.plugin !== plugin) {
                    throw new Error(
                        `Block marker mismatch in ${filePath}, expected end marker for ${startMarker.plugin} but got ${plugin} at line ${i}:\n${lines[i]}`
                    )
                }
                if (plugins[plugin] === false) {
                    // Push the removed block (from startMarker.line to current line) into removedBlocks
                    const removedBlock = lines.slice(startMarker.line, i + 1).join('\n')
                    removedBlocks.push(removedBlock)
                    modified = true
                    skippingBlock = false
                    i++
                    continue
                }
            }
            if (!skippingBlock) {
                newLines.push(line)
            }
            i++
        }
        if (blockMarkers.length > 0) {
            throw new Error(
                `Unclosed end marker found in ${filePath}: ${
                    blockMarkers[blockMarkers.length - 1].plugin
                }`
            )
        }
        if (modified) {
            const newSource = newLines.join('\n')
            try {
                fs.writeFileSync(filePath, newSource)
                console.log(`Updated file ${filePath}`)
            } catch (e) {
                console.error(`Error updating file ${filePath}: ${e.message}`)
                throw e
            }
            // walk through the removed blocks, parse them into ASTs, extract the import statements, and add them to the list of candidates for removal later.
            removedBlocks.forEach((block) => {
                if (block.includes('import')) {
                    const ast = parser.parse(block, {
                        sourceType: 'module',
                        plugins: ['jsx', 'typescript']
                    })
                    traverse(ast, {
                        VariableDeclaration(nodePath) {
                            // Extract import path from variable declarations like: const X = import('./path')
                            nodePath.node.declarations.forEach((declaration) => {
                                if (
                                    declaration.init &&
                                    declaration.init.type === 'CallExpression' &&
                                    declaration.init.callee.type === 'Import'
                                ) {
                                    const importArg = declaration.init.arguments[0]
                                    if (importArg && importArg.type === 'StringLiteral') {
                                        const importPath = importArg.value
                                        if (importPath.startsWith('.')) {
                                            let absoluteImportPath = path.resolve(
                                                path.dirname(filePath),
                                                importPath
                                            )
                                            removeComponentCandidates.add(absoluteImportPath)
                                        }
                                    }
                                }
                            })
                        }
                    })
                }
            })
        }
    }
}

/**
 * Remove unused components from the directory, as a result of trimming.
 * @param {*} directory - The directory to remove unused components from.
 * @returns {void}
 */
function removeUnusedComponents(directory) {
    // Step 1: Find all files with exports
    const exportedFiles = new Set()

    function collectExportedFiles(dir) {
        const files = fs.readdirSync(dir)
        files.forEach((file) => {
            const filePath = path.join(dir, file)
            const stats = fs.statSync(filePath)

            if (stats.isDirectory() && !filePath.includes('node_modules')) {
                collectExportedFiles(filePath)
            } else if (
                file.endsWith('.jsx') ||
                file.endsWith('.tsx') ||
                file.endsWith('.js') ||
                file.endsWith('.ts')
            ) {
                const source = fs.readFileSync(filePath, 'utf-8')
                const ast = parser.parse(source, {
                    sourceType: 'module',
                    plugins: ['jsx', 'typescript']
                })

                // Check if file has any exports
                let hasExports = false
                traverse(ast, {
                    ExportNamedDeclaration(path) {
                        hasExports = true
                        path.stop()
                    },
                    ExportDefaultDeclaration(path) {
                        hasExports = true
                        path.stop()
                    }
                })

                if (hasExports) {
                    // Store the absolute parent directory path
                    const absolutePath = path.resolve(filePath)
                    const pathWithoutExt = path.resolve(path.dirname(absolutePath))
                    exportedFiles.add(pathWithoutExt)
                }
            }
        })
    }

    // Step 2: Find all imports and remove used files from the set
    function findImports(dir) {
        const files = fs.readdirSync(dir)
        files.forEach((file) => {
            const filePath = path.join(dir, file)
            const stats = fs.statSync(filePath)

            if (stats.isDirectory() && !filePath.includes('node_modules')) {
                findImports(filePath)
            } else if (
                file.endsWith('.jsx') ||
                file.endsWith('.tsx') ||
                file.endsWith('.js') ||
                file.endsWith('.ts')
            ) {
                const source = fs.readFileSync(filePath, 'utf-8')
                const ast = parser.parse(source, {
                    sourceType: 'module',
                    plugins: ['jsx', 'typescript']
                })

                traverse(ast, {
                    ImportDeclaration(astPath) {
                        const importPath = astPath.node.source.value
                        if (importPath.startsWith('.')) {
                            // Resolve the import path relative to the current file
                            let absoluteImportPath = path.resolve(
                                path.dirname(filePath),
                                importPath
                            )
                            // Check if absoluteImportPath is a directory
                            const isDirectory =
                                fs.existsSync(absoluteImportPath) &&
                                fs.statSync(absoluteImportPath).isDirectory()
                            if (!isDirectory) {
                                // Go up one level so that we can compare the parent directory path
                                absoluteImportPath = path.resolve(path.dirname(absoluteImportPath))
                            }
                            // If this import matches any exported file and it's not from one of the component candidates, remove it from the set
                            const isCandidate = Array.from(removeComponentCandidates).find(
                                (candidate) =>
                                    path.resolve(filePath).startsWith(candidate + path.sep)
                            )
                            if (exportedFiles.has(absoluteImportPath) && !isCandidate) {
                                exportedFiles.delete(absoluteImportPath)
                            }
                        }
                    }
                })
            }
        })
    }

    // Execute both steps
    collectExportedFiles(directory)
    findImports(directory)

    // Filter and format the results
    const unusedFiles = Array.from(exportedFiles)
        .filter((filePath) => {
            // Only include files from COMPONENT_SCAN_PATHS
            return COMPONENT_SCAN_PATHS.some((path) => filePath.includes(path))
        })
        .map((filePath) => {
            // Add back the original extension if it exists
            const extensions = ['.jsx', '.tsx', '.js', '.ts']
            for (const ext of extensions) {
                const fileWithExt = filePath + ext
                if (fs.existsSync(fileWithExt)) {
                    return fileWithExt
                }
            }
            return filePath
        })

    // Output results
    const filesToRemove = unusedFiles.filter((filePath) => removeComponentCandidates.has(filePath))
    if (filesToRemove.length > 0) {
        console.log('\nDeleting unused components:')
        filesToRemove.forEach((file) => {
            console.log(`- ${file}`)
            try {
                const stats = fs.statSync(file)
                if (stats.isDirectory()) {
                    fs.rmSync(file, {recursive: true, force: true})
                    console.log(`  ✓ Successfully deleted directory`)
                } else {
                    fs.unlinkSync(file)
                    console.log(`  ✓ Successfully deleted file`)
                }
            } catch (error) {
                if (error.code === 'EPERM') {
                    console.log(
                        `  ✗ Permission denied - cannot delete. You may need to run with sudo or check permissions.`
                    )
                } else {
                    console.log(`  ✗ Error deleting: ${error.message}`)
                }
            }
        })
    } else {
        console.log('\nNo unused components found.')
    }

    return unusedFiles
}

// Allow running from command line - keeping this for manual testing purposes
// if (require.main === module) {
//     const directory = process.argv[2]
//     if (!directory) {
//         console.error('Please provide a directory path')
//         process.exit(1)
//     }
//     trimExtensions(directory, {SFDC_EXT_STORE_LOCATOR: false})
// }

module.exports = trimExtensions
