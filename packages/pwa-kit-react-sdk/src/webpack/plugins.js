/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import webpack from 'webpack'
import path from 'path'

/**
 * Return a NormalModuleReplacementPlugin that is used to override SDK builtins
 * with user code for special overridable components, eg. the Document.
 *
 * @param {Object} options
 * @param {Array} [options.replacements] - An array of objects consisting of a match path
 * and a replacement path.
 * @returns {webpack.NormalModuleReplacementPlugin} a module replacement plugin
 * configured with the passed in file replacements array.
 */
export const createModuleReplacementPlugin = (options = {}) => {
    const replacements = options.replacements || []

    return new webpack.NormalModuleReplacementPlugin(/.*/, (resource) => {
        const resolved = path.resolve(resource.context, resource.request)
        const replacement = replacements.find(({path}) => resolved.includes(path))

        const sdkPaths = [
            path.join('packages', 'pwa-kit-react-sdk'),
            path.join('node_modules', 'pwa-kit-react-sdk'),
        ]

        const requestedFromSDK = sdkPaths.some((p) => resource.context.includes(p))

        if (requestedFromSDK && replacement) {
            resource.request = replacement.newPath
        }
    })
}
