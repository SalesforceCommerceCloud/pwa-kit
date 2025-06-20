/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import path from 'path'

/**
 * Set the webpack public path for the current page
 * @param {string} publicPath - The public path to set
 */
export function setPublicPath(publicPath) {
    // Set the webpack public path
    // eslint-disable-next-line no-undef
    __webpack_public_path__ = publicPath
}

/**
 * Get the public path for a given file
 * @param {string} filePath - The file path
 * @returns {string} The public path
 */
export function getPublicPath(filePath) {
    return path.join(process.env.PUBLIC_URL || '', filePath)
}
