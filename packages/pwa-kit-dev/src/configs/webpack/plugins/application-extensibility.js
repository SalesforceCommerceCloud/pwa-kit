/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import resolve from 'resolve/sync'
// TODO: Think about how to organize all these files. Maybe it's a smart idea to have an "extensibility" folder in this project
// that has all the configs, scripts, utils related to extensibility in it.
import {buildCandidatePaths} from '../../../utils/resolver-utils'

const DEFAULT_FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json']
/**
 * @class AppExtensionResolverPlugin
 *
 *  This plugin provides the "Application Extension" behavior of the Template Extensibility feature,
 *  allowing third party implementations that depend on an npm module for the base implementation
 *  and then overriding only specific files
 */
class AppExtensionResolverPlugin {
    constructor(options) {
        this.projectDir = options.projectDir?.replace(/\\/g, '/')
        this.extensions = options.extensions || []
        this.fileExtensions = options.fileExtensions || DEFAULT_FILE_EXTENSIONS
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
            extensions: this.fileExtensions,
            packageIterator: () =>
                buildCandidatePaths(importPath, sourcePath, {
                    extensions: this.extensions,
                    projectDir: this.projectDir
                }) // NOTE: Should I be used the passed in "request" object?
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
            .tapAsync(
                'ApplicationExtensibilityPlugin',
                (requestContext, resolveContext, callback) => {
                    this.handleHook(requestContext, resolveContext, callback, resolver)
                }
            )
    }
}

export default AppExtensionResolverPlugin
