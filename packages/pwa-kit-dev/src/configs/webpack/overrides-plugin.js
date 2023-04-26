/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'path'
import glob from 'glob'

/**
 * Implements a b2c-cartridge-like override resolve for webpack
 *
 * @example
 * // import from the *next* in the override-chain (i.e. similar to module.superModule)
 * import Something from '*'
 *
 * @example
 * // import from the override chain (not the forward slash is escaped here due to being in a comment)
 * import Something, {SomethingElse} from '*\/components/something'
 *
 * @example
 * // (ONLY IN BASE) paths required relative to the appBase will first be searched through the overrides
 * import Something from '../../components/something'
 *
 * @class OverridesResolverPlugin
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
        this.overridesFullPath = path.resolve(this.overridesDir)
        this.extends = options.extends || []
        this.projectDir = options.projectDir
        this._allSearchDirs = [this.projectDir + this.overridesDir, ...this.extends]
        this.projectDir = options.projectDir
        this.pkg = require(path.resolve(this.projectDir, 'package.json'))
        this.extendsHashMap = new Map()

        const OVERRIDES_EXTENSIONS = '.+(js|jsx|ts|tsx|svg|jpg|jpeg)'
        const globPattern = `${this.pkg?.mobify?.overridesDir?.replace(
            /\//,
            ''
        )}/**/*${OVERRIDES_EXTENSIONS}`
        const overridesFsRead = glob.sync(globPattern)
        console.log('overridesFsRead', overridesFsRead)

        const overrideReplace = this.pkg?.mobify?.overridesDir + '/'

        overridesFsRead.forEach((item) => {
            const end = item.substring(item.lastIndexOf('/index'))
            const [l, ...rest] = item.split(/(index|\.)/)
            this.extendsHashMap.set(
                l.replace(/\/$/, '')?.replace(overrideReplace.replace(/\//, ''), ''),
                [end, rest]
            )
        })
        console.log('this.extendsHashMap', this.extendsHashMap)
    }

    isRelevant(p) {
        return [this.overridesDir].concat(this.extends).some((_configPath) => {
            _configPath.indexOf(p)
        })
    }

    isBaseFile(p) {
        return p.indexOf(this.overridesDir) === 0
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

    toOverrideRelative(p) {
        var override = this.findOverride(p)
        return p.substring(override.length + 1)
    }

    findOverride(p) {
        return this._allSearchDirs.find((override) => {
            return p.indexOf(override) === 0
        })
    }

    isFromExtends(request, path) {
        return (
            request &&
            this.extends.includes(request?.split('/')?.[0]) &&
            // this is very important, to avoid circular imports, check that the
            // `issuer` (requesting context) isn't the overrides directory
            !path.match(this.projectDir + this.overridesDir)
        )
    }

    apply(resolver) {
        resolver.getHook('resolve').tapAsync(
            'FeatureResolverPlugin',
            function (requestContext, resolveContext, callback) {
                // exact match ^ means import the "parent" (superModule) of the requesting module
                if (
                    requestContext.request &&
                    this.isFromExtends(requestContext.request, requestContext.path)
                ) {
                    // external dependency requiring app code (app-config, app, ssr, etc)
                    // TODO: DRY this is nearly the same as the above condition
                    let overrideRelative = this.toOverrideRelative(requestContext.request)?.replace(
                        /$\//,
                        ''
                    )
                    try {
                        const targetFile = this.findFileMap(overrideRelative, this._allSearchDirs)
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
                    } catch (e) {
                        return callback()
                    }
                } else {
                    callback()
                }
            }.bind(this)
        )
    }
}

export default OverridesResolverPlugin
