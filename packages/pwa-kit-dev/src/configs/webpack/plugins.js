/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import webpack from 'webpack'
import path, {resolve} from 'path'
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
            )}.+(js|jsx|ts|tsx|svg|jpg|jpeg)`
        )
        if (overrideFile?.length) {
            return overrideFile?.[0]
        }
        const extendFile = glob.sync(
            `${projectDir}${resolve(projectDir, extendPath, ...path)}.+(js|jsx|ts|tsx|svg|jpg|jpeg)`
        )
        if (extendFile?.length) {
            return extendFile?.[0]
        }
    }
    const generatedProjectOverride = glob.sync(
        `${projectDir}${resolve(projectDir, ...path)}.+(js|jsx|ts|tsx|svg|jpg|jpeg)`
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

export const allFiles = (projectDir) => {
    return new webpack.NormalModuleReplacementPlugin(/.*/, (resource) => {
        const resolved = path.resolve(resource.context, resource.request)
    })
}

export const extendedTemplateReplacementPlugin = (projectDir) => {
    const globPattern = `${pkg?.mobify?.overridesDir?.replace(
        /\//,
        ''
    )}/**/*.+(js|jsx|ts|tsx|svg|jpg|jpeg)`
    // push a copy of overrides array with the extends path as base
    const _og_overrides = glob.sync(globPattern)
    const overrides = _og_overrides?.flatMap((item) => {
        return [
            item,
            item?.replace(pkg?.mobify?.overridesDir?.replace(/^\//, ''), `${pkg?.mobify?.extends}`)
        ]
    })
    const _overrides = [...overrides]
    const _overridesHashMap = new Map()
    _og_overrides.forEach((item) => {
        const end = item.substr(item.lastIndexOf('/index'))
        const [l, ...rest] = item?.split(/(index|\.)/)
        _overridesHashMap.set(
            l.replace(/\/$/, '')?.replace(pkg?.mobify?.overridesDir?.replace(/\//, ''), ''),
            [end, rest]
        )
    })


    const overridesMap = [
        ...overrides,
        ...overrides.flatMap((item) => {
            console.log('each item', item)
            const patterns = []
            const EXTENSIONS = '.+(js|jsx|ts|tsx|svg|jpg|jpeg)'

            // matches '.jsx', '.js', '.tsx', '.ts'
            const extRe = /\.\w+$/

            // returns true if there is a match for the above
            const hasExt = item?.test?.(extRe)

            // returns true if the string ends with a '/'
            const hasSlash = item?.endsWith('/')

            if (hasExt || !hasSlash) {
                const noExt = item.replace(extRe, '')
                const pathNoFile = item
                    .split(/\.\w+$/)[0]
                    .split('/')
                    .slice(0, -1)
                    .join('/')

                if (item === 'pwa-kit/overrides/app/components/icons/index.jsx') {
                    console.log('no ext', noExt)
                    console.log('path with no file', pathNoFile)
                    console.log('----++++++', minimatch.makeRe('**/*' + noExt + EXTENSIONS))
                }
                patterns.push(minimatch.makeRe('**/*' + noExt + EXTENSIONS))
                patterns.push(minimatch.makeRe('**/*' + noExt))
                patterns.push(minimatch.makeRe('**/*' + pathNoFile))
            }

            return patterns
        })
    ]
    console.log('~~~~overridesMAP', overridesMap)
    // TODO: manually push a false positive e.g. chakra-ui/whatever/icons to make sure we don't override that

    // TODO: filter regex already generated above out of this map
    // this includes the "**/*" magic path so will match "blah-blah/blah/pwa-kit/..."
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
    console.log('++++++overridesregex++++++', overridesRegex)

    // TODO: maybe parse the whole dependency tree and rewrite it with this
    //  https://github.com/dependents/node-dependency-tree

    return new webpack.NormalModuleReplacementPlugin(/.*/, (resource) => {
        const resolved = path.resolve(resource.context, resource.request)

        if (resource.request.match(/\^/)) {
            const relativePath = resolved?.split(`^`)?.[1]?.replace(/^\//, '')
            const newPath = path.resolve(projectDir, 'node_modules', relativePath)

            // NOTE: overriding either of these alone does not work, both must be set
            resource.request = newPath
            resource.createData.resource = newPath
            return
        }

        // for now, let's early return any file that doesn't match what's expected from overrides
        // if there IS a match -> this is false and skips
        // if there IS NOT a match -> this is true and prints NO MATCH
        if (!resolved?.match(overridesRegex)?.length) {
            return
        }

        if (
            // TODO: this array appears to always contain object where the `dependency[x].request
            // holds reference to the original request, which is what we want to introspect on
            // whether magic characters like `^` were used
            resource?.dependencies?.[0]?.request?.match?.(/\^/)?.[0]
        ) {
            return
        }
        const matchRegex = makeRegExp(pkg?.mobify?.extends)

        if (
            resolved?.match?.(matchRegex) &&
            _overrides?.filter((override) => override?.match(/\.(?=[^\/]+$)/))?.length
        ) {
            const depth = pkg?.mobify?.overridesDir?.replace?.(/^\//, '')?.split('/') || []
            const relativePath = resolved?.split?.(matchRegex)?.[1]
            const newPath = projectDir + pkg?.mobify?.overridesDir + relativePath

            // NOTE: overriding either of these alone does not work, both must be set
            resource.request = newPath

        }
    })
}
