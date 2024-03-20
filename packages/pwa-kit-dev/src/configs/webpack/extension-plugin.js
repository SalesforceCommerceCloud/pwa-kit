/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'path'
import glob from 'glob'

/**
 * @class ExtensionsResolverPlugin
 *
 *  This plugin provides the "Extensions" behavior of the Template Extensibility feature,
 *  allowing third party implementations that depend on an npm module for the base implementation
 *  and then overriding only specific files
 */
class ExtensionsResolverPlugin {
    /**
     *
     * @param options
     */
    constructor(options) {
        this.projectDir = options.projectDir?.replace(/\\/g, '/')
        this.pkg = require(path.resolve(this.projectDir, 'package.json'))
    }

    parseModuleName(issuer) {
        const enclosingDir = this.projectDir.split('/').slice(0, -1).join('/')
        return issuer.replace(enclosingDir, '').split('/')[1]
    }

    handleHook(requestContext, resolveContext, callback, resolver) {
        // What do I need to know?
        // 1. Are we importing from the base project?
        // 2. Are we importing from an extension? and which index is it?

        const {extensions} = this.pkg.mobify

        if (requestContext.request.startsWith('_')) {
            const target = resolver.ensureHook('resolve')
            debugger
            const moduleName = this.parseModuleName(requestContext.context.issuer)
            const isBaseProject = moduleName === this.pkg.name
            const isExtension = extensions.includes(moduleName.replace('extension-', ''))
            let targetExtension
            let targetExtensionFQ
            if (isBaseProject) {
                targetExtension = extensions[extensions.length - 1]
            }

            if (isExtension) {
                const index = extensions.indexOf(moduleName.replace('extension-', ''))
                targetExtension = extensions[index - 1]
            }

            targetExtensionFQ = `@salesforce/extension-${targetExtension}`
            
            // Focus on one compiler to get a clear picture of what is happening.
            if (requestContext.context.compiler === 'server') {
                console.log('MODULE NAME: ', moduleName)
                console.log('CONTEXT IS PROJECT: ', isBaseProject)
                console.log('CONTEXT IS EXTENSION: ', isExtension)
                console.log('EXTENSIONS: ', extensions)
                console.log('PATH: ', requestContext.path)
                console.log('REQUEST:', requestContext.request)
                console.log('ISSUER: ', requestContext.context.issuer)
                console.log('CALCULATED TARGET: ', targetExtensionFQ)
                console.log('\n')
            }

            if (!targetExtension) {
                // callback()
                console.log('EXITING BECAUSE WE ARE AT THE END OF THE EXTENSIONS!')
                return
            }
            // Update the request context
            // requestContext.path = requestContext.path.replace(moduleName, `extension-${targetExtension}`)

            // NOTE: We overwrite the path to always be the base project where all the dependencies (extensions) are installed.
            requestContext.path = `/Users/bchypak/Projects/pwa-kit/packages/example-project/app`
            requestContext.context.issuer = requestContext.context.issuer.replace(moduleName, `extension-${targetExtension}`)
            
            if (requestContext.context.compiler === 'server') {
                console.log('NEW PATH: ', requestContext.path)
                console.log('NEW ISSUER: ', requestContext.context.issuer)
                console.log('\n')
            }

            requestContext.request = requestContext.request.replace('_', targetExtensionFQ)
            resolveContext.stack = undefined
            resolver.doResolve(
                target,
                requestContext,
                `${this.constructor.name} found base override file`,
                resolveContext,
                callback
            )
        } else {
            callback()
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

export default ExtensionsResolverPlugin
