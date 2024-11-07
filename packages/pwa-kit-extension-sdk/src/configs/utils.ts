/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Third-Party
import dedent from 'dedent'
import Handlebars from 'handlebars'

// Local
import {kebabToUpperCamelCase, nameRegex} from '../shared/utils'

// Types
import {ApplicationExtensionsLoaderOptions} from './webpack/types'

// Register Handlebars helpers
Handlebars.registerHelper('getInstanceName', (aString: string) => {
    const match = aString.match(nameRegex)

    // Explicitly define `namespace` and `name` as strings with fallback values
    const namespace = match?.[1] ?? ''
    const name = match?.[2] ?? ''

    return kebabToUpperCamelCase(`${namespace ? `${namespace}-` : ''}${name}`)
})
Handlebars.registerHelper('isNotLast', (index, arrayLength) => index !== arrayLength - 1)
Handlebars.registerHelper('isNode', (target) => target === 'node')
Handlebars.registerHelper('isWeb', (target) => target === 'web')
Handlebars.registerHelper('jsonStringify', (context) => JSON.stringify(context, null, 0))

// NOTE: We inline this template because it's easier to bundle it in the code than load it from the file system due
// to issues with pathing because the current working directory for the loader isn't the same as the base project.
// We can look to resolve this in the future as it would be nice to have a independant file for the template.
const templateString = dedent`
    import {getConfiguredExtensions} from '../../shared/utils/helpers'
    {{#if (isWeb @root.target)}}
    import loadable from '@loadable/component'
    {{/if}}

    {{#each configured}}
    {{#if (isNode @root.target)}}
    import {{getInstanceName this.[0]}} from '{{this.[0]}}/setup-server'
    {{else}}
    const {{getInstanceName this.[0]}}Loader = loadable.lib(() => import('{{this.[0]}}/setup-app'))
    {{/if}}
    {{/each}}

    const imports = {
        {{#each configured}}
        {{#if (isNode @root.target)}}
        '{{this.[0]}}': {{getInstanceName this.[0]}},
        {{else}}
        '{{this.[0]}}': {{getInstanceName this.[0]}}Loader,
        {{/if}}
        {{/each}}
    }

    {{#if (isNode @root.target)}}
    const getApplicationExtensions = () => {
        const configuredExtensions = getConfiguredExtensions()
        if (!configuredExtensions) return []

        return configuredExtensions.map((extension) => {
            const [packageName, config] = extension
            return new imports[packageName](config)
        })
    }
    {{else}}
    const getApplicationExtensions = async () => {
        const configuredExtensions = getConfiguredExtensions()
        if (!configuredExtensions) return []

        const modules = await Promise.all(configuredExtensions.map((extension) => {
            const [packageName] = extension
            return imports[packageName].load()
        }))
        return configuredExtensions.map((extension, index) => {
            const [,config] = extension
            return new modules[index].default(config)
        })
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
