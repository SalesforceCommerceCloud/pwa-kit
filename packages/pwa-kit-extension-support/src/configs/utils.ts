/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import dedent from 'dedent'
import Handlebars from 'handlebars'

// Local
import {kebabToUpperCamelCase, nameRegex} from '../shared/utils'

// Regeister Handlebars helpers
Handlebars.registerHelper('getInstanceName', (aString) => {
    const [, namespace, name] = aString.match(nameRegex)

    return kebabToUpperCamelCase(`${namespace ? `${namespace}-` : ''}-${name}`)
})
Handlebars.registerHelper('isNotLast', (index, arrayLength) => index !== arrayLength - 1)
Handlebars.registerHelper('isNode', (target) => target === 'node')
Handlebars.registerHelper('jsonStringify', (context) => JSON.stringify(context, null, 0))

const templateString = dedent`
    /*
    * Copyright (c) 2024, salesforce.com, inc.
    * All rights reserved.
    * SPDX-License-Identifier: BSD-3-Clause
    * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
    */

    {{#each installed}}
    import {{getInstanceName .}} from '{{.}}/setup-{{#if (isNode @root.target)}}server{{else}}app{{/if}}'
    {{/each}}

    export default [
        {{#each configured}}
        new {{getInstanceName this.[0]}}({{{jsonStringify this.[1]}}}){{#if (isNotLast @index @root.configured.length)}},{{/if}}
        {{/each}}
    ]
`

export const renderTemplate = (data: any) => {
    // Compile the template
    const template = Handlebars.compile(templateString)

    // Apply data to the compiled template
    return template(data)
}
