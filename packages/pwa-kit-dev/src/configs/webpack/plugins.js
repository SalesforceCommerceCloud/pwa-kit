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

console.log('~testing!!!')

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
    console.log('~pkg', pkg)
    console.log('~pkg?.mobify', pkg?.mobify)
    console.log('~pkg?.mobify?.extends', pkg?.mobify?.extends)

    const extendPath = pkg?.mobify?.extends ? `node_modules/${pkg?.mobify?.extends}` : undefined

    const overridables = [
        {
            path: makeRegExp('app$'),
            // newPath: resolve(projectDir, 'app', 'components', '_app-config', 'index'),
            newPath: resolve(
                'node_modules',
                extendPath,
                projectDir + '/pwa-kit/overrides/app'
            )
        },
        {
            path: makeRegExp('pwa-kit-react-sdk(/dist)?/ssr/universal/components/_app-config$'),
            // newPath: resolve(projectDir, 'app', 'components', '_app-config', 'index'),
            newPath: resolve(
                'node_modules',
                extendPath,
                'app',
                'components',
                '_app-config',
                'index'
            )
        },
        {
            path: makeRegExp('pwa-kit-react-sdk(/dist)?/ssr/universal/components/_document$'),
            newPath: resolve(projectDir, 'app', 'components', '_document', 'index')
        },
        {
            path: makeRegExp('pwa-kit-react-sdk(/dist)?/ssr/universal/components/_app$'),
            // newPath: resolve(projectDir, 'app', 'components', '_app', 'index'),
            newPath: resolve('node_modules', extendPath, 'app', 'components', '_app', 'index')
        },
        {
            path: makeRegExp('pwa-kit-react-sdk(/dist)?/ssr/universal/components/_error$'),
            // newPath: resolve(projectDir, 'app', 'components', '_error', 'index'),
            newPath: resolve('node_modules', extendPath, 'app', 'components', '_error', 'index')
        },
        {
            path: makeRegExp('pwa-kit-react-sdk(/dist)?/ssr/universal/routes$'),
            // newPath: resolve(projectDir, 'app', 'routes')
            newPath: resolve('node_modules', extendPath, 'app', 'routes')
        }
    ]
    const extensions = ['.ts', '.tsx', '.js', '.jsx']

    const replacements = []
    overridables.forEach(({path, newPath}) => {
        console.log('~path', path, '~newPath', newPath)
        extensions.forEach((ext) => {
            const replacement = newPath + ext
            if (fs.existsSync(replacement)) {
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
