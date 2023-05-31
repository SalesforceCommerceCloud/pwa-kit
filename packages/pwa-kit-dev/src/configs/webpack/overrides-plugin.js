/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'path'
import glob from 'glob'
import {makeRegExp} from './utils'

/**
 * @class OverridesResolverPlugin
 *
 *  This plugin provides the "Overrides" behavior of the Template Extensibility feature,
 *  allowing third party implementations that depend on an npm module for the base implementation
 *  and then overriding only specific files
 */
class OverridesResolverPlugin {
    /**
     *
     * @param options
     * @param {string} options.overridesDir path to application base
     * @param {string[]} options.overrides paths to overrides
     * @param {string} options.projectDir path to project directory
     */
    constructor(options) {
        this.overridesDir = options.overridesDir || ''
        this.extends = options.extends || []
        this.projectDir = options.projectDir
        this._allSearchDirs = [this.projectDir + this.overridesDir, ...this.extends]
        this.pkg = require(path.resolve(this.projectDir, 'package.json'))
        this.extendsHashMap = new Map()

        // everything except directories
        const globPattern = `${this.pkg?.ccExtensibility?.overridesDir?.replace(/^\//, '')}/**/*.*`
        const overridesFsRead = glob.sync(globPattern)
        const overrideReplace = this.pkg?.ccExtensibility?.overridesDir + path.sep
        overridesFsRead.forEach((item) => {
            const end = item.substring(item.lastIndexOf(path.sep + 'index'))
            const [l, ...rest] = item.split(/(index|\.)/)
            this.extendsHashMap.set(l?.replace(overrideReplace, '').replace(/\/$/, ''), [end, rest])
        })
    }

    /**
     *
     * @param requestPath
     * @param dirs
     */
    findFileFromMap(requestPath, dirs) {
        const fileExt = path.extname(requestPath)
        for (const dir of dirs) {
            let base = path.join(dir, requestPath)
            if (fileExt) {
                const noExtPath = requestPath.replace(fileExt, '')
                if (this.extendsHashMap.has(noExtPath)) {
                    return base
                }
            } else {
                if (this.extendsHashMap.has(requestPath)) {
                    const end = this.extendsHashMap.get(requestPath)[1]
                    const isRequestingIndex = end[0] === 'index'
                    let result = base?.replace(/$\//, '') + end.join('')
                    if (isRequestingIndex) {
                        result = path.join(base, this.extendsHashMap.get(requestPath)[1].join(''))
                    }
                    return result
                }
            }
        }
    }

    toOverrideRelative(_path) {
        const override = this.findOverride(_path)
        return _path.substring(override.length + 1)
    }

    findOverride(_path) {
        return this._allSearchDirs.find((override) => {
            return _path.indexOf(override) === 0
        })
    }

    isFromExtends(request, _path) {
        // in npm namespaces like `@salesforce/<pkg>` we need to ignore the first slash
        const basePkgIndex = request?.startsWith('@') ? 1 : 0
        return (
            this.extends.includes(request?.split(path.sep)?.[basePkgIndex]) &&
            // this is very important, to avoid circular imports, check that the
            // `issuer` (requesting context) isn't the overrides directory
            !_path.match(this.projectDir + this.overridesDir)
        )
    }

    handleHook(requestContext, resolveContext, callback, resolver) {
        let targetFile
        let overrideRelative
        if (this.isFromExtends(requestContext.request, requestContext.path)) {
            overrideRelative = this.toOverrideRelative(requestContext.request)?.replace(
                makeRegExp(`$${path.sep}`),
                ''
            )
            targetFile = this.findFileFromMap(overrideRelative, this._allSearchDirs)
        }
        if (targetFile) {
            const target = resolver.ensureHook('resolved')
            requestContext.path = targetFile
            resolver.doResolve(
                target,
                requestContext,
                `${this.constructor.name} found base override file`,
                resolveContext,
                callback
            )
        } else {
            return callback()
        }
    }

    apply(resolver) {
        resolver
            .getHook('resolve')
            .tapAsync('FeatureResolverPlugin', (requestContext, resolveContext, callback) => {
                this.handleHook(requestContext, resolveContext, callback, resolver)
            })
    }
}

export default OverridesResolverPlugin
