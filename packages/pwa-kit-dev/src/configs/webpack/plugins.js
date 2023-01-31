/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import webpack from 'webpack'
import path, {resolve} from 'path'
import fs from 'fs'
import glob from 'glob'

const projectDir = process.cwd()
const pkg = require(resolve(projectDir, 'package.json'))

const getOverridePath = (path) => {
    const extendPath = pkg?.mobify?.extends ? `node_modules/${pkg?.mobify?.extends}` : ''
    // order matters here, we perform look ups starting in the following order:
    // pkg.mobify.overridesDir => pkg.mobify.extends => current projectDir
    if (pkg?.mobify?.extends && pkg?.mobify?.overridesDir) {
        const overrideFile = glob.sync(
            `${projectDir}${resolve(
                projectDir,
                pkg?.mobify?.overridesDir,
                ...path
            )}.+(js|jsx|ts|tsx)`
        )
        if (overrideFile?.length) {
            return overrideFile?.[0]
        }
        const extendFile = glob.sync(
            `${projectDir}${resolve(projectDir, extendPath, ...path)}.+(js|jsx|ts|tsx)`
        )
        if (extendFile?.length) {
            return extendFile?.[0]
        }
    }
    const generatedProjectOverride = glob.sync(
        `${projectDir}${resolve(projectDir, ...path)}.+(js|jsx|ts|tsx)`
    )

    return generatedProjectOverride?.length ? generatedProjectOverride?.[0] : null
}

const makeRegExp = (str, sep = path.sep) => {
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
 * @param {string} projectDir - absolute path to the project root.
 * @returns {webpack.NormalModuleReplacementPlugin}
 */

export const sdkReplacementPlugin = (projectDir) => {
    const extendPath = pkg?.mobify?.extends ? `node_modules/${pkg?.mobify?.extends}` : ''

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
    console.log('~replacements', replacements)

    return new webpack.NormalModuleReplacementPlugin(/.*/, (resource) => {
        const resolved = path.resolve(resource.context, resource.request)

        const replacement = replacements.find(({path}) => resolved.match(path))

        const sdkPaths = [
            path.join('packages', 'pwa-kit-react-sdk'),
            path.join('node_modules', 'pwa-kit-react-sdk')
        ]

        const requestedFromSDK = sdkPaths.some((p) => resource.context.includes(p))
        if (requestedFromSDK && replacement) {
            console.log('~======= ', replacement.newPath)
            resource.request = replacement.newPath
        }
    })
}

const templateAppPathRegex = makeRegExp(
    `((.*)${pkg?.mobify?.overridesDir}(.*)|(.*)/${pkg?.mobify?.extends}(.*))`
)

export const extendedTemplateReplacementPlugin = (projectDir) => {
    console.log('~templateAppPathRegex', templateAppPathRegex)
    const globPattern = `${pkg?.mobify?.overridesDir?.replace(/\//, '')}/**/*.+(js|jsx|ts|tsx)`
    const overrides = glob.sync(globPattern)
    const overridesMap = [
        ...overrides,
        ...overrides?.map((item) => {
            item = item?.replace?.(pkg?.mobify?.overridesDir?.replace(/^\//, '') + '/', '')
            return item
        })
    ]
    console.log('~overridesMap', overridesMap)
    const overridesRegex = makeRegExp(
        `(${overridesMap?.map((override) => override?.replace?.(/^\//))?.join('|')})`
    )
    console.log('~overridesRegex', overridesRegex)
    return new webpack.NormalModuleReplacementPlugin(overridesRegex, (resource) => {
        const requestedFile = path.resolve(resource.context, resource.request)
        console.log('~requestedFile context:', resource.context)
        console.log('~requestedFile request:', resource.request)
        console.log('~requestedFile full path:', requestedFile)

        // from this context:
        // ~requestedFile context: /Users/bfeister/dev/pwa-kit/packages/spike-extendend-retail-app/pwa-kit/overrides/app/components/icons
        // ~requestedFile request: @babel/runtime/helpers/extends

        // // if (overridables?.filter((override) => resource?.context?.match?.(override))?.length) {
        // //     console.log('~overr')
        // //     return
        // // }
        // const found = overridesMap?.filter((override) => {
        //     return requestedFile?.match?.(override)?.length
        // })
        // TODO: we need to drop `template-` for this to work
        if (
            requestedFile?.match?.(`/template-${pkg?.mobify?.extends}`) ||
            requestedFile?.match?.(`/${pkg?.mobify?.extends}`)
        ) {
            // TODO: rewrite this to the pkg.mobify.extends /node_modules
            // currently yielding this:
            // '/Users/bfeister/dev/pwa-kit/packages/spike-extendend-retail-app/node_modules/retail-react-app/app/retail-react-app/app/pages/product-detail'
            const newContext = projectDir + pkg?.mobify?.overridesDir
            const newRequest = requestedFile?.split?.(`/template-${pkg?.mobify?.extends}/`)?.[1]
            console.log('~!!! OVERRIDING', requestedFile)
            console.log('~!!! newContext', newContext)
            console.log('~!!! newRequest', newRequest)
            if (newContext && newRequest) {
                // resource.context = newContext
                // const newreq = path.resolve(newContext, newRequest, 'index.jsx')
                const newreq =
                    '/Users/bfeister/dev/pwa-kit/packages/template-retail-react-app/app/components/icons/index.jsx'
                console.log('~newreq', newreq)
                resource.request = newreq
                console.log('new full path:', path.resolve(resource.context, resource.request))
            }
            return
        }
    })
}
