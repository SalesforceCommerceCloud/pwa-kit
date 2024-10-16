/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import dedent from 'dedent'
import {LoaderContext} from 'webpack'
import {PackageJson} from 'type-fest'

import {kebabToUpperCamelCase} from '../../../shared/utils'
import {nameRegex} from '../../../shared/utils/extensibility-utils'

const APP_EXTENSION_CLIENT_ENTRY = 'setup-app'
const APP_EXTENSION_SERVER_ENTRY = 'setup-server'
const APP_EXTENSION_PREFIX = 'extension-' // aligns with what's in `nameRegex`



// TODO: Move these to a better location.
interface ExtensionsLoaderOptions {
    pkg: PackageJson,
    getConfig: () => any,
    target: 'node' | 'web'
}

interface ExtensionsLoaderContext extends LoaderContext<ExtensionsLoaderOptions> {
    // You can add any additional properties if needed
}

/**
 * The `extensions-loader` as a mechanism to get all configured extensions for a given pwa-kit
 * application. We use this loader as a simple way to determine what extension code in required in
 * the application bundle, without this we would have to rely on other more complex ways of
 * including application extensions in the bundle, like custom webpack entry points for extension.
 *
 * With this solution we can rely on the fact that all installed application extensions are referenced
 * in code and will be in the bundle.
 *
 * The named export `getExtensions` will only return the application extensions required/configured by
 * the current PWA-Kit application.
 *
 * @returns {string} The string representation of a module exporting all the named application extension modules.
 */
module.exports = function (this: ExtensionsLoaderContext, that: any) {
    // console.log('this|that: ', this, that)
    const {pkg, getConfig, target = 'web'} = that?.getOptions?.() || this.getOptions() || {}
    const {devDependencies} = pkg

    // TODO: clean this up.. looks like this is a bad variable name for the type that it represents.
    const extensions = Object.keys(devDependencies || {})
        .map((packageName) => packageName.match(nameRegex))
        .filter(Boolean)

    // Ensure that only valid extension names are loaded.
    const extensionDetails = extensions.map((match) => {
        const [packageName, namespace, name] = match || []
        return {
            instanceVariable: kebabToUpperCamelCase(`${namespace ? `${namespace}-` : ''}-${name}`),
            modulePath: `${
                namespace ? `@${namespace}/` : ''
            }${APP_EXTENSION_PREFIX}${name}/${target === 'web' ? APP_EXTENSION_CLIENT_ENTRY : APP_EXTENSION_SERVER_ENTRY}`,
            packageName
        }
    })
    
    const appExtensions = getConfig()?.app?.extensions

    // TODO: later consider updating `normalizeExtensionsList` to use a util function
    return dedent`
            /*
            * Copyright (c) 2024, salesforce.com, inc.
            * All rights reserved.
            * SPDX-License-Identifier: BSD-3-Clause
            * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
            */
            // NOTE: I'm not completely sure why this was giving me isses as it should be running in the context of the
            // base application and not the extension-support project. 
            // import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

            // TODO: Once we create @salesforce/pwa-kit-extensibility we will refactor this code to use a shared utility that
            // normalizes/expands the configuration array before it is uses in this loader.
            const normalizeExtensionsList = (extensions = []) =>
                extensions.map((extension) => {
                    return {
                        packageName: Array.isArray(extension) ? extension[0] : extension,
                        config: Array.isArray(extension) ? {enabled: true, ...extension[1]} : {enabled: true}
                    }
                })
            
            // App Extensions
            ${extensionDetails
                .map(
                    ({instanceVariable, modulePath}) =>
                        `import ${instanceVariable} from '${modulePath}'`
                )
                .join('\n            ')}

            const installedExtensions = [
                ${extensionDetails
                    .map(
                        ({packageName, instanceVariable}) =>
                            `{packageName: '${packageName}', instanceVariable: ${instanceVariable}}`
                    )
                    .join(',\n                ')}
            ]

            const configuredExtensions = (normalizeExtensionsList(${JSON.stringify(appExtensions)}) || [])
                .filter((extension) => extension.config.enabled)
                .map((extension) => {
                    // Make sure that the configured extensions are installed, before instantiating them
                    const found = installedExtensions.find((ext) => ext.packageName === extension.packageName)
                    return found ? new found.instanceVariable(extension.config || {}) : false
                })
                .filter(Boolean)

            export default configuredExtensions
        `
}
