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

// Types
// TODO: This import has a "folder structure" smell. Look to fix this.
import {ApplicationExtensionsLoaderOptions} from './webpack/types'

// Regeister Handlebars helpers
Handlebars.registerHelper('getInstanceName', (aString) => {
    const [, namespace, name] = aString.match(nameRegex)
    return kebabToUpperCamelCase(`${namespace ? `${namespace}-` : ''}-${name}`)
})
Handlebars.registerHelper('isNotLast', (index, arrayLength) => index !== arrayLength - 1)
Handlebars.registerHelper('isNode', (target) => target === 'node')
Handlebars.registerHelper('isWeb', (target) => target === 'web')
Handlebars.registerHelper('jsonStringify', (context) => JSON.stringify(context, null, 0))

// NOTE: We inline this template because it's easier to bundle it in the code than load it from the file system due
// to issues with pathing because the current working directory for the loader isn't the same as the base project.
// We can look to resolve this in the future as it would be nice to have a independant file for the template.
const templateString = dedent`
    {{#if (isWeb @root.target)}}
    import loadable from '@loadable/component'
    {{/if}}

    {{#each installed}}
    {{#if (isNode @root.target)}}
    import {{getInstanceName .}} from '{{.}}/setup-server'
    {{else}}
    const {{getInstanceName .}}Loader = loadable.lib(() => import('{{.}}/setup-app'))
    {{/if}}
    {{/each}}

    {{#if (isNode @root.target)}}
    const getApplicationExtensions = () => {
        {{#if configured}}
        return [{{#each configured}}new {{getInstanceName this.[0]}}({{{jsonStringify this.[1]}}}){{#if (isNotLast @index @root.configured.length)}}, {{/if}}{{/each}}]
        {{else}}
        return []
        {{/if}}    
    }
    {{else}}
    const getApplicationExtensions = async () => {
    	{{#if configured}}
        const modules = await Promise.all([{{#each configured}}{{getInstanceName this.[0]}}Loader.load(){{#if (isNotLast @index @root.configured.length)}},{{/if}}{{/each}}])
        return [{{#each configured}}new modules[{{@index}}].default({{{jsonStringify this.[1]}}}){{#if (isNotLast @index @root.configured.length)}}, {{/if}}{{/each}}]
        {{else}}
        return []
        {{/if}}
    }
    {{/if}}

    export {
        getApplicationExtensions
    }
`

export const renderTemplate = (data: ApplicationExtensionsLoaderOptions) => {
    // Compile the template
    const template = Handlebars.compile(templateString)

    // Apply data to the compiled template
    return template(data).trim()
}
