/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'path'
import {makeRegExp} from './plugins'

/**
 * @class ExtendsCircularImportsPlugin
 *
 *  This plugin adds "guardrails" to the "Overrides" behavior of the Template Extensibility feature,
 *  preventing the dynamic aliases in webpack/config.js from allowing a file to attempt to import itself
 */
class ExtendsCircularImportsPlugin {
    /**
     *
     * @param options
     * @param {string} options.overridesDir path to application base
     * @param {string[]} options.overrides paths to overrides
     * @param {string} options.projectDir path to project directory
     */
    constructor(options) {
        this.overridesDir = options.overridesDir || '' // /pwa-kit-overrides (my-extended-retail-app/pwa-kit-overrides)
        this.extends = options.extends || [] // retail-react-app
        this.projectDir = options.projectDir // project root (my-extended-retail-app)
        this._allSearchDirs = [this.projectDir + this.overridesDir, ...this.extends] // list of all dirs to search. searches overridesDir then project being extended
    }

    /*
    When we import './style.css' within app.js, the resource is /path/to/style.css and the issuer is /path/to/app.js.
    */
    // path = request.context.issuer (absolute path to directory)
    // given the issuer, search current project then template project
    toOverrideRelative(path) {
        const override = this.findOverride(path)
        return path?.substring(override?.length + 1)
    }

    // finds the directory we should be reading from
    // callback: iterate over allSearchDirs
    // for each override, check if the override and the path index both equal 0
    // aka both strings start with the override
    // ie. if issuer is my-extended-retail-app/pwa-kit-overrides/app/constants
    // if override is my-extended-retail-app/pwa-kit-overrides, return true
    findOverride(path) {
        return this._allSearchDirs.find((override) => {
            return path?.indexOf(override) === 0
        })
    }

    apply(resolver) {
        /// retail-react-app
        const extendsRegex = makeRegExp(`(${this.extends?.join('|')})`)

        resolver
            .getHook('before-resolve')
            .tapAsync('BeforeAliasPlugin', (request, requestContext, callback) => {
                // split the import string
                // ie. retail-react-app/app/constants is split into [/app/constants]
                const splitPath = request?.request?.split(extendsRegex)

                // if the import is retail-react-app/app/something, splitPath will have >2 entries
                // if path includes my-extended-retail-app/pwa-kit-overrides
                // if issuer (absolute path to the importer) includes directory name (ie. /app or /constants)

                // aka. if we're in /app/components/_app/index.jsx inside the my-extended-retail-app/pwa-kit-override
                // and the thing we're importing has length 2
                if (
                    splitPath?.length > 2 &&
                    request.path?.includes(this.projectDir + this.overridesDir) &&
                    request.context.issuer.includes(splitPath?.[2]) &&
                    request.request.includes(splitPath?.[2])
                ) {
                    // mark hook as resolved
                    const target = resolver.ensureHook('resolved')

                    // do the override
                    // finds the override path for retail-react-app/app/
                    // given the issuer, search current project then template project
                    var relativeOverride = this.toOverrideRelative(request.context.issuer)

                    requestContext.path = path.resolve(
                        this.projectDir,
                        'node_modules',
                        splitPath?.[1],
                        relativeOverride
                    )
                    return resolver.doResolve(
                        target,
                        requestContext,
                        `BeforeAliasPlugin found base override file`,
                        requestContext,
                        callback
                    )
                } else {
                    return callback()
                }
            })
    }
}

export default ExtendsCircularImportsPlugin
