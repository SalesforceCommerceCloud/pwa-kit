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
        this.overridesDir = options.overridesDir || ''
        this.extends = options.extends || []
        this.projectDir = options.projectDir
        this._allSearchDirs = [this.projectDir + this.overridesDir, ...this.extends]
    }

    toOverrideRelative(path) {
        const override = this.findOverride(path)
        return path?.substring(override?.length + 1)
    }

    findOverride(path) {
        return this._allSearchDirs.find((override) => {
            return path?.indexOf(override) === 0
        })
    }

    apply(resolver) {
        const extendsRegex = makeRegExp(`(${this.extends?.join('|')})`)
        resolver
            .getHook('before-resolve')
            .tapAsync('BeforeAliasPlugin', (request, requestContext, callback) => {
                const splitPath = request?.request?.split(extendsRegex)
                if (
                    splitPath?.length > 2 &&
                    request.path?.includes(this.projectDir + this.overridesDir) &&
                    request.context.issuer.includes(splitPath?.[2]) &&
                    request.request.includes(splitPath?.[2])
                ) {
                    const target = resolver.ensureHook('resolved')
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
