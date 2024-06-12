/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import resolve from 'resolve/sync'
import {buildCandidatePathArray} from '../../utils/resolver-utils'

/**
 * @class ExtensionsResolverPlugin
 *
 *  This plugin provides the "Extensions" behavior of the Template Extensibility feature,
 *  allowing third party implementations that depend on an npm module for the base implementation
 *  and then overriding only specific files
 */
class ExtensionsResolverPlugin {
    constructor(options) {
        this.projectDir = options.projectDir?.replace(/\\/g, '/')
    }

    handleHook(request, resolveContext, callback, resolver) {
        // Early exit for none Feature Loader imports
        if (!request.request.startsWith('*')) {
            callback()
            return
        }

        const target = resolver.ensureHook('resolved')
        const importPath = request.request
        const sourcePath = request.context.issuer

        // NOTE: Should we pass in a bogus value as the first argument so we know we are
        // soley replying on the packageIterator?
        const modulePath = resolve(importPath, {
            basedir: this.projectDir,
            extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
            packageIterator: () => buildCandidatePathArray(importPath, sourcePath) // NOTE: Should I be used the passed in "request" object?
        })

        if (modulePath) {
            // Update the requests path with the one resoved from above.
            request.path = modulePath

            resolver.doResolve(
                target,
                request,
                `${this.constructor.name} found base override file`,
                resolveContext,
                callback
            )
        }
    }

    apply(resolver) {
        resolver
            .getHook('resolve')
            // TODO: Finalize the name of this plugin, and the file name too.
            .tapAsync('FeatureResolverPlugin', (requestContext, resolveContext, callback) => {
                this.handleHook(requestContext, resolveContext, callback, resolver)
            })
    }
}

export default ExtensionsResolverPlugin
