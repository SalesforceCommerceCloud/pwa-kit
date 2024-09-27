/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import resolve from 'resolve/sync'
import {buildCandidatePaths} from '../../../utils/resolver-utils'

export const DEFAULT_FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json']

/**
 * @class OverridesResolverPlugin
 *
 *  This plugin provides the "overrides" behavior of the application extensibility feature. This allows
 *  App Extension developers to define which files are part of their public api thus can be overridden, but
 *  also the module resolution algorithm.
 */
class OverridesResolverPlugin {
    constructor(options) {
        this.projectDir = options.projectDir?.replace(/\\/g, '/') || process.cwd()
        this.extensions = options.extensions || []
        this.fileExtensions = options.fileExtensions || DEFAULT_FILE_EXTENSIONS
        this.resolveOptions = options.resolveOptions || {}
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

        // Resolve the import with the provided packageIterator.
        let modulePath

        try {
            modulePath = resolve(importPath, {
                basedir: this.projectDir,
                extensions: this.fileExtensions,
                packageIterator: () =>
                    buildCandidatePaths(importPath, sourcePath, {
                        extensions: this.extensions,
                        projectDir: this.projectDir
                    }),
                ...this.resolveOptions
            })
        } catch (e) {
            return callback(e)
        }

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

    apply(resolver) {
        resolver
            .getHook('resolve')
            .tapAsync('OverridesResolverPlugin', (requestContext, resolveContext, callback) => {
                this.handleHook(requestContext, resolveContext, callback, resolver)
            })
    }
}

export default OverridesResolverPlugin
