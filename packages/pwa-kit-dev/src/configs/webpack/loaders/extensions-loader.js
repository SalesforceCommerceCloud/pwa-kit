/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import dedent from 'dedent'
import {kebabToUpperCamelCase} from '../utils'

const APP_EXTENSION_CLIENT_ENTRY = 'setup-app'
const APP_EXTENSION_SERVER_ENTRY = 'setup-server'

const APP_EXTENSION_PREFIX = 'extension'

const nameRegex = /^(?:@([^/]+)\/)?extension-(.+)$/

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
module.exports = function () {
    console.log('Running Extesions Loader...')
    // TODO: We need to account for extensions being tuples. Here we assume it's a simple
    // string that is the npm package name, the only expectation is that the package name starts with `extension-`,
    // it can be namespaced or not. We'll most likely want to create utilities for validation and parsing of the
    // extensions configuration array when we add support for the tupal config format.
    const {pkg, loadAsync = false, mode = 'client'} = this.getOptions() || {}
    const {devDependencies} = pkg

    const extensions = Object.keys(devDependencies)
        .map((packageName) => packageName.match(nameRegex))
        .filter(Boolean)

    // Ensure that only valid extension names are loaded.
    const extensionDetails = extensions.map((match) => {
        const [packageName, namespace, name] = match
        console.log('Extension Name: ', name)
        return {
            instanceVariable: kebabToUpperCamelCase(`${namespace ? `${namespace}-` : ''}-${name}`),
            modulePath: `${
                namespace ? `@${namespace}/` : ''
            }${APP_EXTENSION_PREFIX}-${name}/${mode == 'client' ? APP_EXTENSION_CLIENT_ENTRY : APP_EXTENSION_SERVER_ENTRY}`,
            packageName
        }
    })

    return dedent`
            /*
            * Copyright (c) 2024, salesforce.com, inc.
            * All rights reserved.
            * SPDX-License-Identifier: BSD-3-Clause
            * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
            */
            import loadable from '@loadable/component'
            import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

            // App Extensions
            ${extensionDetails
                .map(
                    ({instanceVariable, modulePath}) => {
                        return loadAsync ?
                            `const ${instanceVariable}Loader = loadable.lib(() => import('${modulePath}'))` :
                            `import ${instanceVariable} from '${modulePath}'`
                    }
                )
                .join('\n            ')}
            
            let loaders = [
                ${extensionDetails
                    .filter(({packageName}) => !packageName.endsWith('-disabled'))
                    .map(({instanceVariable}) => `${instanceVariable}${loadAsync ? 'Loader' : ''}`)
                    .join(',\n            ')}
            ]

            export const getExtensions = ${loadAsync ? 'async' : ''} () => {
                const configuredExtensions = getConfig()?.app?.extensions || []

                let modules
                
                ${
                    loadAsync ? 
                        `
                            modules = await Promise.all(loaders.map((loader) => loader.load()))
                            modules = modules.map((module) => module.default)
                        ` : 
                        'modules = loaders'
                }
                
                const instances = modules.map((module) => {
                    return new module({})
                })

                return instances
            }
        `
}
