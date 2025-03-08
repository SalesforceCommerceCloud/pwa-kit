/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Third-party imports
import fs from 'fs'
import path from 'path'

// Local
import {expand} from './index'

// Types
import {BuildCandidatePathsOptions} from '../../types'

// TODO: Should this be in a constants folder?
const NODE_MODULES = 'node_modules'
const OVERRIDES = 'overrides'
const SRC = 'src'
const APP = 'app'

/**
 * Returns the pacakge name from the `package.json` at the provided location.
 * @param projectPath The the projects root path.
 * @returns The package name or undefined if not found.
 */
export const getPackageName = (projectPath: string, opts: any): string | undefined => {
    const filesystem: any = opts?.filesystem || fs
    const packageJsonPath = path.join(projectPath, 'package.json')
    let packageName

    if (filesystem.existsSync(packageJsonPath)) {
        try {
            const packageJson = JSON.parse(filesystem.readFileSync(packageJsonPath, 'utf-8'))
            packageName = packageJson.name || undefined
        } catch (error) {
            console.error(`Failed to parse package.json at ${packageJsonPath}:`, error)
            return undefined
        }
    }

    return packageName
}

/**
 * Based on the current extensibility configuration and the provided import path, return a list of paths
 * representing potential locations for overrides for the given file.
 *
 * @param {String} importPath - The import module-name.
 * @param {String} importSourceExtension - The source extension package name for the import.
 * @param {Object} opts - The path the file of the source import.
 * @param {String} opts.canonicalSource - A known source of the canonical module for this import path.
 * @param {Array<shortName: String, config: Array>} opts.extensionEntries - List of extension entries (tuples) used by the base PWA-Kit application.
 * @param {String} opts.projectDir - Absolute path of the base project.
 */
export const buildCandidatePaths = (
    importPath: string,
    importSourceExtension: string,
    opts: BuildCandidatePathsOptions
) => {
    if (!importPath) {
        throw new Error('Missing required "importPath" argument')
    }

    if (!importSourceExtension) {
        throw new Error('Missing required "importSourceExtension" argument')
    }

    const {canonicalSource = '', projectDir = process.cwd()} = opts
    let {extensionEntries = []} = opts

    // Extensions that define overridable files can only have those files overridden by other extensions configured
    // after it, and also the base template. For this reason we have to slice the candidate paths at it returns paths
    // for all configured extensions.
    // @example
    // Given the following extension list: ['@salesforce/extension-a', '@salesforce/extension-b', '@salesforce/extension-c']
    // Overridable files defined in extension-a can only be overridden by extensions b and c, and the base project.
    // Overridable files defined in extension-b can only be overridden by extension c, and the base project.
    // Overridable files defined in extension-c can only be overridden by the base project.
    const currentExtensionIndex = extensionEntries.findIndex(
        (path) => path.indexOf(importSourceExtension) > -1
    )
    extensionEntries = extensionEntries.slice(currentExtensionIndex + 1)

    // Map all the extensions and resolve the module names to absolute paths.
    let paths: string[] = expand(extensionEntries)
        .filter(([, {enabled}]) => typeof enabled === 'undefined' || enabled)
        .map(([name]) => name)
        .reduce(
            (acc, extensionRef) => [
                path.join(
                    projectDir,
                    NODE_MODULES,
                    extensionRef,
                    SRC,
                    OVERRIDES,
                    ...importSourceExtension.split(path.sep),
                    importPath
                ),
                ...acc
            ],
            [] as string[]
        )

    // Include the base projects override folder as a potential source. Also include the canonical source if one is
    // provided.
    paths = [
        path.join(projectDir, APP, OVERRIDES, ...importSourceExtension.split(path.sep), importPath),
        ...paths,
        ...(canonicalSource ? [canonicalSource] : [])
    ]

    return paths
}
