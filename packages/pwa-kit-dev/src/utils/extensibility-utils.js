/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import path from 'path'
import fs from 'fs-extra'

const REACT_EXTENSIBILITY_FILE = 'setup-app'
const SUPPORTED_FILE_TYPES = ['.ts', '.js']

/**
 * Given a list of extensions, returns an object where the key is the extensions
 * app entry import string, and the value the path to the source file.
 *
 * @param {string[]} extensions - Array of possible file extensions.
 * @returns {string|null} - The path of the first found file, or null if not found.
 *
 * @example
 * const extensions = ['@salesforce/extension-store-finder', '@salesforce/extension-checkout']
 *
 * buildAliases(extensions)
 * // Output
 * {
 *     ['@salesforce/extension-store-finder/setup-app']: '/path/to/setup-app.ts',
 *     ['@salesforce/extension-checkout/setup-app']: '/path/to/setup-app.ts',
 * }
 */
export const buildAliases = (extensions = []) => {
    const projectDir = process.cwd()

    const aliases = getExtensionNames(extensions).reduce((acc, extension) => {
        const basePath = path.join(
            projectDir,
            'node_modules',
            extension,
            'src', // 🤔
            REACT_EXTENSIBILITY_FILE
        )

        const foundFilePath = findFileWithExtension(basePath, SUPPORTED_FILE_TYPES)

        if (!foundFilePath) {
            // no setup-server file found, early exit because it's optional
            return acc
        }

        return {
            ...acc,
            [`${extension}/${REACT_EXTENSIBILITY_FILE}`]: foundFilePath
        }
    }, {})

    return aliases
}

/**
 * @private
 *
 * Returns the first file path found with a given set of extensions.
 *
 * @param {string} basePath - The base path of the file without extension.
 * @param {string[]} extensions - Array of possible file extensions.
 * @returns {string|null} - The path of the first found file, or null if not found.
 *
 * @example
 * const basePath = '/path/to/your/file'
 * const extensions = ['.js', '.json', '.txt']
 *
 * const filePath = findFileWithExtension(basePath, extensions)
 * if (filePath) {
 *     console.log(`Found file: ${filePath}`)
 * } else {
 *     console.log('File not found.')
 * }
 */
export const findFileWithExtension = (basePath, extensions = []) => {
    for (const ext of extensions) {
        const filePath = path.format({...path.parse(basePath), base: undefined, ext})
        if (fs.existsSync(filePath)) {
            return filePath
        }
    }
    return null
}

/**
 * This regular expression is used to identify and validate application extensions.
 * The current formate for a valid extension is an optional package namespace followed by
 * `extension-` string litteral, then the extension name. (E.g. @salesforce/extension-store-finder).
 * This regex has grouping that allows you to pull the namespace and application extension
 * name from the string being matched.
 *
 * @example
 *
 * const installedExtensions = Object.keys(pkg.devDependencies)
 *      .map((packageName) => packageName.match(nameRegex))
 *      .filter(Boolean)
 */
export const nameRegex = /^(?:@([^/]+)\/)?extension-(.+)$/

/**
 * @private
 */
export const getExtensionNames = (extensions) => {
    return (extensions || []).map((extension) => {
        return Array.isArray(extension) ? extension[0] : extension
    })
}
