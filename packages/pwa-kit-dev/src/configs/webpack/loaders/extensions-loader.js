/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import dedent from 'dedent'
import {kebabToUpperCamelCase} from '../utils'

const APP_EXTENSION_CLIENT_ENTRY = 'setup-app'
const APP_EXTENSION_PREFIX = 'extension'

const nameRegex = /^(?:@([^/]+)\/)?extension-(.+)$/

const getExtensionNames = (extensions) => {
    return (extensions || []).map((extension) => {
        return Array.isArray(extension) ? extension[0] : extension
    })
}
const normalizeExtensionsList = (extensions) =>
    extensions.map((extension) => {
        if (Array.isArray(extension)) {
            return {name: extension[0], config: extension[1]}
        }
        return {name: extension}
    })

/**
 * The `extensions-loader` is used to return all configured extensions for a given pwa-kit
 * application. We use this loader as a simple way to determine what extension code in required in
 * the application bundle, without this we would have to rely on other more complex ways of
 * including application extensions in the bundle, like custom webpack entry points for extension.
 *
 * With this solution we can rely on the fact that all configured application extensions are concretely
 * referenced in code and therefore will end up in the resultant bundle.
 *
 * @returns {string} The string representation of a module exporting all the named application extension modules.
 */
module.exports = function () {
    // TODO: Ben's PR will affect this file
    // TODO: We need to account for extensions being tuples. Here we assume it's a simple
    // string that is the npm package name, the only expectation is that the package name starts with `extension-`,
    // it can be namespaced or not. We'll most likely want to create utilities for validation and parsing of the
    // extensions configuration array when we add support for the tupal config format.
    const {extensions = []} = getConfig()?.app || {}

    // Ensure that only valid extension names are loaded.
    const validExtensions = normalizeExtensionsList(extensions).filter((extension) =>
        Boolean(extension.name.match(nameRegex))
    )
    const extensionDetails = validExtensions.map((extension) => {
        const [_, namespace, name] = extension.name.match(nameRegex)
        return {
            instanceVariable: kebabToUpperCamelCase(`${namespace ? `${namespace}-` : ''}-${name}`),
            modulePath: `${
                namespace ? `@${namespace}/` : ''
            }${APP_EXTENSION_PREFIX}-${name}/${APP_EXTENSION_CLIENT_ENTRY}`,
            config: JSON.stringify(extension.config)
        }
    })
    console.log('--- extensionDetails', extensionDetails)

    return dedent`
            /*
            * Copyright (c) 2024, salesforce.com, inc.
            * All rights reserved.
            * SPDX-License-Identifier: BSD-3-Clause
            * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
            */
            // Extension Imports
            ${extensionDetails
                .map(
                    ({instanceVariable, modulePath}) =>
                        `import ${instanceVariable} from '${modulePath}'`
                )
                .join('\n            ')}

            export default [
                ${extensionDetails
                    .map(({instanceVariable, config}) => {
                        return `new ${instanceVariable}(${config})`
                    })
                    .join(',\n                ')}
            ]
        `
}
