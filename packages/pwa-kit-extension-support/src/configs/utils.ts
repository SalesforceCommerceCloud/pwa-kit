/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import dedent from 'dedent'
import Handlebars from 'handlebars'

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
        new {{getInstanceName .}}({}){{#if (isNotLast @index @root.configured.length)}},{{/if}}
        {{/each}}
    ]
`

export const renderTemplate = (data: any) => {
    const kebabToUpperCamelCase = (aString: string) => {
        return aString.split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join('')
    }

    Handlebars.registerHelper('getInstanceName', function (aString) {
        const nameRegex = /^(?:@([^/]+)\/)?extension-(.+)$/
        const [_, namespace, name] = aString.match(nameRegex)
        
        return kebabToUpperCamelCase(`${namespace ? `${namespace}-` : ''}-${name}`)
    })
      
    Handlebars.registerHelper('isNotLast', function (index, arrayLength) {
        return index !== arrayLength - 1
    })

    Handlebars.registerHelper('isNode', function (target) {
        return target === 'node'
    })

    // Compile the template
    const template = Handlebars.compile(templateString)
  
    // Apply data to the compiled template
    const output = template(data)
  
    return output
}