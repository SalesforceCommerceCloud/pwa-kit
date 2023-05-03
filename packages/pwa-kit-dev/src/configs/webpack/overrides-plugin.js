/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'path'
import glob from 'glob'

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

        const OVERRIDES_EXTENSIONS = '.+(js|jsx|ts|tsx|svg|jpg|jpeg)'
        const globPattern = `${this.pkg?.ccExtensibility?.overridesDir?.replace(
            /\//,
            ''
        )}/**/*${OVERRIDES_EXTENSIONS}`
        const overridesFsRead = glob.sync(globPattern)

        const overrideReplace = this.pkg?.ccExtensibility?.overridesDir + '/'

        overridesFsRead.forEach((item) => {
            const end = item.substring(item.lastIndexOf('/index'))
            const [l, ...rest] = item.split(/(index|\.)/)
            this.extendsHashMap.set(
                l.replace(/\/$/, '')?.replace(overrideReplace.replace(/\//, ''), ''),
                [end, rest]
            )
        })
    }

    /**
     *
     * @param requestPath
     * @param dirs
     */
    findFileMap(requestPath, dirs) {
        var fileExt = path.extname(requestPath)
        for (var dir of dirs) {
            var base = path.join(dir, requestPath)
            if (fileExt) {
                const noExtPath = requestPath.replace(fileExt, '')
                if (this.extendsHashMap.has(noExtPath)) {
                    return base
                }
            } else {
                if (this.extendsHashMap.has(requestPath)) {
                    const end = this.extendsHashMap.get(requestPath)[1]

                    if (end[0] === 'index') {
                        base = path.join(base, this.extendsHashMap.get(requestPath)[1].join(''))
                        return base
                    } else {
                        base = base?.replace(/$\//, '') + end.join('')
                        return base
                    }
                }
            }
        }
    }

    toOverrideRelative(path) {
        var override = this.findOverride(path)
        return path.substring(override.length + 1)
    }

    findOverride(path) {
        return this._allSearchDirs.find((override) => {
            return path.indexOf(override) === 0
        })
    }

    isFromExtends(request, path) {
        let basePkgIndex = 0
        // in npm namespaces like `@salesforce/<pkg>` we need to ignore the first slash
        if (request?.startsWith('@')) {
            basePkgIndex = 1
        }
        return (
            this.extends.includes(request?.split('/')?.[basePkgIndex]) &&
            // this is very important, to avoid circular imports, check that the
            // `issuer` (requesting context) isn't the overrides directory
            !path.match(this.projectDir + this.overridesDir)
        )
    }

    apply(resolver) {
        resolver.getHook('resolve').tapAsync(
            'FeatureResolverPlugin',
            function (requestContext, resolveContext, callback) {
                let targetFile
                let overrideRelative
                if (this.isFromExtends(requestContext.request, requestContext.path)) {
                    overrideRelative = this.toOverrideRelative(requestContext.request)?.replace(
                        /$\//,
                        ''
                    )
                    targetFile = this.findFileMap(overrideRelative, this._allSearchDirs)
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
            }.bind(this)
        )
    }
}

export default OverridesResolverPlugin
