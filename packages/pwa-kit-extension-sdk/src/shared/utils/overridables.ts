/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import fs from 'fs'
import path from 'path'
import glob from 'glob'
import {getConfiguredExtensions} from './helpers'

// Constants
export const IMPORT_REGEX =
    /(?:import\s+(?:[\w*\s{},]*)\s+from\s+['"]overridable!(.+?)['"]|import\s*\(\s*['"]overridable!(.+?)['"]\s*\))/g
export const SUPPORTED_FILE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx']
export const OVERRIDES_DIR = 'overrides'
export const SRC_DIR = 'src'
export const APP_DIR = 'app'
export const NODE_MODULES = 'node_modules'

/**
 * Represents an overridable import
 */
export interface OverridableImport {
    importPath: string
    sourceFile: string
    extension?: string // The extension package name if applicable
}

/**
 * Extension configuration from package.json
 */
export interface ExtensionConfig {
    name: string
    path?: string
    enabled?: boolean
    [key: string]: any
}

/**
 * Finds all files with the specified extensions in a directory
 * @param {string} dir - Directory to search
 * @param {string[]} extensions - File extensions to include
 * @returns {string[]} - Array of file paths
 */
export function findFiles(dir: string, extensions: string[]): string[] {
    if (!fs.existsSync(dir)) {
        return []
    }
    const pattern = `${dir}/**/*+(${extensions.join('|')})`
    return glob.sync(pattern, {nodir: true, absolute: true})
}

/**
 * Extracts overridable imports from a file
 * @param {string} filePath - Path to the file
 * @returns {OverridableImport[]} - Array of overridable import paths
 */
export function extractOverridableImports(
    filePath: string,
    extensionName?: string
): OverridableImport[] {
    const content = fs.readFileSync(filePath, 'utf8')
    const imports: OverridableImport[] = []
    let match

    while ((match = IMPORT_REGEX.exec(content)) !== null) {
        // The import path could be in either capture group depending on the import style
        const importPath = match[1] || match[2]
        if (importPath) {
            imports.push({
                importPath,
                sourceFile: filePath,
                extension: extensionName
            })
        }
    }

    return imports
}

/**
 * Gets the package name from package.json
 * @param {string} projectDir - Project directory
 * @returns {string|null} - Package name
 */
export function getPackageNameFromDir(projectDir: string): string | null {
    try {
        const packageJson = JSON.parse(
            fs.readFileSync(path.join(projectDir, 'package.json'), 'utf8')
        )
        return packageJson.name
    } catch (error) {
        console.error('Error reading package.json:', (error as Error).message)
        return null
    }
}

/**
 * Resolves the path to an extension
 * @param {string} extensionName - Extension name
 * @param {string} projectDir - Project directory
 * @returns {string|null} - Path to the extension
 */
export function resolveExtensionPath(extensionName: string, projectDir: string): string | null {
    // First check if it's a local extension in app/application-extensions
    const localExtPath = path.join(
        projectDir,
        APP_DIR,
        'application-extensions',
        extensionName.replace(/\//g, '_')
    )
    if (fs.existsSync(localExtPath)) {
        return localExtPath
    }

    // Then check in node_modules
    const nodeModulesPath = path.join(projectDir, NODE_MODULES, extensionName)
    if (fs.existsSync(nodeModulesPath)) {
        return nodeModulesPath
    }

    return null
}

/**
 * Finds all overridable imports in the project and its configured extensions
 * @param {string} projectDir - Project directory
 * @returns {OverridableImport[]} - Array of overridable imports
 */
export function findOverridableImports(projectDir: string): OverridableImport[] {
    let allImports: OverridableImport[] = []

    // First, check the project's own source files
    const srcDir = path.join(projectDir, SRC_DIR)
    const appDir = path.join(projectDir, APP_DIR)

    let projectFiles: string[] = []

    // Check src directory
    if (fs.existsSync(srcDir)) {
        const srcFiles = findFiles(srcDir, SUPPORTED_FILE_EXTENSIONS)
        projectFiles = projectFiles.concat(srcFiles)
    }

    // Check app directory
    if (fs.existsSync(appDir)) {
        const appFiles = findFiles(appDir, SUPPORTED_FILE_EXTENSIONS)
        projectFiles = projectFiles.concat(appFiles)
    }

    // Process project files
    projectFiles.forEach((file) => {
        const imports = extractOverridableImports(file)
        allImports = allImports.concat(imports)
    })

    // Then, check all configured extensions using the helper function
    try {
        const packageJson = JSON.parse(
            fs.readFileSync(path.join(projectDir, 'package.json'), 'utf8')
        )
        const extensions = getConfiguredExtensions(packageJson.mobify)

        extensions.forEach(([extensionName]) => {
            const extensionPath = resolveExtensionPath(extensionName, projectDir)
            if (!extensionPath) {
                console.warn(`Could not resolve path for extension: ${extensionName}`)
                return
            }

            const extensionSrcDir = path.join(extensionPath, SRC_DIR)
            if (fs.existsSync(extensionSrcDir)) {
                const extensionFiles = findFiles(extensionSrcDir, SUPPORTED_FILE_EXTENSIONS)
                extensionFiles.forEach((file) => {
                    const imports = extractOverridableImports(file, extensionName)
                    allImports = allImports.concat(imports)
                })
            }
        })
    } catch (error) {
        console.error('Error reading package.json:', (error as Error).message)
    }

    return allImports
}

/**
 * Finds all override files in the project
 * @param {string} projectDir - Project directory
 * @returns {string[]} - Array of override file paths
 */
export function findOverrideFiles(projectDir: string): string[] {
    const overridesDir = path.join(projectDir, SRC_DIR, OVERRIDES_DIR)

    if (!fs.existsSync(overridesDir)) {
        return []
    }

    return findFiles(overridesDir, SUPPORTED_FILE_EXTENSIONS)
}

/**
 * Finds all override files in the app directory (for PWA Kit applications)
 * @param {string} projectDir - Project directory
 * @returns {string[]} - Array of override file paths
 */
export function findAppOverrideFiles(projectDir: string): string[] {
    const appOverridesDir = path.join(projectDir, APP_DIR, OVERRIDES_DIR)

    if (!fs.existsSync(appOverridesDir)) {
        return []
    }

    return findFiles(appOverridesDir, SUPPORTED_FILE_EXTENSIONS)
}

/**
 * Checks if an override file has a corresponding overridable import
 * @param {string} overrideFile - Path to the override file
 * @param {OverridableImport[]} overridableImports - Array of overridable imports
 * @param {string} projectDir - Project directory
 * @returns {boolean} - True if the override file has a corresponding overridable import
 */
export function hasCorrespondingOverridableImport(
    overrideFile: string,
    overridableImports: OverridableImport[],
    projectDir: string
): boolean {
    // Extract the extension name and relative path from the override file
    const overridesDir = path.join(projectDir, SRC_DIR, OVERRIDES_DIR)
    const appOverridesDir = path.join(projectDir, APP_DIR, OVERRIDES_DIR)

    let relativePath: string
    let extensionName = ''

    if (overrideFile.includes(overridesDir)) {
        relativePath = path.relative(overridesDir, overrideFile)
        const parts = relativePath.split(path.sep)
        if (parts.length > 0) {
            extensionName = parts[0]
            relativePath = parts.slice(1).join(path.sep)
        }
    } else if (overrideFile.includes(appOverridesDir)) {
        relativePath = path.relative(appOverridesDir, overrideFile)
        const parts = relativePath.split(path.sep)
        if (parts.length > 0) {
            extensionName = parts[0]
            relativePath = parts.slice(1).join(path.sep)
        }
    } else {
        // If the file is not in either overrides directory, it can't be an override
        return false
    }

    // Remove file extension
    relativePath = relativePath.replace(/\.[^/.]+$/, '')

    // Check if any overridable import matches this path
    return overridableImports.some((imp) => {
        const importPath = imp.importPath.startsWith('./')
            ? imp.importPath.substring(2)
            : imp.importPath
        return importPath.includes(relativePath)
    })
}

/**
 * Groups imports by source file
 * @param {OverridableImport[]} imports - Array of overridable imports
 * @param {string} projectDir - Project directory
 * @returns {Record<string, string[]>} - Object with source files as keys and import paths as values
 */
export function groupImportsBySourceFile(
    imports: OverridableImport[],
    projectDir: string
): Record<string, {paths: string[]; extension?: string}> {
    return imports.reduce((acc, imp) => {
        const relativePath = path.relative(projectDir, imp.sourceFile)
        if (!acc[relativePath]) {
            acc[relativePath] = {
                paths: [],
                extension: imp.extension
            }
        }
        acc[relativePath].paths.push(imp.importPath)
        return acc
    }, {} as Record<string, {paths: string[]; extension?: string}>)
}
