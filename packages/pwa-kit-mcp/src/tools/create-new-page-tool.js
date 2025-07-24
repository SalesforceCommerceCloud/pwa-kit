/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fs from 'fs/promises';
import path from 'path';
import { toKebabCase, toPascalCase, logMCPMessage } from '../utils';
import { z } from 'zod';

const systemPromptForCreatePage = `You are a smart assistant that can use tools when needed. \
        Please ask the user to provide following information **one at a time**, in a natural and conversational way. \
        Do **not** ask all the questions at once. \
        - What is the name of the new page to create? \
        - List the components to include on the page, separated by commas (e.g., Image, ProductView) \
        - What is the URL route for this page? (e.g., /new-home, /my-products) \
        Collect answers to these questions, then call the tool with the collected information as input parameters. 
        Do **not** assume the answers to the questions.`

const systemPromptForProductHook = `User have added the ProductView component to the new page. Please ask user: \
        "To make it work, would you like to add the hook useProduct to your page?" \
        If user answers yes, please make sure do do following: \
        1. add the useProduct with ALL parameters following product-detail's useProduct as example, \
        2. update ProductView tag to pass product and isProductLoading as props, \
        3. in routes.jsx, update the path for the new page with '/:productId'. \
        4. open the new page in the browser with URL: http://localhost:3000/{static-route-path}/25592300M \
        If user answers no, skip above steps.`

const systemPromptForImageComponent = `User has added the Image component to the new page. Please ask user after they have provided with the URL route: \
        "To make it work, would you like to provide the full path of the image source to your page, Note that CORS (Cross-Origin Resource Sharing) restrictions may apply.?" \
        If user answers yes, please make sure do do following: \
        1. Ask the user to provide the full path of the image source, \
        2. Ask the user to provide the alt text for the image, \
        3. Ask the user to provide the width and height of the image, \
        4. Update the src of the newly createdImage component to the path of the image and the alt text once the user has provided the path and the alt text, \
        5. Update the width and height of the newly created Image component to the width and height of the image once the user has provided the width and height, \
        6. If the image is from a URL from the internet, then update the Content Security Policy inside packages/template-retail-react-app/app/ssr.js file to allow the site to access the image. \
        7. Restart the front end server running. \
        8. Open the new page in the browser with URL: http://localhost:3000/{static-route-path} \
        If user answers no, tell the user that the default image located at /static/img/hero.png is being displayed.`

const systemPromptForUnfoundComponents = (unfoundComponents) =>
    `The following components were not found: ${unfoundComponents.join(', ')}. \
        If the component is not found, **Please** suggest changes to the newly generated page file based on the components not found.`

class CreateNewPageTool {
    constructor() {
        this.name = 'create_sample_storefront_page'
        this.description =
            'Create a sample PWA storefront page. Gather information from user for the MCP tool parameters **one at a time**, in a natural and conversational way. Do **not** ask all the questions at once.'
        this.inputSchema = {
            pageName: z.string().describe('The name of the new page to create?'),
            componentList: z
                .array(z.string())
                .describe(
                    'The existing components to include on the page, separated by commas (e.g., AddressDisplay, ProductView, Footer)'
                ),
            route: z
                .string()
                .describe('The URL route for this page? (e.g., /new-home, /my-product-view)')
        }
        this.unfoundComponents = []

        this.handler = async (args) => {
            logMCPMessage(`------- Calling CreateNewPageTool handler`)
            if (!args || !args.pageName || !args.componentList || !args.route) {
                return {
                    role: 'system',
                    content: [{type: 'text', text: systemPromptForCreatePage}]
                }
            }
            return this.createPage(args.pageName, args.componentList, args.route)
        }
    }

    async createPage(pageName, componentList, route) {
        logMCPMessage(
            `========== Creating page ${pageName} with layout 'flex' and components ${componentList} and route ${route}`
        )
        this.unfoundComponents = []
        await logMCPMessage(
            `Creating page ${pageName} with layout 'flex' and components ${componentList} and route ${route}`
        )

        try {
            const messages = []
            const pagesDir = path.join(process.env.PWA_STOREFRONT_APP_PATH, 'pages')
            pageName = toPascalCase(pageName)
            const pageDir = path.join(pagesDir, toKebabCase(pageName))
            try {
                await fs.access(pageDir)
                throw new Error(`Page directory already exists: ${pageDir}`)
            } catch (err) {
                if (err.code !== 'ENOENT') throw err
            }
            await fs.mkdir(pageDir, {recursive: true})
            if (componentList.length == 0) {
                componentList.push(pageName)
            }
            const pageContent = await this.generatePageContent(pageName, componentList)
            logMCPMessage(`!!!!!! \n pageContent: ${pageContent} \n !!!!!`)
            const indexPath = path.join(pageDir, 'index.jsx')
            await fs.writeFile(indexPath, pageContent, 'utf8')
            await this.updateRoutes(pageName, route)
            messages.push(`Created page ${pageName} at ${pageDir}`)
            messages.push(`Added route ${route}`)
            logMCPMessage(`componentList: ${componentList}`)
            if (componentList.includes('ProductView')) {
                messages.push(systemPromptForProductHook)
            }
            if (componentList.includes('Image')) {
                messages.push(systemPromptForImageComponent)
            }
            logMCPMessage(`Unfound components: ${this.unfoundComponents}`)
            if (this.unfoundComponents.length != 0) {
                messages.push(systemPromptForUnfoundComponents(this.unfoundComponents))
            }
            logMCPMessage(messages.join('\n'))
            return {
                role: 'system',
                content: [{type: 'text', text: messages.join('\n')}]
            }
        } catch (error) {
            logMCPMessage(`Error creating page: ${error.message}`)
            return {
                role: 'developer',
                content: [{type: 'text', text: `Error creating page: ${error.message}`}]
            }
        }
    }

