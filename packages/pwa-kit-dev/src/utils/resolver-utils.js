/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import path from 'path'

const EXTENSION_NAMESPACE = '@salesforce'
const EXTENSION_PREFIX = 'extension'
const NODE_MODULES = 'node_modules'
const SDK_COMPONENT_MAP = {
    'app/routes': '/ssr/universal/components/routes'
}
const INDEX_FILE = 'index'

// Returns true/false indicating if the importPath resolves to a same named file as the sourcePath.
// @private
export const isSelfReference = (importPath, sourcePath) => {
    const indexRegExp = new RegExp(`(/${INDEX_FILE})$`)

    // Sanitize the input. Here we want to remove the file extension and index file if it exists.
    sourcePath = sourcePath.split('.')[0]
    sourcePath = sourcePath.split(path.sep).join('/')
    sourcePath = sourcePath.replace(indexRegExp, '')

    // Do the same for the import path even thought it's not common to use /index and file extensions in your module
    // imports.
    importPath = importPath.split('.')[0]
    importPath = importPath.replace(indexRegExp, '')

    return sourcePath.endsWith(importPath)
}

/**
 * Normalize and expand the extension configuration array so that it is easier to process.
 * @param {{String, Object}[]} extensions - The extensions configuration value as defined in the PWA-Kit config.
 * @returns {Object[]} extensions - The extensions array in object form.
 *
 * @example
 * const result = expand(["store-finder", ["account-pages", {singlePage: true}], './extensions/local-extension']);
 * console.log(result)
 * // [["@salesforce/extension-store-finder", {}], ["@salesforce/extension-account-pages", {singlePage: true}], ["/home/project/extensions/local-extension", {}]]
 */
export const expand = (extensions = []) =>
    extensions
        .filter((extension) => Boolean(extension))
        .map((extension) => {
            let [nameRef, config = {}] = Array.isArray(extension) ? extension : [extension, {}]

            switch (true) {
                case /^\./.test(nameRef):
                    // Relative Path
                    nameRef = nameRef.split(/\/|\\/).join(path.sep)
                    nameRef = path.join(process.cwd(), nameRef.replace('.', ''))
                    break
                case /^(\/|\\|\w:)/.test(nameRef):
                    // Absolute Path (UNIX|Windows)
                    nameRef = nameRef.split(/\/|\\/).join(path.sep)
                    break
                case /^@/.test(nameRef):
                    // Do nothing
                    break
                default:
                    // Default is to treat the reference as a extension "short" name.
                    nameRef = `${EXTENSION_NAMESPACE}/${EXTENSION_PREFIX}-${nameRef}`
                    break
            }

            return [nameRef, config]
        })

/**
 * Based on the current extensibility configuration, return an array of candiate file paths to be used
 * in the wild-card import module resolution for the given import path..
 *
 * @param {String} importPath - The import module-name.
 * @param {String} sourcePath - The path the the file of the source import.
 * @param {Object} opts - The path the the file of the source import.
 * @param {Array<shortName: String, config: Array>} opts.extensions - List of extensions used by the base PWA-Kit application.
 * @param {String>} opts.productDir - Absolute path of the base project.
 * @returns {String[]} paths - The potential paths to find the module import.
 */
export const buildCandidatePaths = (importPath, sourcePath, opts = {}) => {
    // Replace wildcard character as it has done its job getting us to this point.
    importPath = importPath.replace('*/', '')

    const {extensions = [], productDir = process.cwd()} = opts
    const isSelfReferenceImport = isSelfReference(importPath, sourcePath)
    let paths = expand(extensions).reverse()

    // Map all the extensions and resolve the module names to absolute paths.
    paths = paths.map((extension) => {
        // The reference can be a module/package or an absolute path to a file.
        const [extensionRef] = extension
        const isLocalExtension = extensionRef.startsWith(path.sep)

        return path.join(
            ...(isLocalExtension
                ? [extensionRef, importPath]
                : [productDir, NODE_MODULES, extensionRef, importPath])
        )
    })

    // Add non-extension search locations locations. The base project and the sdk as the final callback.
    paths = [
        // Base Project
        path.join(productDir, importPath),
        // Extensions
        ...paths,
        // SDK
        path.join(
            productDir,
            NODE_MODULES,
            EXTENSION_NAMESPACE,
            'pwa-kit-react-sdk',
            SDK_COMPONENT_MAP[importPath]
        )
    ]

    // Under certain circumstances we want to truncate the cadidate path array to prevent circular dependancies.
    // In particular, we only want to include extensions up to, but not including, the importing extension source if it is
    // a self-named import (e.g. importing routes from an overridden file names routes)
    if (isSelfReferenceImport) {
        // NOTE: Overriding files requires that you use the exact file name, you cannot replace a non-index file with one that
        // is an index file.
        const index = paths.indexOf(sourcePath.split('.')[0])
        paths = paths.slice(index + 1)
    }

    return paths
}
