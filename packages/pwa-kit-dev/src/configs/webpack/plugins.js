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

    const extendPath = pkg?.mobify?.extends ? `node_modules/${pkg?.mobify?.extends}` : ''

    console.log(
        `~LEGACY example 'path'`,
        makeRegExp('pwa-kit-react-sdk(/dist)?/ssr/universal/components/_app-config$')
    )
    console.log(
        `~LEGACY example 'newPath'`,
        resolve(projectDir, 'app', 'components', '_app-config', 'index')
    )

    // const getOverridePath = (path) => {
    //     const arr = []
    //     // order matters here, we perform look ups starting with the first
    //     // override alias, falling back to the default if none are found
    //     if (pkg?.mobify?.extends && pkg?.mobify?.overridesDir) {
    //         const first = resolve(projectDir, pkg?.mobify?.overridesDir, ...path)
    //         if (first) return first
    //         const second = resolve(projectDir, extendPath, ...path)
    //         if (second) return second
    //     }
    //     return resolve(projectDir, extendPath, ...path)
    // }

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
            newPath: resolve(projectDir, extendPath, 'app', 'routes')
        }
    ]

    // @TODO: make this work
    // const overridables = [
    //     {
    //         path: makeRegExp('pwa-kit-react-sdk(/dist)?/ssr/universal/components/_app-config$'),
    //         // newPath: resolve(projectDir, 'app', 'components', '_app-config', 'index'),
    //         newPath: getOverridePath(['app', 'components', '_app-config', 'index'])

    //         // @TODO: finish the pattern above for the below so that fallback
    //         // happens either at the overrides dir or the extends dir, but if
    //         // both are absent, look up in projectDir... new function to generate the arrays?
    //     },
    //     {
    //         path: makeRegExp('pwa-kit-react-sdk(/dist)?/ssr/universal/components/_document$'),
    //         newPath: getOverridePath(['app', 'components', '_document', 'index'])
    //     },
    //     {
    //         path: makeRegExp('pwa-kit-react-sdk(/dist)?/ssr/universal/components/_app$'),
    //         // newPath: resolve(projectDir, 'app', 'components', '_app', 'index'),
    //         newPath: getOverridePath(['app', 'components', '_app', 'index'])
    //     },
    //     {
    //         path: makeRegExp('pwa-kit-react-sdk(/dist)?/ssr/universal/components/_error$'),
    //         // newPath: resolve(projectDir, 'app', 'components', '_error', 'index'),
    //         newPath: getOverridePath(['app', 'components', '_error', 'index'])
    //     },
    //     {
    //         path: makeRegExp('pwa-kit-react-sdk(/dist)?/ssr/universal/routes$'),
    //         // newPath: resolve(projectDir, 'app', 'routes')
    //         newPath: getOverridePath(['app', 'routes'])
    //     }
    // ]

    if (pkg?.mobify?.extends && pkg?.mobify?.overridesDir) {
        console.log('~got to 66')
        console.log(`~projectDir`, projectDir)
        console.log(
            `~resolve(projectDir, pkg?.mobify?.overridesDir, 'app')`,
            resolve(projectDir, pkg?.mobify?.overridesDir, 'app')
        )
        console.log(
            `~resolve(projectDir, extendPath, pkg?.mobify?.overridesDir, 'app')`,
            resolve(projectDir, extendPath, pkg?.mobify?.overridesDir, 'app')
        )
        overridables.push({
            // path: makeRegExp('app$'),
            // @TODO: this should alias by npm package name (`retail-react-app`)
            // but instead looks up `template-retail-react-app`
            path: makeRegExp(`${pkg?.mobify?.extends}/app$`),
            // newPatnpmh: resolve(projectDir, 'app', 'components', '_app-config', 'index'),
            newPath: getOverrideArray(['app'])
        })
    }
    const extensions = ['.ts', '.tsx', '.js', '.jsx']

    const replacements = []
    overridables.forEach(({path, newPath}) => {
        console.log('~path', path)
        console.log('~newPath', newPath)
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

    console.log('~replacements', replacements)

    return new webpack.NormalModuleReplacementPlugin(/.*/, (resource) => {
        if (
            resource?.contextInfo?.issuer?.match(
                /spike\-extendend\-retail\-app\/pwa-kit\/overrides/
            )
        ) {
            console.log('~resource req path via overrides', resource?.contextInfo?.issuer)
        }

        if (resource?.contextInfo?.issuer?.match(/retail\-react\-app\/\-app/)) {
            console.log('~resource req path via retail-react-app', resource?.contextInfo?.issuer)
        }
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