    generatePageContent(pageName, componentList) {
        const imports = [
            `import React from 'react'`,
            `import {useIntl} from 'react-intl'`,
            `import {Box} from '@salesforce/retail-react-app/app/components/shared/ui'`,
            `import Seo from '@salesforce/retail-react-app/app/components/seo'`
        ]

        // Add component imports
        const accessPromises = componentList.map(async (component) => {
            component = toPascalCase(component)
            const componentName = component.charAt(0).toUpperCase() + component.slice(1)
            const componentDir = toKebabCase(componentName)
            try {
                await fs.access(
                    path.join(process.env.PWA_STOREFRONT_APP_PATH, 'components', componentDir)
                )
            } catch (err) {
                if (err.code === 'ENOENT') {
                    this.unfoundComponents.push(component)
                } else {
                    throw err
                }
            }
            logMCPMessage(
                `?????? importing ${componentName} from '@salesforce/retail-react-app/app/components/${componentDir}'`
            )
            imports.push(
                `import {getAssetUrl} from '@salesforce/pwa-kit-react-sdk/ssr/universal/utils'`,
                `import ${componentName} from '@salesforce/retail-react-app/app/components/${componentDir}'`
            )
        })

        return Promise.all(accessPromises).then(() => {
            logMCPMessage(`?????? imports ${imports.join('\n')}`)

            const componentJsx = componentList
                .map((component) => {
                    component = toPascalCase(component)
                    const componentName = component.charAt(0).toUpperCase() + component.slice(1)
                    if (componentName === 'Image') {
                        return ` <Image src={getAssetUrl('static/img/hero.png')} alt="pwa-kit banner" style={{ width: '700px', height: 'auto' }} />`
                    }
                    return `                <${componentName} />`
                })
                .join('\n')

            return `/*
 * Copyright (c) ${new Date().getFullYear()}, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

${imports.join('\n')}

/**
 * ${pageName} component
 * @returns {React.JSX.Element}
 */
const ${pageName} = () => {
    const intl = useIntl();

    return (
        <Box data-testid="${pageName.toLowerCase()}-page" layerStyle="page" display="flex">
            <Seo
                title="${pageName}"
                description="${pageName} Page"
                keywords="Commerce Cloud, Retail React App, React Storefront"
            />

${componentJsx}
        </Box>
    );
}

export default ${pageName};
        `
        })
    }

    async updateRoutes(pageName, route) {
        const routesPath = path.join(process.env.PWA_STOREFRONT_APP_PATH, 'routes.jsx')
        try {
            const routesContent = await fs.readFile(routesPath, 'utf8')
            // Debugging output to log the routesContent

            const importStatement = `const ${pageName} = loadable(() => import('./pages/${toKebabCase(
                pageName
            )}'), {fallback})`

            logMCPMessage(`!!!!!!!!!! importStatement: ${importStatement}`)

            // Match all loadable import statements
            const loadableRegex =
                /const\s+\w+\s*=\s*loadable\(\(\)\s*=>\s*import\(['"`].*?['"`]\)(?:,\s*\{fallback\})?\);?/g
            const matches = [...routesContent.matchAll(loadableRegex)]

            if (matches.length === 0) {
                throw new Error('No loadable import statements found.')
            }

            const lastMatch = matches[matches.length - 1]
            const insertPosition = lastMatch.index + lastMatch[0].length

            // Insert the new import after the last one
            let updatedContent =
                routesContent.slice(0, insertPosition) +
                `\n${importStatement}` +
                routesContent.slice(insertPosition)

            const routeObject = `   {
        path: '${route}',
        component: ${pageName},
        exact: true
    },`

            updatedContent = updatedContent.replace(
                /(export\s+const\s+routes\s*=\s*\[\s*{[^}]*},)/g,
                `$1\n${routeObject}`
            )
            await fs.writeFile(routesPath, updatedContent, 'utf8')
        } catch (error) {
            throw new Error(`Failed to update routes: ${error.message}`)
        }
    }
}

const createNewPageTool = new CreateNewPageTool()

export default createNewPageTool
