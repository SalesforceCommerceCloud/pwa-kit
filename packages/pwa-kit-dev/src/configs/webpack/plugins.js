/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import webpack from 'webpack'
import path, {resolve} from 'path'
import glob from 'glob'
import {makeRegExp} from './utils'

const projectDir = process.cwd()
const OVERRIDES_EXTENSIONS = '.+(js|jsx|ts|tsx)'

const getOverridePath = (relativePath) => {
    // Perform lookups starting in the current projectDir
    const generatedProjectOverride = glob.sync(
        `${resolve(projectDir, ...relativePath)}${OVERRIDES_EXTENSIONS}`
    )

    return generatedProjectOverride?.length
        ? generatedProjectOverride?.[0]
        : resolve(
              'node_modules',
              '@salesforce',
              'pwa-kit-react-sdk',
              'ssr',
              'universal',
              ...relativePath.filter((item) => item !== 'src')
          )
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
            newPath: getOverridePath(['src', 'components', '_app-config', 'index'])
        },
        {
            path: makeRegExp('pwa-kit-react-sdk(/dist)?/ssr/universal/components/_document$'),
            newPath: getOverridePath(['src', 'components', '_document', 'index'])
        },
        {
            path: makeRegExp('pwa-kit-react-sdk(/dist)?/ssr/universal/components/_app$'),
            newPath: getOverridePath(['src', 'components', '_app', 'index'])
        },
        {
            path: makeRegExp('pwa-kit-react-sdk(/dist)?/ssr/universal/components/_error$'),
            newPath: getOverridePath(['src', 'components', '_error', 'index'])
        },
        {
            path: makeRegExp('pwa-kit-react-sdk(/dist)?/ssr/universal/routes$'),
            newPath: getOverridePath(['src', 'routes'])
        }
    ]

    const replacements = overridables?.filter?.((item) => item?.newPath)

    return new webpack.NormalModuleReplacementPlugin(/.*/, (resource) => {
        const resolved = path.resolve(resource.context, resource.request)
        const replacement = replacements.find(({path}) => resolved.match(path))

        const sdkPaths = [
            path.join('packages', 'pwa-kit-react-sdk'),
            path.join('node_modules', '@salesforce', 'pwa-kit-react-sdk')
        ]

        const requestedFromSDK = sdkPaths.some((p) => resource.context.includes(p))
        if (requestedFromSDK && replacement) {
            resource.request = replacement.newPath
        }
    })
}
