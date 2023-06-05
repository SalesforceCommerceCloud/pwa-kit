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
        // always coerce to posix fs paths, as glob sync and es6 imports don't use windows paths
        this.overridesDir = options.overridesDir?.replace(/\\/g, '/') || ''
        this.extends = options.extends || []
        // always coerce to posix fs paths, as glob sync and es6 imports don't use windows paths
        this.projectDir = options.projectDir?.replace(/\\/g, '/')
        this._allSearchDirs = [this.projectDir + this.overridesDir, ...this.extends]
        this.pkg = require(path.resolve(this.projectDir, 'package.json'))
        this.slashIndex = this.extends[0].startsWith('@') ? 1 : 0
        this.extendsHashMap = new Map()

        // everything except directories
        // NOTE that the glob library expects posix so we replace windows file paths here
        const globPattern = `${this.pkg?.ccExtensibility?.overridesDir
            ?.replace(/\\/g, '/')
            ?.replace(/^\//, '')}/**/*.*`
        const overridesFsRead = glob.sync(globPattern)
        const overrideReplace = this.pkg?.ccExtensibility?.overridesDir + '/'
        overridesFsRead.forEach((item) => {
            const end = item.substring(item.lastIndexOf('/index'))
            const [l, ...rest] = item.split(/(index(?!(\.[^.]*\.))|\.(?!([^.]*\.)))/)
            this.extendsHashMap.set(l?.replace(overrideReplace, '').replace(/\/$/, ''), [
                end,
                rest.filter(Boolean)
            ])
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

    toOverrideRelative(filepath) {
        const override = this.findOverride(filepath)
        return filepath.substring(override.length + 1)
    }

    findOverride(filepath) {
        return this._allSearchDirs.find((override) => {
            return filepath.indexOf(override) === 0
        })
    }

    isFromExtends(request, filepath) {
        // in npm namespaces like `@salesforce/<pkg>` we need to ignore the first slash
        var [_pkgName, _path] = request.split('/')
        var packageName = _pkgName
        if (request?.startsWith('@')) {
            packageName = _pkgName + '/' + _path
        }

        return (
            this.extends.includes(packageName) &&
            // this is very important, to avoid circular imports, check that the
            // `issuer` (requesting context) isn't the overrides directory
            !filepath.match(this.projectDir + this.overridesDir)
        )
    }

    handleHook(requestContext, resolveContext, callback, resolver) {
        let targetFile
        let overrideRelative
        if (this.isFromExtends(requestContext.request, requestContext.path)) {
            // @salesforce/retail-react-app/app/etc
            const regex =
                this.slashIndex === 0
                    ? new RegExp(/^(?:[^\/]*\/){1}\s*/)
                    : new RegExp(/^(?:[^\/]*\/){2}\s*/)
            var splitRequest = requestContext.request.replace(regex, '')
            console.log('Split Request: ', splitRequest)
            overrideRelative = this.toOverrideRelative(splitRequest)?.replace(/$\//, '')
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
