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
    // NOTE: We need to account for extensions being tuples. Here we assume it's a simple
    // string that is the npm package name.
    const {extensions = []} = getConfig()?.app || {}

    return dedent`
            /*
            * Copyright (c) 2024, salesforce.com, inc.
            * All rights reserved.
            * SPDX-License-Identifier: BSD-3-Clause
            * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
            */
            // Extension Imports
            ${extensions
                .map(
                    (extension) =>
                        `import ${kebabToUpperCamelCase(
                            extension.split('/')[1]
                        )} from '${extension}/${APP_EXTENSION_CLIENT_ENTRY}'`
                )
                .join('\n            ')}
            
            export default [
                ${extensions
                    .map((extension) => {
                        const config = {} // TODO: Parse config config here.
                        return `new ${kebabToUpperCamelCase(
                            extension.split('/')[1]
                        )}(${JSON.stringify(config)})`
                    })
                    .join(',\n                ')}
            ]
        `
}
