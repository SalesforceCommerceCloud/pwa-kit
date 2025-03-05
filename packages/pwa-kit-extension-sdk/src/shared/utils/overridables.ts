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
import {OVERRIDES, NODE_MODULES, APP, SRC} from './resolver'

import {OverridableImport} from '../../types'

export const IMPORT_REGEX =
    /(?:import\s+(?:[\w*\s{},]*)\s+from\s+['"]overridable!(.+?)['"]|import\s*\(\s*['"]overridable!(.+?)['"]\s*\))/g
export const SUPPORTED_FILE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx']

/**
 * Finds all files with the specified extensions in a directory.
 * @param {string} dir - Directory to search.
 * @param {string[]} extensions - File extensions to include.
 * @returns {string[]} Array of absolute file paths matching the criteria.
 */
export const findFiles = (dir: string, extensions: string[]): string[] =>
    fs.existsSync(dir)
        ? glob.sync(`${dir}/**/*+(${extensions.join('|')})`, {nodir: true, absolute: true})
        : []

/**
 * Extracts overridable imports from a file.
 * @param {string} filePath - Path to the file to analyze.
 * @param {string} [extensionName] - Name of the extension, if applicable.
 * @returns {OverridableImport[]} Array of overridable imports found in the file.
 */
export const extractOverridableImports = (
    filePath: string,
    extensionName?: string
): OverridableImport[] => {
    const content = fs.readFileSync(filePath, 'utf8')
    return Array.from(content.matchAll(IMPORT_REGEX), (match) => ({
        // The import path could be in either capture group depending on the import style
        importPath: match[1] || match[2],
        sourceFile: filePath,
        extension: extensionName
    })).filter((imp) => imp.importPath)
}

/**
 * Resolves the path to an extension.
 * @param {string} extensionName - Name of the extension to resolve.
 * @param {string} projectDir - Project directory.
 * @returns {string|null} Resolved path to the extension if found, null otherwise.
 */
export const resolveExtensionPath = (extensionName: string, projectDir: string): string | null => {
    const paths = [
        path.join(projectDir, APP, 'application-extensions', extensionName.replace(/\//g, '_')),
        path.join(projectDir, NODE_MODULES, extensionName)
    ]
    return paths.find(fs.existsSync) ?? null
}

/**
 * Finds all overridable imports in the project and its configured extensions
 * @param {string} projectDir - Project directory
 * @returns {OverridableImport[]} - Array of overridable imports
 */
export const findOverridableImports = (projectDir: string): OverridableImport[] => {
    const processFiles = (dir: string, extensionName?: string) =>
        findFiles(dir, SUPPORTED_FILE_EXTENSIONS).flatMap((file) =>
            extractOverridableImports(file, extensionName)
        )

    const projectImports = [
        ...processFiles(path.join(projectDir, SRC)),
        ...processFiles(path.join(projectDir, APP))
    ]

    try {
        const packageJson = JSON.parse(
            fs.readFileSync(path.join(projectDir, 'package.json'), 'utf8')
        )
        const extensions = getConfiguredExtensions(packageJson.mobify)
        const extensionImports = extensions.flatMap(([extensionName]) => {
            const extensionPath = resolveExtensionPath(extensionName, projectDir)
            return extensionPath ? processFiles(path.join(extensionPath, SRC), extensionName) : []
        })

        const allImports = [...projectImports, ...extensionImports]
        const uniqueImports = Array.from(
            new Map(
                allImports.map((imp) => [
                    `${imp.sourceFile}:${imp.importPath}`, // Changed to exclude extension
                    imp
                ])
            ).values()
        )
        return uniqueImports
    } catch (error) {
        console.error('Error reading package.json:', (error as Error).message)
        return projectImports
    }
}

/**
 * Finds all override files in the project or app directory.
 * @param {string} projectDir - Project directory.
 * @param {boolean} [inAppDir=false] - Whether to search in the app directory instead of src.
 * @returns {string[]} Array of override file paths.
 */
export const findOverrideFiles = (projectDir: string, inAppDir = false): string[] =>
    findFiles(path.join(projectDir, inAppDir ? APP : SRC, OVERRIDES), SUPPORTED_FILE_EXTENSIONS)

/**
 * Checks if an override file has a corresponding overridable import.
 * @param {string} overrideFile - Path to the override file.
 * @param {OverridableImport[]} overridableImports - Array of overridable imports.
 * @param {string} projectDir - Project directory.
 * @returns {boolean} True if the override file has a corresponding overridable import, false otherwise.
 */
export const hasCorrespondingOverridableImport = (
    overrideFile: string,
    overridableImports: OverridableImport[],
    projectDir: string
): boolean => {
    // Extract the extension name and relative path from the override file
    const overridesDir = path.join(projectDir, SRC, OVERRIDES)
    const appOverridesDir = path.join(projectDir, APP, OVERRIDES)

    // Determine the base directory and compute relative path
    const baseDir = overrideFile.includes(overridesDir)
        ? overridesDir
        : overrideFile.includes(appOverridesDir)
        ? appOverridesDir
        : null

    // If the file is not in either overrides directory, it can't be an override
    if (!baseDir) return false

    // Get the relative path from the overrides directory
    const relativePath = path.relative(baseDir, overrideFile)
    
    // Split the path into parts to extract extension name and component path
    const pathParts = relativePath.split(path.sep)
    
    // The first part should be the extension name
    const extensionName = pathParts[0]
    
    // Extract the file name without extension
    const fileName = path.basename(overrideFile).replace(/\.[^/.]+$/, '')
    
    // For each overridable import, check if it matches our override file
    return overridableImports.some(({importPath, extension}) => {
        // Clean up the import path (remove ./ prefix if present)
        const cleanImportPath = importPath.replace(/^\.\//, '')
        
        // Get the file name from the import path
        const importFileName = path.basename(cleanImportPath)
        
        // Check if the file name matches
        const fileNameMatches = importFileName === fileName
        
        // Check if the extension matches (if provided)
        const extensionMatches = extension ? extension.includes(extensionName) : false
        
        // For extension imports, we need both the file name and extension to match
        // For non-extension imports, just the file name needs to match
        return extension ? (fileNameMatches && extensionMatches) : fileNameMatches
    })
}

/**
 * Groups imports by source file
 * @param {OverridableImport[]} imports - Array of overridable imports
 * @param {string} projectDir - Project directory
 * @returns {Record<string, {paths: string[], extension?: string}>} - Object with source files as keys and import details as values
 */
export const groupImportsBySourceFile = (
    imports: OverridableImport[],
    projectDir: string
): Record<string, {paths: string[]; extension?: string}> =>
    imports.reduce((acc, imp) => {
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
