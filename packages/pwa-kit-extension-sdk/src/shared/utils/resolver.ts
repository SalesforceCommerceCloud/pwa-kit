/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Third-party imports
import path from 'path'

// Local
import {expand} from './index'

// Types
import {ApplicationExtensionEntry, BuildCandidatePathsOptions} from '../../types'

// TODO: Should this be in a constants folder?
const EXTENSION_NAMESPACE = '@salesforce'
const NODE_MODULES = 'node_modules'
const OVERRIDES = 'overrides'
const APP = 'app'
const SRC = 'src'
const PWA_KIT_REACT_SDK = 'pwa-kit-react-sdk'

// TODO: We should determine if we want the `overrides-resolver-plugin` to handle resolution of application special
// components like _app and _document. If so we can update this map and remove the special logic from our webpack
// configuration.
const SDK_COMPONENT_MAP: Record<string, string> = {}
const INDEX_FILE = 'index' // TODO: Make this value obey the webpack's `resolve.mainFiles` options.

// Returns true/false indicating if the importPath resolves to a same named file as the sourcePath.
// @private
export const isSelfReference = (importPath: string, sourcePath: string) => {
    const indexRegExp = new RegExp(`(/${INDEX_FILE})$`)

    // Sanitize the input. Here we want to remove the file extension and index file if it exists.
    sourcePath = sourcePath.replace(/\.[^/.]+$/, '')
    sourcePath = sourcePath.split(path.sep).join('/')
    sourcePath = sourcePath.replace(indexRegExp, '')

    // Do the same for the import path even thought it's not common to use /index and file extensions in your module
    // imports.
    importPath = importPath.split('.')[0]
    importPath = importPath.replace(indexRegExp, '')

    return sourcePath.endsWith(importPath)
}

// TODO: The extensionsEntries really isn't optional, so maybe it shouldn't exist in the opts object?
/**
 * Based on the current extensibility configuration, return an array of candidate file paths to be used
 * in the dollar-prefixed import module resolution for the given import path.
 *
 * @param {String} importPath - The import module-name.
 * @param {String} sourcePath - The path to the file of the source import.
 * @param {Object} opts - The path the file of the source import.
 * @param {Array<shortName: String, config: Array>} opts.extensionEntries - List of extension entries (tuples) used by the base PWA-Kit application.
 * @param {String} opts.projectDir - Absolute path of the base project.
 */
export const buildCandidatePaths = (
    importPath: string,
    sourcePath: string,
    opts: BuildCandidatePathsOptions
) => {
    // Replace $ character as it has done its job getting us to this point.
    importPath = importPath.replace('$/', '')

    const {extensionEntries = [], projectDir = process.cwd()} = opts
    const isSelfReferenceImport = isSelfReference(importPath, sourcePath)
    let paths = []

    // Map all the extensions and resolve the module names to absolute paths.
    paths = expand(extensionEntries)
        .filter(([, {enabled}]) => typeof enabled === 'undefined' || enabled)
        .reverse()
        .reduce((acc, extensionEntry) => {
            // The reference can be a module/package or an absolute path to a file.
            const [extensionRef] = extensionEntry
            const srcPath = path.join(projectDir, NODE_MODULES, extensionRef, SRC)
            return [
                ...acc,
                path.join(srcPath, OVERRIDES, importPath),
                path.join(srcPath, importPath)
            ]
        }, [] as ApplicationExtensionEntry[])

    // Add non-extension search locations locations. The base project and the sdk as the final callback.
    paths = [
        // Base Project
        path.join(projectDir, APP, OVERRIDES, importPath),
        path.join(projectDir, APP, importPath),
        // Extensions
        ...paths,
        // SDK
        ...(SDK_COMPONENT_MAP[importPath]
            ? path.join(
                  projectDir,
                  NODE_MODULES,
                  EXTENSION_NAMESPACE,
                  PWA_KIT_REACT_SDK,
                  SDK_COMPONENT_MAP[importPath]
              )
            : [])
    ]

    // Under certain circumstances we want to truncate the candidate path array to prevent circular dependencies.
    // In particular, we only want to include extensions up to, but not including, the importing extension source if it is
    // a self-referenced import (e.g. importing routes from an overridden file names routes)
    if (isSelfReferenceImport) {
        // NOTE: Overriding files requires that you use the exact file name, you cannot replace a non-index file with one that
        // is an index file.
        const index = paths.indexOf(sourcePath.split('.')[0])
        paths = paths.slice(index + 2)
    }

    return paths
}
