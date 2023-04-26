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
     * @param {string} options.appBase path to application base
     * @param {string[]} options.overrudes paths to overrides
     */
    constructor(options) {
        this.appBase = options.appBase || './app'
        this.appBase = path.resolve(this.appBase)
        // this is /Users/yunakim/cc-pwa/pwa-kit/packages/spike-extendend-retail-app/pwa-kit/overrides/app

        // this is [retail-react-app]
        this.overrides = options.overrides || []

        /* this is [
            '/Users/yunakim/cc-pwa/pwa-kit/packages/spike-extendend-retail-app/pwa-kit/overrides/app',

            '/Users/yunakim/cc-pwa/pwa-kit/packages/spike-extendend-retail-app/node_modules/retail-react-app/app'
            ]
        */

        this._allSearchDirs = this.overrides
        // this._allSearchDirs = [this.appBase].concat(
        //     this.overrides.map((o) => {
        //         return path.join(
        //             path.resolve(`${'node_modules/'}${o}`),
        //             // path.basename(this.appBase)
        //         )
        //     })
        // )

        this.projectDir = options.projectDir
        this.pkg = require(path.resolve(this.projectDir, 'package.json'))
        this.overridesHashMap = new Map()

        const OVERRIDES_EXTENSIONS = '.+(js|jsx|ts|tsx|svg|jpg|jpeg)'
        const globPattern = `${this.pkg?.mobify?.overridesDir?.replace(
            /\//,
            ''
        )}/**/*${OVERRIDES_EXTENSIONS}`
        const overridesFsRead = glob.sync(globPattern)
        console.log('overridesFsRead', overridesFsRead)

        const overrideReplace = this.pkg?.mobify?.overridesDir + '/app/'

        overridesFsRead.forEach((item) => {
            const end = item.substring(item.lastIndexOf('/index'))
            const [l, ...rest] = item.split(/(index|\.)/)
            this.overridesHashMap.set(
                l.replace(/\/$/, '')?.replace(overrideReplace.replace(/\//, ''), ''),
                [end, rest]
            )
        })
        console.log('this.overridesHashMap', this.overridesHashMap)
    }

    isRelevant(p) {
        return [this.appBase].concat(this.overrides).some((_configPath) => {
            _configPath.indexOf(p)
        })
    }

    isBaseFile(p) {
        return p.indexOf(this.appBase) === 0
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
                if (this.overridesHashMap.has(noExtPath)) {
                    return base
                }
            } else {
                if (this.overridesHashMap.has(requestPath)) {
                    const end = this.overridesHashMap.get(requestPath)[1]
                    if (end[0] === 'index') {
                        base = path.join(base, this.overridesHashMap.get(requestPath)[1].join(''))
                        return base
                    } else {
                        base = base + end.join('')
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

    isExtendsBase(p) {
        console.log('~isExtendsBase()', p)
        console.log('~this.overrides', this.overrides)
        // return p && p.indexOf(this.appBase) === 0
        return p && this.overrides.includes(p)
    }

    apply(resolver) {
        resolver.getHook('resolve').tapAsync(
            'FeatureResolverPlugin',
            function (requestContext, resolveContext, callback) {
                // exact match ^ means import the "parent" (superModule) of the requesting module
                return callback()

                if (requestContext.request === '^') {
                    const overrideRelative = this.toOverrideRelative(requestContext.context.issuer)
                    const override = this.findOverride(requestContext.context.issuer)

                    const searchOverrides = this._allSearchDirs.slice(
                        this._allSearchDirs.indexOf(override) + 1
                    )
                    let targetFile = this.findFileMap(
                        overrideRelative,
                        searchOverrides,
                        resolver.options.extensions
                    )
                    if (!targetFile) {
                        targetFile = path.resolve(__dirname, 'null.js')
                    }
                    const target = resolver.ensureHook('resolved')
                    requestContext.path = targetFile
                    resolver.doResolve(
                        target,
                        requestContext,
                        `${this.constructor.name} found parent`,
                        resolveContext,
                        callback
                    )
                } else if (requestContext.request.startsWith('^/')) {
                    // let aliases find the file
                    return callback()

                    //this block catches requests coming from the overrides directory

                    // ORIGINAL WAY
                    // import that included the `^` directive:
                    // 1. check to see if it starts with a `.`

                    // NEW WAY
                    // import that includes the `retail-react-app` (`mobify.extends`) string:
                    // 1. check to see if it exists in `overridesDir`
                    // 2. if not, load from `retail-react-app` (`mobify.extends`)
                } else if (this.isExtendsBase(requestContext.path)) {
                    // app base request relative
                    // ex - /Users/yunakim/cc-pwa/pwa-kit/packages/spike-extendend-retail-app/pwa-kit/overrides/app/components/header
                    var resolvedPath = path.resolve(requestContext.path, requestContext.request)

                    if (this.isExtendsBase(resolvedPath)) {
                        // ex - components/header
                        let overrideRelative = this.toOverrideRelative(resolvedPath)

                        try {
                            const targetFile = this.findFileMap(
                                overrideRelative,
                                this._allSearchDirs,
                                resolver.options.extensions
                            )

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
                        return callback()
                    }

                    // this block catches requests coming from the underlying template
                } else if (requestContext.request.startsWith('.')) {
                    // if request looks like '../../components/product-detail/above-fold'
                    // and the path looks like '/Users/yunakim/cc-pwa/pwa-kit/packages/template-retail-react-app/app/pages/product-detail'
                    const overrideRelative = requestContext.request.replaceAll('../', '')
                    try {
                        const targetFile = this.findFileMap(
                            overrideRelative,
                            this._allSearchDirs,
                            resolver.options.extensions
                        )

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
                } else if (requestContext.request && this.isExtendsBase(requestContext.request)) {
                    // external dependency requiring app code (app-config, app, ssr, etc)
                    // TODO: DRY this is nearly the same as the above condition
                    let overrideRelative = this.toOverrideRelative(requestContext.request)
                    try {
                        const targetFile = this.findFileMap(
                            overrideRelative,
                            this._allSearchDirs,
                            resolver.options.extensions
                        )
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
