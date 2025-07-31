/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fs from 'fs/promises'
import path from 'path'
import {toKebabCase, toPascalCase, logMCPMessage} from '../utils'
import {z} from 'zod'

const systemPromptForCreatePage = `You are a smart assistant that can use tools when needed. \
        Please ask the user to provide following information **one at a time**, in a natural and conversational way. \
        Do **not** ask all the questions at once. \
        Do **not** assume the answers to the questions, especially the URL route. **Always** ask the user for the URL route. \
        - What is the name of the new page to create? \
        - List the components to include on the page, separated by commas (e.g., Image, ProductView) \
        - What is the URL route for this page? (e.g., /new-home, /my-products) \
        - In case any component is **not found**, please ask the user to provide the full path of the component and import it on the page if not present already. \
        - **Do not** create a new component, unless requested explicitly by the user. \
        - If the newly added component requires any additional input properties, please ask the user for the same. \
        Collect answers to these questions, then call the tool with the collected information as input parameters.`

const systemPromptForProductHook = `User have added the ProductView component to the new page. Please ask user: \
        "To make it work, would you like to add the hook useProduct to your page?" \
        If user answers yes, please make sure do do following: \
        1. add the useProduct with ALL parameters following product-detail's useProduct as example, \
        2. update ProductView tag to pass product and isProductLoading as props, \
        3. in routes.jsx, update the path for the new page with '/:productId'. \
        4. open the new page in the browser with URL: http://localhost:3000/{static-route-path}/25592300M \
        If user answers no, skip above steps.`

