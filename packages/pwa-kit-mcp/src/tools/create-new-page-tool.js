/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import logger from '../utils/logger.js'
import fs from 'fs/promises'
import path from 'path'
import {
    toKebabCase,
    toPascalCase,
    isLocalComponent,
    isLocalSharedUIComponent,
    isBaseComponent,
    isSharedUIBaseComponent,
    generateComponentImportStatement
} from '../utils'
import {z} from 'zod'

const systemPromptForCreatePage = `You are a smart assistant that can use tools when needed. \
        Please ask the user to provide following information **one at a time**, in a natural and conversational way. \
        Do **not** ask all the questions at once. \
        Do **not** assume the answers to the questions, especially the URL route. **Always** ask the user for the URL route. \
        - What is the name of the new page to create? \
        - List the components to include on the page, separated by commas. Component names should be in PascalCase (e.g., Image, ProductView) \
        - What is the URL route for this page? (e.g., /new-home, /my-products) \
        - What is the absolute path to your node_modules directory? \
        - What is the absolute path to your components directory? \
        - What is the absolute path to your pages directory? \
        - What is the absolute path to your routes.jsx file? \
        - Is ccExtensibility.overridesDir set in your package.json? (true/false) \
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
                    'The existing components to include on the page, separated by commas. Component names should be in PascalCase (e.g., AddressDisplay, ProductView, Footer)'
                ),
            route: z
                .string()
                .describe('The URL route for this page? (e.g., /new-home, /my-product-view)'),
            nodeModulesPath: z.string().describe('The absolute path to the node_modules directory'),
            componentsPath: z.string().describe('The absolute path to the components directory'),
            pagesPath: z.string().describe('The absolute path to the pages directory'),
            routesPath: z.string().describe('The absolute path to the routes.jsx file'),
            hasOverridesDir: z
                .boolean()
                .describe('Whether ccExtensibility.overridesDir is set in package.json')
        }
        this.unfoundComponents = []

        this.handler = async (args) => {
            logger.info(`------- Calling CreateNewPageTool handler`)
            if (
                !args ||
                !args.pageName ||
                !args.componentList ||
                !args.route ||
                !args.nodeModulesPath ||
                !args.componentsPath ||
                !args.pagesPath ||
                !args.routesPath ||
                args.hasOverridesDir === undefined
            ) {
                return {
                    role: 'system',
                    content: [{type: 'text', text: systemPromptForCreatePage}]
                }
            }
            return this.createPage(args.pageName, args.componentList, args.route, {
                nodeModulesPath: args.nodeModulesPath,
                componentsPath: args.componentsPath,
                pagesPath: args.pagesPath,
                routesPath: args.routesPath,
                hasOverridesDir: args.hasOverridesDir
            })
        }
    }

    async createPage(pageName, componentList, route, absolutePaths) {
        logger.info(
            {
                pageName,
                componentList,
                route
            },
            'Creating new page'
        )
        this.unfoundComponents = []
        logger.debug({absolutePaths}, 'Resolved absolute paths for page creation')

        try {
            const messages = []
            // Use the provided absolute path for pages directory
            const pagesDir = absolutePaths.pagesPath
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
            const pageContent = await this.generatePageContent(
                pageName,
                componentList,
                absolutePaths
            )
            logger.debug(
                {
                    pageContentPreview: pageContent.slice(0, 500),
                    pageContentLength: pageContent.length
                },
                'Generated page content'
            )
            const indexPath = path.join(pageDir, 'index.jsx')
            await fs.writeFile(indexPath, pageContent, 'utf8')
            await this.updateRoutes(pageName, route, absolutePaths)
            messages.push(`Created page ${pageName} at ${pageDir}`)
            messages.push(`Added route ${route}`)
            logger.debug({componentList}, 'Components requested for page')
            if (componentList.includes('ProductView')) {
                messages.push(systemPromptForProductHook)
            }
            if (componentList.includes('Image')) {
                messages.push(systemPromptForImageComponent)
            }
            if (this.unfoundComponents.length > 0) {
                logger.warn(
                    {unfoundComponents: this.unfoundComponents},
                    'Some components were not found'
                )
            } else {
                logger.debug('All components resolved successfully')
            }
            if (this.unfoundComponents.length != 0) {
                messages.push(systemPromptForUnfoundComponents(this.unfoundComponents))
            }
            logger.info({messages}, 'Page creation summary messages')
            return {
                role: 'system',
                content: [{type: 'text', text: messages.join('\n')}]
            }
        } catch (error) {
            logger.error({err: error, pageName, route}, 'Error creating page')
            return {
                role: 'developer',
                content: [{type: 'text', text: `Error creating page: ${error.message}`}]
            }
        }
    }

    generatePageContent(pageName, componentList, absolutePaths) {
        logger.debug({pageName, componentList}, 'Starting to generate page content')
        const imports = [
            `import React from 'react'`,
            `import Seo from '@salesforce/retail-react-app/app/components/seo'`
        ]
        const sharedUIComponents = ['Box']
        // Add component imports
        const accessPromises = componentList.map(async (component) => {
            const originalComponentInput = component
            component = toPascalCase(component)
            const componentName = component.charAt(0).toUpperCase() + component.slice(1)
            const componentDir = toKebabCase(componentName)
            logger.debug(
                {originalComponentInput, componentName, componentDir},
                'Processing component for import resolution'
            )
            // Use the provided absolute paths for component detection
            const isLocal = isLocalComponent(componentDir, absolutePaths.componentsPath)
            const isLocalSharedUI = isLocalSharedUIComponent(
                componentDir,
                absolutePaths.componentsPath
            )
            const isBase = isBaseComponent(componentDir, absolutePaths.nodeModulesPath)
            const isSharedUI = isSharedUIBaseComponent(componentDir, absolutePaths.nodeModulesPath)
            logger.debug(
                {componentName, isLocal, isLocalSharedUI, isBase, isSharedUI},
                'Component resolution results'
            )
            if (!isLocal && !isLocalSharedUI && !isBase && !isSharedUI) {
                this.unfoundComponents.push(component)
                logger.debug({componentName}, 'Component not found in local, shared UI, or base')
            }
            // Import getAssetUrl for displaying image source if Image component is used
            if (componentName === 'Image') {
                imports.push(
                    `import {getAssetUrl} from '@salesforce/pwa-kit-react-sdk/ssr/universal/utils'`
                )
                logger.debug('Detected Image component; queued getAssetUrl import')
            }
            if (isLocalSharedUI || isSharedUI) {
                sharedUIComponents.push(componentName)
                logger.debug({componentName}, 'Queued shared UI component for grouped import')
                return
            }
            // If the component name is the same as the page name, add 'Component' to the component name to avoid conflict with the page name
            const importComponentName =
                componentName === pageName ? componentName + 'Component' : componentName
            const importComponentPath = generateComponentImportStatement(
                importComponentName,
                componentDir,
                isLocal,
                isBase,
                absolutePaths,
                absolutePaths.hasOverridesDir
            )
            imports.push(importComponentPath)
            logger.debug(
                {importComponentName, importComponentPath},
                'Added component import statement'
            )
        })

        // Import all shared UI components in a single import statement
        if (sharedUIComponents.length > 0) {
            const importSharedUIComponents = sharedUIComponents.join(', ')
            imports.push(
                `import {${importSharedUIComponents}} from '@salesforce/retail-react-app/app/components/shared/ui'`
            )
            logger.debug({sharedUIComponents}, 'Prepared grouped shared UI import')
        }

        return Promise.all(accessPromises).then(() => {
            logger.debug({imports}, 'Resolved imports for generated page')

            const componentJsx = componentList
                .map((component) => {
                    component = toPascalCase(component)
                    const componentName = component.charAt(0).toUpperCase() + component.slice(1)
                    // If the component name is the same as the page name, add 'Component' to the component name
                    const importComponentName =
                        componentName === pageName ? componentName + 'Component' : componentName
                    if (componentName === 'Image') {
                        return ` <Image src={getAssetUrl('static/img/hero.png')} alt="pwa-kit banner" style={{ width: '700px', height: 'auto' }} />`
                    }
                    return `                <${importComponentName} />`
                })
                .join('\n')

            logger.debug(
                {
                    componentJsxPreview: componentJsx.slice(0, 300),
                    componentCount: componentList.length
                },
                'Generated component JSX content'
            )

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
        })
    }

    async updateRoutes(pageName, route, absolutePaths) {
        // Use the provided absolute path to the routes.jsx file
        const routesPath = absolutePaths.routesPath
        try {
            const routesContent = await fs.readFile(routesPath, 'utf8')

            const importStatement = `const ${pageName} = loadable(() => import('./pages/${toKebabCase(
                pageName
            )}'), {fallback})`

            logger.debug({importStatement}, 'Prepared dynamic import statement for routes')

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
            logger.info({route, pageName, routesPath}, 'Updated routes file with new page')
        } catch (error) {
            logger.error({err: error, routesPath, pageName, route}, 'Failed to update routes')
            throw new Error(`Failed to update routes: ${error.message}`)
        }
    }
}

const createNewPageTool = new CreateNewPageTool()

export default createNewPageTool
