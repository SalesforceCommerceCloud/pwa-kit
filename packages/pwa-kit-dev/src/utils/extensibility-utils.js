/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import path from 'path'
import fs from 'fs-extra'

const REACT_EXTENSIBILITY_FILE = 'setup-app'
// const EXPRESS_EXTENSIBILITY_FILE = 'setup-server'

const SUPPORTED_FILE_TYPES = ['.ts', '.js']

export const buildAliases = (extensions = []) => {
    const projectDir = process.cwd()

    const aliases = extensions.reduce((acc, extension) => {
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
 * Returns the first file path found with a given set of extensions.
 *
 * @param {string} basePath - The base path of the file without extension.
 * @param {string[]} extensions - Array of possible file extensions.
 * @returns {string|null} - The path of the first found file, or null if not found.
 *
 * @example
 * const basePath = '/path/to/your/file';
 * const extensions = ['.js', '.json', '.txt'];
 *
 * const filePath = findFileWithExtension(basePath, extensions);
 * if (filePath) {
 *     console.log(`Found file: ${filePath}`);
 * } else {
 *     console.log('File not found.');
 * }
 */
const findFileWithExtension = (basePath, extensions) => {
    for (const ext of extensions) {
        const filePath = path.format({...path.parse(basePath), base: undefined, ext})
        if (fs.existsSync(filePath)) {
            return filePath
        }
    }
    return null
}