const systemPromptForImageComponent = `User has added the Image component to the new page. Please ask the user, after they have provided the URL route:
        "To make it work, would you like to provide the full path of the image source to your page? Note that CORS (Cross-Origin Resource Sharing) restrictions may apply."
        
        If the user answers yes, please do the following:
        1. Ask the user to provide the full path of the image source.
        2. If the image is from a URL from the internet, always check in the codebase if the domain of the image source is present in the CSP img-src allow list in ssr.js or related server files.
        3. When checking the allow list, also check for wildcard entries (e.g., '*.domain.com') that would cover the provided domain. If either the exact domain or a matching wildcard is present, inform the user that the image source is already allowed by the CSP and proceed.
        4. If neither the domain nor a matching wildcard is present in the allow list, inform the user and **do not** update the src of the Image component. Tell the user that the CSP img-src allow list needs to be updated manually, and do not proceed further until the domain is confirmed present in the codebase.
        5. **Do not** update the CSP img-src allow list in ssr.js yourself; always ask the user to update the CSP img-src allow list manually, even if the user requests it.
        6. Once the user confirms they have updated the CSP img-src allow list, check again in the codebase if the domain of the image source or a matching wildcard is part of the CSP img-src allow list. If yes, then proceed. If no, tell the user that the CSP img-src allow list needs to be updated manually, or ask the user to provide another image source.
        7. Only if the image from the internet is part of the CSP img-src allow list (either by exact domain or wildcard), then proceed.
        8. If the image source is an https URL, then use the image source directly in the Image component. If it's a local image, update the path inside getAssetUrl and use it in the Image component.
        9. Ask the user to provide the alt text for the image.
        10. Ask the user to provide the width and height of the image.
        11. Update the src, alt text, width, and height of the Image component in the newly created page once the user has provided them.
        12. Request the user to restart the front end server.
        13. Open the new page in the browser with URL: http://localhost:3000/{static-route-path}
        
        If the user answers no, tell the user that the default image located at /static/img/hero.png is being displayed.
        
        Note:
        If the automation cannot detect the Image component but you know it exists and works as intended, proceed with the above steps as if the component is available. Do not block or alter the workflow due to the detection issue. Clearly communicate to the user that the Image component will be used, even if it was not detected by the automation.
        `
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

    /**
     * Checks if a component exists in the project or in node_modules/@salesforce/retail-react-app/app/components/.
     * Returns the import path if found, otherwise null.
     * @param {string} componentDir - kebab-case directory name of the component
     */
    async _findComponentImportPath(componentDir) {
        const localComponentPath = path.join(
            process.env.PWA_STOREFRONT_APP_PATH,
            'components',
            componentDir,
            'index.jsx'
        )
        try {
            await fs.access(localComponentPath)
            // Local project import
            return `app/components/${componentDir}`
        } catch (err) {
            // Not found locally, check node_modules
        }
        const salesforceComponentPath = path.join(
            process.env.PWA_STOREFRONT_APP_PATH,
            '..', // up to retail-react-app root
            'node_modules',
            '@salesforce',
            'retail-react-app',
            'app',
            'components',
            componentDir,
            'index.jsx'
        )
        try {
            await fs.access(salesforceComponentPath)
            // Salesforce node_modules import
            return `@salesforce/retail-react-app/app/components/${componentDir}`
        } catch (err) {
            // Not found in node_modules
        }
        return null
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

    async generatePageContent(pageName, componentList) {
        const imports = [
            `import React from 'react'`,
            `import {Box} from '@salesforce/retail-react-app/app/components/shared/ui'`,
            `import Seo from '@salesforce/retail-react-app/app/components/seo'`
        ]
        this.unfoundComponents = []
        // Add component imports
        const accessPromises = componentList.map(async (component) => {
            component = toPascalCase(component)
            const componentName = component.charAt(0).toUpperCase() + component.slice(1)
            const componentDir = toKebabCase(componentName)
            const importPath = await this._findComponentImportPath(componentDir)
            if (importPath) {
                logMCPMessage(
                    `?????? importing ${componentName} from '${importPath}'`
                )
                imports.push(
                    `import ${componentName} from '${importPath}'`
                )
                // Import getAssetUrl for displaying image source if Image component is used
                if (componentName === 'Image') {
                    imports.push(
                        `import {getAssetUrl} from '@salesforce/pwa-kit-react-sdk/ssr/universal/utils'`
                    )
                }
            } else {
                this.unfoundComponents.push(component)
            }
        })

        await Promise.all(accessPromises)
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

    return (
        <Box data-testid="${pageName.toLowerCase()}-page" layerStyle="page">
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
    }

    async updateRoutes(pageName, route) {
        const routesPath = path.join(process.env.PWA_STOREFRONT_APP_PATH, 'routes.jsx')
        try {
            const routesContent = await fs.readFile(routesPath, 'utf8')

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

            const routeObject = `    {\n        path: '${route}',\n        component: ${pageName},\n        exact: true\n    },`

            // Find the routes array, works for both export and non-export cases
            const routesArrayRegex = /(export\s+)?const\s+routes\s*=\s*\[([\s\S]*?)\]/m
            const match = updatedContent.match(routesArrayRegex)
            if (!match) {
                throw new Error('No routes array declaration found.')
            }

            // Find the start and end of the routes array
            const arrayStart = match.index + match[0].indexOf('[') + 1
            const arrayEnd = match.index + match[0].lastIndexOf(']')
            let arrayBody = updatedContent.slice(arrayStart, arrayEnd).trim()

            // Remove leading/trailing commas and whitespace
            arrayBody = arrayBody.replace(/^,|,$/g, '').trim()

            // Remove trailing '}' if present after a spread operator (e.g., ..._routes} in case of generated app)
            arrayBody = arrayBody.replace(/(\.\.\.[^,}\]]+)}\s*$/, '$1')

            if (arrayBody) {
                if (!arrayBody.match(/\.\.\.[^,}\]]+\s*$/)) {
                    if (!arrayBody.endsWith(',')) {
                        arrayBody += ','
                    }
                } else {
                    arrayBody = arrayBody.replace(/,\s*$/, '')
                }
            }

            const newArrayBody = `\n${routeObject}\n${arrayBody ? '    ' + arrayBody : ''}\n`

            // Reassemble the file
            updatedContent =
                updatedContent.slice(0, arrayStart) + newArrayBody + updatedContent.slice(arrayEnd)

            await fs.writeFile(routesPath, updatedContent, 'utf8')
        } catch (error) {
            throw new Error(`Failed to update routes: ${error.message}`)
        }
    }
}

const createNewPageTool = new CreateNewPageTool()

export default createNewPageTool
