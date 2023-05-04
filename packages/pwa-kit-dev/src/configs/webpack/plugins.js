/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import webpack from 'webpack'
import path, {resolve} from 'path'
import glob from 'glob'

const projectDir = process.cwd()
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require(resolve(projectDir, 'package.json'))

const OVERRIDES_EXTENSIONS = '.+(js|jsx|ts|tsx)'

const getOverridePath = (relativePath) => {
    const extendPath = pkg?.ccExtensibility?.extends
        ? `node_modules/${pkg?.ccExtensibility?.extends}`
        : ''
    const overridePath = pkg?.ccExtensibility?.overridesDir?.replace(/^\//, '')

    // order matters here, we perform look ups starting in the following order:
    // pkg.ccExtensibility.overridesDir => pkg.ccExtensibility.extends => current projectDir
    if (pkg?.ccExtensibility?.extends && pkg?.ccExtensibility?.overridesDir) {
        const filePath = `${resolve(
            projectDir,
            overridePath,
            ...relativePath
        )}${OVERRIDES_EXTENSIONS}`

        const overrideFile = glob.sync(filePath)

        if (overrideFile?.length) {
            return overrideFile?.[0]
        }
        const extendFile = glob.sync(
            `${resolve(projectDir, extendPath, ...relativePath)}${OVERRIDES_EXTENSIONS}`
        )
        if (extendFile?.length) {
            return extendFile?.[0]
        }
    }
    const generatedProjectOverride = glob.sync(
        `${resolve(projectDir, ...relativePath)}${OVERRIDES_EXTENSIONS}`
    )
    return generatedProjectOverride?.length
        ? generatedProjectOverride?.[0]
        : resolve(
              'node_modules',
              'pwa-kit-react-sdk',
              'ssr',
              'universal',
              ...relativePath.filter((item) => item !== 'app')
          )
}

export const makeRegExp = (str, sep = path.sep) => {
    // Replace unix paths with windows if needed and build a RegExp
    if (sep === '\\') {
        str = str.replace(/\//g, '\\\\')
    }
    return new RegExp(str)
}

/**
 * Allows users to override special SDK components by placing override
 * files in certain magic locations in a project.
 *
 * @returns {webpack.NormalModuleReplacementPlugin}
 */

export const sdkReplacementPlugin = () => {
    const overridables = [
        {
            path: makeRegExp('pwa-kit-react-sdk(/dist)?/ssr/universal/components/_app-config$'),
            newPath: getOverridePath(['app', 'components', '_app-config', 'index'])
        },
        {
            path: makeRegExp('pwa-kit-react-sdk(/dist)?/ssr/universal/components/_document$'),
            newPath: getOverridePath(['app', 'components', '_document', 'index'])
        },
        {
            path: makeRegExp('pwa-kit-react-sdk(/dist)?/ssr/universal/components/_app$'),
            newPath: getOverridePath(['app', 'components', '_app', 'index'])
        },
        {
            path: makeRegExp('pwa-kit-react-sdk(/dist)?/ssr/universal/components/_error$'),
            newPath: getOverridePath(['app', 'components', '_error', 'index'])
        },
        {
            path: makeRegExp('pwa-kit-react-sdk(/dist)?/ssr/universal/routes$'),
            newPath: getOverridePath(['app', 'routes'])
        }
    ]

    const replacements = overridables?.filter?.((item) => item?.newPath)

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
