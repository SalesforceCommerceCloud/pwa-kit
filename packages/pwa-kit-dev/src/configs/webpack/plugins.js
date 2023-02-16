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
import minimatch from 'minimatch'

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
            // console.log('~======= ', replacement.newPath)
            resource.request = replacement.newPath
        }
    })
}

const templateAppPathRegex = makeRegExp(
    `((.*)${pkg?.mobify?.overridesDir}(.*)|(.*)/${pkg?.mobify?.extends}(.*))`
)

export const allFiles = (projectDir) => {
    return new webpack.NormalModuleReplacementPlugin(/.*/, (resource) => {
        const resolved = path.resolve(resource.context, resource.request)
        if (resolved.match(/template\-retail\-react\-app\/app\/components\/icons/)) {
            console.log('~OOPS!')
            console.log('~ALL FILES ==== resource.context', resource.context)
            console.log('~ALL FILES ==== resource.request', resource.request)
        }
    })
}

export const importFromExtendsPlugin = (projectDir) => {
    // TODO: does any other library use this weird magic character import schema?
    return new webpack.NormalModuleReplacementPlugin(/\^/, (resource) => {
        const resolved = path.resolve(resource.context, resource.request)
        console.log('~===== ^^ Magic', resolved)
        const relativePath = resolved?.split(`^`)?.[1]?.replace(/^\//, '')
        const newPath = path.resolve(projectDir, 'node_modules', relativePath)
        console.log('~^ magic newPath', newPath)
        // NOTE: overriding either of these alone does not work, both must be set
        resource.request = newPath
        resource.createData.resource = newPath
    })
}

export const importFromLocalPlugin = (projectDir) => {
    // TODO: does any other library use this weird magic character import schema?
    return new webpack.NormalModuleReplacementPlugin(/\*/, (resource) => {
        const resolved = path.resolve(resource.context, resource.request)
        console.log('~===== ** Magic', resolved)
        const relativePath = resolved?.split(`*`)?.[1]?.replace(/\*/, '')
        const newPath = path.resolve(
            projectDir,
            pkg?.mobify?.overridesDir?.replace(/^\//, ''),
            relativePath
        )
        console.log('~* magic newPath', newPath)
        // NOTE: overriding either of these alone does not work, both must be set
        resource.request = newPath
        resource.createData.resource = newPath
    })
}

export const extendedTemplateReplacementPlugin = (projectDir) => {
    console.log('~templateAppPathRegex', templateAppPathRegex)
    const globPattern = `${pkg?.mobify?.overridesDir?.replace(/\//, '')}/**/*.+(js|jsx|ts|tsx)`
    // push a copy of overrides array with the extends path as base
    const overrides = glob.sync(globPattern)?.flatMap((item) => {
        return [
            item,
            item?.replace(
                pkg?.mobify?.overridesDir?.replace(/^\//, ''),
                `/${pkg?.mobify?.extends}`
            ),
            // TODO: this needs a better solution, but maybe only a pain for local dev until we publish
            // the retail react app template?
            item?.replace(
                pkg?.mobify?.overridesDir?.replace(/^\//, ''),
                `/template-${pkg?.mobify?.extends}`
            )
        ]
    })
    const _overrides = [...overrides]
    const overridesMap = [
        ...overrides,
        ...overrides.flatMap((item) => {
            const EXTENSIONS = '.+(js|jsx|ts|tsx)$'
            const patterns = [item]
            const extRe = /\.\w+$/
            const hasExt = item?.test?.(extRe)
            const hasSlash = item?.endsWith('/')
            const endsWithIndex = item?.split(extRe)?.[0]?.endsWith?.('index')
            if (!endsWithIndex) {
                return patterns
            }
            if (hasExt || !hasSlash) {
                const noExt = item.replace(extRe, '')
                const noExtExtends =
                    pkg?.mobify?.extends + noExt.replace(pkg?.mobify?.overridesDir, '')
                patterns.push(minimatch.makeRe('**/*' + noExt + EXTENSIONS))
                patterns.push(minimatch.makeRe('**/*' + noExtExtends + EXTENSIONS))
            }
            if (hasSlash) {
                patterns.push(minimatch.makeRe('**/*' + item + 'index' + EXTENSIONS))
                patterns.push(
                    minimatch.makeRe(
                        '**/*' +
                            item.replace(pkg?.mobify?.overridesDir?.replace(/\//, ''), '') +
                            EXTENSIONS
                    )
                )
            }
            return patterns
        })
    ]
    console.log('~overridesMap', overridesMap)
    // TODO: manually push a false positive e.g. chakra-ui/whatever/icons to make sure we don't override that

    // TODO: filter regex already generated above out of this map
    const overridesRegex = makeRegExp(
        `(${overridesMap
            ?.map((override) =>
                override instanceof RegExp && override?.source
                    ? override?.source
                    : override?.replace && override?.startsWith('/')
                    ? override?.replace?.(/^\//, '')
                    : override
            )
            ?.join('|')})`
    )
    console.log('~overridesRegex', overridesRegex)
    // TODO: maybe parse the whole dependency tree and rewrite it with this
    //  https://github.com/dependents/node-dependency-tree

    return new webpack.NormalModuleReplacementPlugin(overridesRegex, (resource) => {
        const resolved = path.resolve(resource.context, resource.request)
        if (resolved?.match?.(/retail\-react\-app\/app\/components\/icons/)) {
            console.log('~======= file path.resolve()', resolved)
            console.log('~requestedFile context:', resource.context)
            console.log('~requestedFile request:', resource.request)

            const depth = pkg?.mobify?.overridesDir?.replace?.(/^\//, '')?.split('/') || []
            const relativePath = resolved?.split?.(/retail\-react\-app/)?.[1]
            const newPath = projectDir + pkg?.mobify?.overridesDir + relativePath
            console.log('~new resource.request!!!', newPath)
            // NOTE: overriding either of these alone does not work, both must be set
            resource.request = newPath
            // TODO: without the file extension, this fails, so we need to pull this from
            // the original detected overridesMap
            resource.createData.resource = newPath + '/index.jsx'
        }
    })
}
