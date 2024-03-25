/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'path'

function forEachBail(array, iterator, callback) {
	if (array.length === 0) {
        return callback()
    }

    let i = 0
	const next = () => {
		/** @type {boolean|undefined} */
		let loop = undefined

		iterator(
			array[i++],
			(err, result) => {
                // NOTE: This logic needs to be cleaned up, but for now I will not touch it!
                if (err || !result) {
                    // do nothing?
                } else if (i >= array.length) {
                    loop = true;
                    return callback(err, result)
                } else {
                    loop = true;
                    return callback(err, result);
                }
                if (loop === false) while (next());
                
                loop = true;
			},
			i
		)

        if (!loop) {
            loop = false
        }

		return loop
	}
	while (next());
}

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

    getExtensions(request) {
        const {extensions} = this.pkg.mobify
        const moduleName = this.parseModuleName(request.context.issuer)
        const isBaseProject = moduleName === this.pkg.name
        const isExtension = extensions.includes(moduleName.replace('extension-', ''))
        let packages

        const isSelfReference = request.context.issuer.includes(request.request.substr(1))

        // DEV NOTE: This is going to need some cleanup. It's mainly working on trail and error.
        if (isSelfReference && !isBaseProject) {
            const index = extensions.indexOf(moduleName.replace('extension-', ''))
            packages = extensions.slice(0, index)
        } else {
            packages = extensions
        }
        // console.log('GET EXTENSIONS: ', packages)
        // console.log('ISSUER: ', request.context.issuer)
        // console.log('REQUEST: ', request.request)

        return [...packages].reverse()
    }

    handleHook(request, resolveContext, callback, resolver) {

        // Early exit for none Feature Loader imports
        if (!request.request.startsWith('_')) {
            callback()
            return
        }

        const target = resolver.ensureHook('resolve')
        const packages = this.getExtensions(request)
        const moduleName = this.parseModuleName(request.context.issuer)

        // If we aren't importing the routes file, add the `.` to the packages so we include the 
        // base project as the highest priority override location.
        const isRouter = request.request.includes('/app/routes')
        if (!isRouter) {
            packages.unshift('.')
        }

        if (request.context.compiler === 'server' && request.request.includes('home')) {
            console.log('PACKAGES: ', packages)
        }
        
        forEachBail(
            packages,
            (feature, innerCallback) => {
                if (!feature) {
                    throw new Error('"feature" not defined.')
                }

                if (request.context.compiler === 'server' && request.request.includes('home')) {
                    console.log('OLD REQUEST: ')
                    console.log(request)
                }

                // approach taken from: https://github.com/webpack/enhanced-resolve/blob/v4.0.0/lib/CloneBasenamePlugin.js
                // DEVELOPER NOTE: This is were we probably want to distringuish the types of extensions, there could be modules,
                // file references, tupals, etc.
                const isLocalDevExtension = feature === '.'
                const featureModule = isLocalDevExtension ? feature : `@salesforce/extension-${feature}`
                const req = {
                    ...request,
                    context: {
                        ...request.context,
                        issuer: isLocalDevExtension ? request.context.issuer : request.context.issuer.replace(moduleName, `extension-${feature}`)
                    },
                    path: this.projectDir + '/app',
                    request: request.request.replace('_', featureModule + `${request.request.includes('home') ? '/app' : ''}`),
                    stack: undefined
                }
                
                if (request.context.compiler === 'server' && request.request.includes('home')) {
                    console.log('NEW REQUEST: ')
                    console.log(req)
                }
                
                resolver.doResolve(
                    target, 
                    req, 
                    `${this.constructor.name} found base override file`, 
                    resolveContext, 
                    innerCallback
                )
                
            },
            callback
        )

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
