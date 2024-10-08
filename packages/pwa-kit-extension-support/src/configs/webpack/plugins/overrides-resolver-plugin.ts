/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import resolve from 'resolve'
import {Resolver} from 'webpack'

import {buildCandidatePaths} from '../../../utils/resolver-utils'

export const DEFAULT_FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json']

interface OverridesResolverPluginOptions {
    projectDir: string
    extensions: ApplicationExtensionEntry[]
    fileExtensions?: string[]
    resolveOptions: any
}

interface ApplicationExtensionConfig extends Record<string, unknown> {
    enabled: boolean
}
type ApplicationExtensionEntryArray = [string, ApplicationExtensionConfig]
type ApplicationExtensionEntry = ApplicationExtensionEntryArray | string


const defaultOptions = {
    projectDir: process.cwd(),
    extensions: [],
    fileExtension: DEFAULT_FILE_EXTENSIONS,
    resolveOptions: {}
}

/**
 * @class OverridesResolverPlugin
 *
 *  This plugin provides the "overrides" behavior of the application extensibility feature. This allows
 *  App Extension developers to define which files are part of their public api thus can be overridden, but
 *  also the module resolution algorithm.
 */
class OverridesResolverPlugin {
    private options: OverridesResolverPluginOptions

    constructor(options: OverridesResolverPluginOptions) {
        this.options = {
            ...defaultOptions, 
            ...options
        }
    }

    handleHook(
        request: any,
        resolveContext: any,
        callback: (err?: Error | null, result?: any) => void,
        resolver: Resolver
    ) {
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
            modulePath = resolve.sync(importPath, {
                basedir: this.options.projectDir,
                extensions: this.options.fileExtensions,
                packageIterator: () =>
                    buildCandidatePaths(importPath, sourcePath, {
                        extensionEntries: this.options.extensions,
                        projectDir: this.options.projectDir
                    }),
                ...this.options.resolveOptions
            })
        } catch (e: any) {
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

    apply(resolver: Resolver) {
        resolver
            .getHook('resolve')
            .tapAsync(
                'OverridesResolverPlugin', 
                (requestContext: any, resolveContext: any, callback: (err?: Error | null, result?: any) => void) => {
                    this.handleHook(requestContext, resolveContext, callback, resolver)
                })
    }
}

export default OverridesResolverPlugin
