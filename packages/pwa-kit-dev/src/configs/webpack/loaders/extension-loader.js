/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {kebabToUpperCamelCase, kebabToLowerCamelCase} from '../utils'

const APP_EXTENSION_CLIENT_ENTRY = 'setup-app'

module.exports = function () {
    const {extensions = []} = getConfig()?.app || {}

    return `
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
                .join('\n')}
            
            export default {
                ${extensions
                    .map(
                        (extension) =>
                            `${kebabToLowerCamelCase(
                                extension.split('/')[1]
                            )}: ${kebabToUpperCamelCase(extension.split('/')[1])}`
                    )
                    .join(',\n')}
            }
        `
}
