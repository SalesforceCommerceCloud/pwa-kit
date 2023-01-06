/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import webpack from 'webpack'
import path, {resolve} from 'path'
import fs from 'fs'
import fg from 'fast-glob'

const projectDir = process.cwd()
const pkg = require(resolve(projectDir, 'package.json'))

const getOverridePath = (path) => {
    const arr = []
    // order matters here, we perform look ups starting with the first
    // override alias, falling back to the default if none are found
    if (pkg?.mobify?.extends && pkg?.mobify?.overridesDir) {
        const first = resolve(projectDir, pkg?.mobify?.overridesDir, ...path)
        console.log('~first', first)
        if (first) return first
        const second = resolve(projectDir, extendPath, ...path)
        console.log('~second', second)
        if (second) return second
    }
    const ret = resolve(projectDir, extendPath, ...path)
    console.log('~ret', ret)
    return ret
}

/**
 * Allows users to override special SDK components by placing override
 * files in certain magic locations in a project.
 *
 * @param {string} projectDir - absolute path to the project root.
 * @returns {webpack.NormalModuleReplacementPlugin}
 */

const makeRegExp = (str, sep = path.sep) => {
    // Replace unix paths with windows if needed and build a RegExp
    if (sep === '\\') {
        str = str.replace(/\//g, '\\\\')
    }
    return new RegExp(str)
}

export const sdkReplacementPlugin = (projectDir) => {
    const extendPath = pkg?.mobify?.extends ? `node_modules/${pkg?.mobify?.extends}` : ''

    const overridables = [
        {
            path: makeRegExp('pwa-kit-react-sdk(/dist)?/ssr/universal/components/_app-config$'),
            // newPath: resolve(projectDir, 'app', 'components', '_app-config', 'index'),
            // newPath: resolve(projectDir, extendPath, 'app', 'components', '_app-config', 'index')
            // TODO: this needs to be dynamic
            newPath: fs.existsSync(
                `${projectDir}/pwa-kit/overrides/app/components/_app-config/index.jsx`
            )
                ? resolve(
                      projectDir,
                      'pwa-kit',
                      'overrides',
                      'app',
                      'components',
                      '_app-config',
                      'index'
                  )
                : resolve(projectDir, extendPath, 'app', 'components', '_app-config', 'index')
        },
        {
            path: makeRegExp('pwa-kit-react-sdk(/dist)?/ssr/universal/components/_document$'),
            newPath: resolve(projectDir, extendPath, 'app', 'components', '_document', 'index')
        },
        {
            path: makeRegExp('pwa-kit-react-sdk(/dist)?/ssr/universal/components/_app$'),
            // newPath: resolve(projectDir, 'app', 'components', '_app', 'index'),
            // newPath: resolve(projectDir, extendPath, 'app', 'components', '_app', 'index')

            // @TODO: pwa-kit/overrides needs to be dynamic here
            newPath: fs.existsSync(`${projectDir}/pwa-kit/overrides/app/components/_app/index.jsx`)
                ? resolve(projectDir, 'pwa-kit', 'overrides', 'app', 'components', '_app', 'index')
                : resolve(projectDir, extendPath, 'app', 'components', '_app', 'index')
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
            newPath: fs.existsSync(`${projectDir}/pwa-kit/overrides/app/routes.jsx`)
                ? resolve(projectDir, 'pwa-kit', 'overrides', 'app', 'routes')
                : resolve(projectDir, extendPath, 'app', 'routes')
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
        console.log('~overrideable path', path)
        console.log('~overrideable newPath', newPath)
        extensions.forEach((ext) => {
            const replacement = newPath + ext
            if (fs.existsSync(replacement)) {
                // // newPath can be an array for cascading file search, search the array
                // if (Array.isArray(newPath)) {
                //     let found = false
                //     newPath.forEach((_newPath) => {
                //         if (fs.existsSync(_newPath) && !found) {
                //             found = true
                //             newPath = _newPath
                //         }
                //     })
                // }
                replacements.push({path, newPath: replacement})
            }
        })
    })

    console.log('~replacements', replacements)

    // @TODO: this is currently running on every single resource that webpack loads
    // which is deoptimized, the regex `/.*/` currently matches all files and then
    // has an O(n) complexity tax that compares each file to as many file names
    // as are found in the `overrideables` array

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

const templateAppPathRegex = makeRegExp(
    `${projectDir + pkg?.mobify?.overridesDir}|node_modules${pkg?.mobify?.extends}`
)

export const extendedTemplateReplacementPlugin = (projectDir) => {
    const extendPath = `${projectDir}/node_modules/${pkg?.mobify?.extends}`
    const globPattern = `${pkg?.mobify?.overridesDir?.replace(/\//, '')}/**/*.{js,jsx,ts,tsx}`
    console.log('~globPattern', globPattern)
    const overridesMap = fg.sync([
        // `/Users/bfeister/dev/pwa-kit/packages/spike-extendend-retail-app/pwa-kit/overrides/app/components/_app/index.jsx`
        globPattern
    ])
    // TODO: make this agnostic of file extension by replacing `.jsx` in the split here with `.{js,jsx,ts,tsx}`
    // overridesMap = overridesMap.map((item) => item.split('.')?.[0])

    console.log('~overridesMap', overridesMap)

    return new webpack.NormalModuleReplacementPlugin(templateAppPathRegex, (resource) => {
        const requestedFile = path.resolve(resource.context, resource.request)
        console.log('~requestedFile', requestedFile)
        const found = overridesMap?.filter((override) => {
            // console.log('~requestedFile?.match?.(override)', requestedFile?.match?.(override))
            return requestedFile?.match?.(override)?.length
        })
        // console.log('~found', JSON.stringify(found))
        if (!found?.length) {
            // console.log('~!NOT FOUND requestedFile', requestedFile)
            const relativePath = requestedFile?.split?.(pkg?.mobify?.overridesDir)?.[1]
            // console.log('~relativePath', relativePath)
            if (!relativePath) return
            const newPath = extendPath + relativePath
            // console.log('~newPath', newPath)
            resource.request = newPath
            return
        } else {
            console.log('~FOUND requestedFile', requestedFile)
        }
    })
}
