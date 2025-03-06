/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'path'
import fs from 'fs'
import glob from 'glob'
import {getConfiguredExtensions} from './helpers'
import {OVERRIDES, NODE_MODULES, APP, SRC} from './resolver'
import {OverridableImport} from '../../types'

// Constants
export const EXTENSION_PACKAGE_PREFIX = 'extension-'
export const EXTENSION_PACKAGE_NAMESPACE = '@salesforce'
export const IMPORT_REGEX =
    /(?:import\s+(?:[\w*\s{},]*)\s+from\s+['"]overridable!(.+?)['"]|import\s*\(\s*['"]overridable!(.+?)['"]\s*\))/g
export const SUPPORTED_FILE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx']
export const OVERRIDABLE_FILE_NAME = '.force_overrides'

/**
 * Extracts the component name and extension from an override file path
 */
export const parseOverridePath = (overrideFile: string, projectDir: string) => {
    const overridesDir = path.join(projectDir, SRC, OVERRIDES)
    const appOverridesDir = path.join(projectDir, APP, OVERRIDES)

    // Determine the base directory and compute relative path
    const baseDir = overrideFile.includes(overridesDir)
        ? overridesDir
        : overrideFile.includes(appOverridesDir)
        ? appOverridesDir
        : null

    if (!baseDir) return null

    const relativePath = path.relative(baseDir, overrideFile)
    const [extensionName, ...pathParts] = relativePath.split(path.sep)
    const componentPath = pathParts.join(path.sep).replace(/\.[^/.]+$/, '')
    const componentName = path.basename(componentPath)

    return {
        extensionName,
        componentName,
        componentPath
    }
}

/**
 * Checks if a file path belongs to an extension
 */
export const isExtensionFile = (filePath: string): boolean => {
    return filePath.includes(`${path.sep}${EXTENSION_PACKAGE_PREFIX}`)
}

/**
 * Gets overridable paths from the .force_overrides file
 */
export const getOverridablePaths = (projectDir: string): string[] => {
    try {
        return fs
            .readFileSync(path.join(projectDir, OVERRIDABLE_FILE_NAME), 'utf8')
            .split(/\r?\n/)
            .filter((line) => !line.startsWith('//') && line.trim() !== '')
    } catch {
        return []
    }
}

/**
 * Normalizes a source path for comparison
 */
export const normalizeSourcePath = (sourcePath: string, isMonoRepo = false): string => {
    // Split on node_modules or packages (for monorepo) and take the last part
    const parts = sourcePath.split(path.sep + (isMonoRepo ? 'packages' : NODE_MODULES) + path.sep)
    const lastPart = parts[parts.length - 1] || ''

    // Convert to POSIX path
    const posixPath = lastPart.replace(/\\/g, '/')

    // Add standard prefix
    return `./${NODE_MODULES}/${
        isMonoRepo ? EXTENSION_PACKAGE_NAMESPACE + path.posix.sep : ''
    }${posixPath}`
}

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
    const parsed = parseOverridePath(overrideFile, projectDir)
    if (!parsed) return false

    const {extensionName, componentName} = parsed

    return overridableImports.some(({importPath, extension}) => {
        // Clean up the import path
        const importName = path.basename(importPath.replace(/^\.\//, ''))

        // Check if both the component name and extension match
        const nameMatches = importName === componentName
        const extensionMatches = extension ? extension.includes(extensionName) : false

        return extension ? nameMatches && extensionMatches : nameMatches
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
