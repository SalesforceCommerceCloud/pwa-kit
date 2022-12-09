/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import webpack from 'webpack'
import path, {resolve} from 'path'
import fs from 'fs'

const projectDir = process.cwd()
const pkg = require(resolve(projectDir, 'package.json'))

/**
 * Allows users to override special SDK components by placing override
 * files in certain magic locations in a project.
 *
 * @param {string} projectDir - absolute path to the project root.
 * @returns {webpack.NormalModuleReplacementPlugin}
 */
export const createModuleReplacementPlugin = (projectDir) => {
    const makeRegExp = (str, sep = path.sep) => {
        // Replace unix paths with windows if needed and build a RegExp
        if (sep === '\\') {
            str = str.replace(/\//g, '\\\\')
        }
        return new RegExp(str)
    }

    const extendPath = pkg?.mobify?.extends ? `node_modules/${pkg?.mobify?.extends}` : ''

    // @TODO: this was working, but doesn't account for the full cascade / fallback
    const overridables = [
        {
            path: makeRegExp('pwa-kit-react-sdk(/dist)?/ssr/universal/components/_app-config$'),
            // newPath: resolve(projectDir, 'app', 'components', '_app-config', 'index'),
            newPath: resolve(projectDir, extendPath, 'app', 'components', '_app-config', 'index')
        },
        {
            path: makeRegExp('pwa-kit-react-sdk(/dist)?/ssr/universal/components/_document$'),
            newPath: resolve(projectDir, extendPath, 'app', 'components', '_document', 'index')
        },
        {
            path: makeRegExp('pwa-kit-react-sdk(/dist)?/ssr/universal/components/_app$'),
            // newPath: resolve(projectDir, 'app', 'components', '_app', 'index'),
            newPath: resolve(projectDir, extendPath, 'app', 'components', '_app', 'index')
        },
        {
            path: makeRegExp('pwa-kit-react-sdk(/dist)?/ssr/universal/components/_error$'),
            // newPath: resolve(projectDir, 'app', 'components', '_error', 'index'),
            newPath: resolve(projectDir, extendPath, 'app', 'components', '_error', 'index')
        },
        {
            path: makeRegExp('pwa-kit-react-sdk(/dist)?/ssr/universal/routes$'),
            // newPath: resolve(projectDir, 'app', 'routes')
            // newPath: resolve(projectDir, extendPath, 'app', 'routes')
            newPath: fs.existsSync('/Users/bchypak/Projects/pwa-kit/packages/spike-extendend-retail-app/pwa-kit/overrides/app/routes.jsx') ? 
                resolve(projectDir, 'pwa-kit', 'overrides', 'app', 'routes') : 
                resolve(projectDir, extendPath, 'app', 'routes')
        }
    ]

    if (pkg?.mobify?.extends && pkg?.mobify?.overridesDir) {
        overridables.push({
            // path: makeRegExp('app$'),
            // @TODO: this should alias by npm package name (`retail-react-app`)
            // but instead looks up `template-retail-react-app`
            path: makeRegExp(`${pkg?.mobify?.extends}/app$`),
            newPath: resolve(projectDir, 'app', 'components', '_app-config', 'index')
            // newPath: getOverridePath(['app'])
        })
    }
    const extensions = ['.ts', '.tsx', '.js', '.jsx']

    const replacements = []
    overridables.forEach(({path, newPath}) => {
        extensions.forEach((ext) => {
            const replacement = newPath + ext
            if (fs.existsSync(replacement)) {
                // newPath can be an array for cascading file search, search the array
                if (Array.isArray(newPath)) {
                    let found = false
                    newPath.forEach((_newPath) => {
                        if (fs.existsSync(_newPath) && !found) {
                            found = true
                            newPath = _newPath
                        }
                    })
                }
                replacements.push({path, newPath: replacement})
            }
        })
    })

    return new webpack.NormalModuleReplacementPlugin(/.*/, (resource) => {
        const resolved = path.resolve(resource.context, resource.request)
        
        const replacement = replacements.find(({path}) => resolved.match(path))

        const sdkPaths = [
            path.join('packages', 'pwa-kit-react-sdk'),
            path.join('node_modules', 'pwa-kit-react-sdk')
        ]

        const requestedFromSDK = sdkPaths.some((p) => resource.context.includes(p))

        if (requestedFromSDK && replacement) {
            resource.request = replacement.newPath
        }
    })
}
