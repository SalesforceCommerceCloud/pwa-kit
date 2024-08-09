/*
* Copyright (c) 2024, salesforce.com, inc.
* All rights reserved.
* SPDX-License-Identifier: BSD-3-Clause
* For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
*/

import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

/** */
const kebabToUpperCamelCase = (str) => {
    return str
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
}

/** */
const kebabToLowerCamelCase = (str) => {
    return str
        .split('-')
        .map((word, index) => 
            index === 0 
                ? word.toLowerCase() 
                : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join('');
}

module.exports = function (source) {
    const {app = {}} = getConfig()
    const {extensions} = app

    // NOTE: Look at replacing this with NormalModuleReplacement if possible.
    source = 
        `
            /*
            * Copyright (c) 2024, salesforce.com, inc.
            * All rights reserved.
            * SPDX-License-Identifier: BSD-3-Clause
            * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
            */
            // All Extensions
            ${extensions.map((extension) => `import ${kebabToUpperCamelCase(extension.split('\/')[1])} from '${extension}/setup-app'`).join('\n')}

            export default {
                ${extensions.map((extension) => `${kebabToLowerCamelCase(extension.split('\/')[1])}: ${kebabToUpperCamelCase(extension.split('\/')[1])}`).join(',\n')}
            }
        `
    return source
}