/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import webpack from 'webpack'
import path, {resolve} from 'path'
import fs from 'fs'

/**
 * Allows users to override special SDK components by placing override
 * files in certain magic locations in a project.
 *
 * @param {string} projectDir - absolute path to the project root.
 * @returns {webpack.NormalModuleReplacementPlugin}
 */
export const createModuleReplacementPlugin = (projectDir) => {
    // Helper function to create a RegExp object from a string
    const makeRegExp = (str, sep = path.sep) => {
        // Replace unix paths with windows if needed and build a RegExp
        if (sep === '\\') {
            str = str.replace(/\//g, '\\\\')
        }
        return new RegExp(str)
    }

    // List of overridable paths
    // path: The RegExp that matches the path to the overridable component
    // newPath: The path to the component in the project directory
    const overridables = [
        {
            path: makeRegExp('pwa-kit-react-sdk(/dist)?/ssr/universal/components/_app-config$'),
            newPath: resolve(projectDir, 'app', 'components', '_app-config', 'index')
        },
        {
            path: makeRegExp('pwa-kit-react-sdk(/dist)?/ssr/universal/components/_document$'),
            newPath: resolve(projectDir, 'app', 'components', '_document', 'index')
        },
        {
            path: makeRegExp('pwa-kit-react-sdk(/dist)?/ssr/universal/components/_app$'),
            newPath: resolve(projectDir, 'app', 'components', '_app', 'index')
        },
        {
            path: makeRegExp('pwa-kit-react-sdk(/dist)?/ssr/universal/components/_error$'),
            newPath: resolve(projectDir, 'app', 'components', '_error', 'index')
        },
        {
            path: makeRegExp('pwa-kit-react-sdk(/dist)?/ssr/universal/routes$'),
            newPath: resolve(projectDir, 'app', 'routes')
        }
    ]
    const extensions = ['.ts', '.tsx', '.js', '.jsx']

    // Find the replacement for each overridable path by checking if the file exists
    const replacements = []
    overridables.forEach(({path, newPath}) => {
        extensions.forEach((ext) => {
            const replacement = newPath + ext
            if (fs.existsSync(replacement)) {
                replacements.push({path, newPath: replacement})
            }
        })
    })

    // Return a new `webpack.NormalModuleReplacementPlugin` instance
    return new webpack.NormalModuleReplacementPlugin(/.*/, (resource) => {
        // We only want to replace resources that are requested from the SDK
        if (resource.context.includes('pwa-kit-react-sdk')) {
            // Resolve the full path of the resource
            const resolved = path.resolve(resource.context, resource.request)

            // Find the replacement for the resolved path from the overridables list
            const replacement = replacements.find(({path}) => resolved.match(path))

            if (replacement) {
                // Check if the resource was requested from 'packages/pwa-kit-react-sdk' or 'node_modules/pwa-kit-react-sdk'
                const sdkPaths = [
                    path.join('packages', 'pwa-kit-react-sdk'),
                    path.join('node_modules', 'pwa-kit-react-sdk')
                ]

                const requestedFromSDK = sdkPaths.some((p) => resource.context.includes(p))

                // If the resource was requested from SDK, replace the resource request with the replacement path
                if (requestedFromSDK) {
                    resource.request = replacement.newPath
                }
            }
        }
    })
}
