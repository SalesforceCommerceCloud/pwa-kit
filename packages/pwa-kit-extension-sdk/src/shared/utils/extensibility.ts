/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Third-Party
import fse from 'fs-extra'
import path, {resolve} from 'path'

// Types
import {ApplicationExtensionEntry, ApplicationExtensionEntryTuple} from '../../types'

// CONSTANTS
// const REACT_EXTENSIBILITY_FILE = 'setup-app'
// const EXPRESS_EXTENSIBILITY_FILE = 'setup-server'
// const SUPPORTED_FILE_TYPES = ['.ts', '.js']

// TODO: Update this block comment.
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
 *     ['@salesforce/extension-store-finder']: '/path/to/src/folder',
 *     ['@salesforce/extension-checkout']: '/path/to/src/folder',
 * }
 */
export const buildAliases = (extensions: ApplicationExtensionEntry[] = []) => {
    const projectDir = process.cwd()

    const aliases = getExtensionNames(extensions).reduce((acc, extension) => {
        const basePath = path.join(projectDir, 'node_modules', extension, 'src')

        return {
            ...acc,
            [`${extension}`]: basePath
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
export const findFileWithExtension = (basePath: string, extensions: string[] = []) => {
    for (const ext of extensions) {
        const filePath = path.format({...path.parse(basePath), base: undefined, ext})
        if (fse.existsSync(filePath)) {
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
export const getExtensionNames = (extensions: ApplicationExtensionEntry[]) => {
    return (extensions || []).map((extension) => {
        return Array.isArray(extension) ? extension[0] : extension
    })
}

// TODO: jsdoc
export const validateExtensionDependencies = (
    extensions: ApplicationExtensionEntryTuple[]
): {success: boolean; error?: Error} => {
    const hasRequiredDependencies = (extension: ApplicationExtensionEntryTuple) => {
        const dependencies = getDependencies(extension)
        if (dependencies.length === 0) return {success: true, dependencies}

        const previousExtensions = getPreviousExtensions(extension, extensions)
        const success = dependencies.every((dependency) => {
            return Boolean(
                previousExtensions.find((ext) => ext[0] === dependency && (ext[1].enabled ?? true))
            )
        })

        return {success, dependencies}
    }

    const errorMessages = extensions
        .map((extension) => {
            const {success, dependencies} = hasRequiredDependencies(extension)
            return success
                ? undefined
                : `- Extension(s) missing or disabled: ${dependencies.join(', ')}, as required by ${
                      extension[0]
                  }`
        })
        .filter(Boolean)

    const success = errorMessages.length === 0

    return {
        success,
        error: success
            ? undefined
            : new Error(
                  `Missing app extensions that other extensions depend on:\n${errorMessages.join(
                      '\n'
                  )}`
              )
    }
}

const getDependencies = (extension: ApplicationExtensionEntryTuple) => {
    const projectDir = process.cwd()
    const pkg = fse.readJsonSync(resolve(projectDir, 'node_modules', extension[0], 'package.json'))

    return Object.keys(pkg.peerDependencies).filter((name) => name.match(nameRegex) !== null)
}

const getPreviousExtensions = (
    currentExtension: ApplicationExtensionEntryTuple,
    extensions: ApplicationExtensionEntryTuple[]
) => {
    const array = extensions.slice().reverse()
    const index = array.findIndex((extension) => extension[0] === currentExtension[0])
    return array.slice(index + 1)
}
