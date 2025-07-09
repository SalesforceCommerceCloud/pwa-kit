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
const generate = require('@babel/generator').default
const path = require('path')
const pluginConfig = require('../assets/plugin-config')
const {execSync} = require('child_process')

const removeComponentCandidates = [] // List of files that are candidates for removal, as a result of trimming.
const SEPARATOR = path.sep // Use OS-specific path separator
const COMPONENT_SCAN_PATHS = [
    `${SEPARATOR}src${SEPARATOR}components${SEPARATOR}`,
    `${SEPARATOR}src${SEPARATOR}pages${SEPARATOR}`,
    `${SEPARATOR}src${SEPARATOR}hooks${SEPARATOR}`
]

/**
 * Trim the directory to remove unused components and unused plugins.
 * @param {*} directory - The directory to trim.
 * @param {*} generatedPlugins - The plugins that were seleted/unselected by the user.
 * @returns {void}
 */
function trimExtensions(directory, generatedPlugins) {
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

            if (stats.isDirectory() && !filePath.includes('node_modules')) {
                processDirectory(filePath)
            } else if (file.endsWith('.jsx') || file.endsWith('.tsx')) {
                processFile(filePath, plugins)
            }
        })
    }

    // Start recursive processing from root directory
    processDirectory(directory)

    removeUnusedComponents(directory)
}

function processFile(filePath, plugins) {
    // Read source file
    const source = fs.readFileSync(filePath, 'utf-8')

    // Search file content for plugin references
    const pluginRegex = new RegExp(Object.keys(plugins).join('|'))
    const hasPluginReferences = pluginRegex.test(source)
    if (!hasPluginReferences) {
        // No plugins found in file, return early
        return false
    }

    // Parse into AST
    const ast = parser.parse(source, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript']
    })

    // Track if we made any changes
    let modified = false

    // Shared helper to evaluate boolean expressions with plugins
    const evaluateLogicalExpression = (node) => {
        if (node.type === 'Identifier' && Object.keys(plugins).includes(node.name)) {
            return plugins[node.name]
        }
        if (node.type === 'LogicalExpression') {
            const left = evaluateLogicalExpression(node.left)
            const right = evaluateLogicalExpression(node.right)
            if (node.operator === '&&') {
                return left && right
            }
            if (node.operator === '||') {
                return left || right
            }
        }
        return true // Non-plugin expressions evaluate to true
    }

    const findRightmostExpression = (node) => {
        if (node.type === 'LogicalExpression') {
            return findRightmostExpression(node.right)
        }
        return node
    }

    // Helper to process plugin-guarded LogicalExpressions
    const processPluginLogicalExpression = (path) => {
        if (path.node.type === 'LogicalExpression') {
            const shouldKeep = evaluateLogicalExpression(path.node)
            if (!shouldKeep) {
                path.parentPath.remove()
            } else {
                path.parentPath.replaceWith(findRightmostExpression(path.node))
            }
            modified = true
        }
    }

    // Traverse AST and remove nodes guarded by plugin flags
    traverse(ast, {
        // Handle variable declarations like:
        // const HelloWorld = PLUGIN_NAME && loadable(...)
        VariableDeclaration(nodePath) {
            nodePath.node.declarations.forEach((declaration) => {
                if (declaration.init && declaration.init.type === 'LogicalExpression') {
                    const shouldKeep = evaluateLogicalExpression(declaration.init)
                    if (!shouldKeep) {
                        // Extract import path if declaration is an import statement
                        if (
                            declaration.init.right &&
                            declaration.init.right.type === 'CallExpression' &&
                            declaration.init.right.callee &&
                            declaration.init.right.callee.type === 'Identifier' &&
                            declaration.init.right.callee.name === 'loadable'
                        ) {
                            // Extract the import path from the loadable call expression and add it to the list of candidates for removal later.
                            const importArg = declaration.init.right.arguments[0]
                            if (
                                importArg.type === 'ArrowFunctionExpression' &&
                                importArg.body.type === 'CallExpression' &&
                                importArg.body.callee.type === 'Import'
                            ) {
                                const importPath = importArg.body.arguments[0].value
                                removeComponentCandidates.push(
                                    path.resolve(path.join(path.dirname(filePath), importPath))
                                )
                            }
                        }
                        nodePath.remove()
                    } else {
                        declaration.init = findRightmostExpression(declaration.init)
                    }
                    modified = true
                } else if (declaration?.init?.type === 'ConditionalExpression') {
                    const testValue = evaluateLogicalExpression(declaration.init.test)
                    if (testValue === true) {
                        declaration.init = declaration.init.consequent
                    } else {
                        declaration.init = declaration.init.alternate
                    }
                    modified = true
                }
            })
        },

        // Handle conditional expressions like:
        // {PLUGIN_NAME && [statement]}
        LogicalExpression(path) {
            processPluginLogicalExpression(path)
        },

        // Handle JSX elements in return statements that are guarded by plugin flags
        ReturnStatement(path) {
            if (path.node.argument && path.node.argument.type === 'JSXElement') {
                // Find JSX children that are guarded by plugin flags
                const children = path.get('argument').get('children')
                children.forEach((child) => {
                    if (child.node.type === 'JSXExpressionContainer') {
                        const expr = child.node.expression
                        if (
                            expr.type === 'LogicalExpression' ||
                            expr.type === 'ConditionalExpression'
                        ) {
                            const exprPath = child.get('expression')
                            try {
                                processPluginLogicalExpression(exprPath)
                            } catch (e) {
                                console.error(
                                    `Error processing plugin logical expression: ${exprPath}`
                                )
                            }
                        }
                    }
                })
            } else if (path.node.argument && path.node.argument.type === 'ConditionalExpression') {
                // Handle top-level ternary in return statement
                const testValue = evaluateLogicalExpression(path.node.argument.test)
                if (testValue === true) {
                    path.node.argument = path.node.argument.consequent
                } else {
                    path.node.argument = path.node.argument.alternate
                }
                modified = true
            }
        }
    })

    // Only write output if we made changes
    if (modified) {
        try {
            // Generate code from modified AST
            const output = generate(ast, {
                retainLines: true,
                compact: false
            }).code
            // Replace the original file with the trimmed version
            fs.writeFileSync(filePath, output)
            // prettify the file
            execSync(`npx prettier --write ${filePath}`)
            console.log(`Updated file ${filePath}`)
        } catch (e) {
            console.error(`Error updating file ${filePath}: ${e.message}`)
            throw e
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
                            // If this import matches any exported file, remove it from the set
                            if (exportedFiles.has(absoluteImportPath)) {
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
    const filesToRemove = unusedFiles.filter((filePath) =>
        removeComponentCandidates.includes(filePath)
    )
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

// // Allow running from command line - keeping this for manual testing purposes
// if (require.main === module) {
//     const directory = process.argv[2];
//     if (!directory) {
//         console.error('Please provide a directory path');
//         process.exit(1);
//     }
//     trimExtensions(directory, {});
// }

module.exports = trimExtensions
