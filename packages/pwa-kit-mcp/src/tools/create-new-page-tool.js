/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fs from 'fs/promises'
import path from 'path'
import hooksRecommendationTool from './hooks-recommendation-tool.js'
import {
    toKebabCase,
    toPascalCase,
    isLocalComponent,
    isLocalSharedUIComponent,
    isBaseComponent,
    isSharedUIBaseComponent,
    generateComponentImportStatement
} from '../utils/index.js'
import {z} from 'zod'

const systemPromptForCreatePage = `Please ask the user for the following information one at a time:
- What is the name of the new page to create?
- List the components to include on the page, separated by commas. Component names should be in PascalCase (e.g., Image, ProductView)
- What is the URL route for this page? (e.g., /new-home, /my-products)
- What is the absolute path to your node_modules directory?
- What is the absolute path to your components directory?
- What is the absolute path to your pages directory?
- What is the absolute path to your routes.jsx file?
- Is ccExtensibility.overridesDir set in your package.json? (true/false)

Collect answers to these questions, then call the tool with the collected information as input parameters.`

const systemPromptForProductHook = `The ProductView component was added to the new page. Ask the user: "To make it work, would you like to add the useProduct hook to your page?"

If yes:
1. Add useProduct hook with all parameters (follow product-detail page example)
2. Update ProductView tag to pass product and isProductLoading as props
3. Update the route path to include '/:productId'
4. Open the page at: http://localhost:3000/{route-path}/25592300M

If no, skip these steps.`

const systemPromptForImageComponent = `The Image component was added to the new page. Ask the user: "Would you like to provide a custom image source? Note that CORS restrictions may apply."

If yes:
1. Ask for the full image path
2. For internet URLs, check if the domain is in the CSP img-src allow list in ssr.js
3. If domain not allowed, inform user to update CSP manually (do not update it yourself)
4. Ask for alt text, width, and height
5. Update the Image component with the provided values
6. Request server restart and open page at: http://localhost:3000/{route-path}

If no, the default image at /static/img/hero.png will be displayed.`

const systemPromptForUnfoundComponents = (unfoundComponents) =>
    `The following components were not found: ${unfoundComponents.join(', ')}. \
        If the component is not found, **Please** suggest changes to the newly generated page file based on the components not found.`

class CreateNewPageTool {
    constructor() {
        this.name = 'create_sample_page'
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
        this.unfoundComponents = []

        try {
            let messages = []
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
            const indexPath = path.join(pageDir, 'index.jsx')
            await fs.writeFile(indexPath, pageContent, 'utf8')
            await this.updateRoutes(pageName, route, absolutePaths)
            messages.push(
                `Your new page ${pageName} has been created at ${route} and includes the Header component.`
            )
            if (componentList.includes('ProductView')) {
                messages.push(systemPromptForProductHook)
            }
            if (componentList.includes('Image')) {
                messages.push(systemPromptForImageComponent)
            }
            if (this.unfoundComponents.length > 0) {
                messages.push(systemPromptForUnfoundComponents(this.unfoundComponents))
            }
            // Suggest relevant hooks using the hooks recommendation tool
            try {
                const hooksResult = await hooksRecommendationTool.handler({
                    pageName,
                    componentList,
                    useCase: `page creation for ${pageName}`,
                    hooksPath: null // Let the tool auto-detect the path
                })
                if (hooksResult?.content?.[0]?.text) {
                    messages.push('\n' + hooksResult.content[0].text)
                }
            } catch (error) {
                messages.push(
                    '\nUnable to get hook recommendations. You can ask for specific hook suggestions later.'
                )
            }
            return {role: 'assistant', content: [{type: 'text', text: messages.join('\n')}]}
        } catch (error) {
            return {
                role: 'developer',
                content: [{type: 'text', text: `Error creating page: ${error.message}`}]
            }
        }
    }

    generatePageContent(pageName, componentList, absolutePaths) {
        const imports = [
            `import React from 'react'`,
            `import Seo from '@salesforce/retail-react-app/app/components/seo'`
        ]
        const sharedUIComponents = ['Box']
        // Add component imports
        const accessPromises = componentList.map(async (component) => {
            component = toPascalCase(component)
            const componentName = component.charAt(0).toUpperCase() + component.slice(1)
            const componentDir = toKebabCase(componentName)
            // Use the provided absolute paths for component detection
            const isLocal = isLocalComponent(componentDir, absolutePaths.componentsPath)
            const isLocalSharedUI = isLocalSharedUIComponent(
                componentDir,
                absolutePaths.componentsPath
            )
            const isBase = isBaseComponent(componentDir, absolutePaths.nodeModulesPath)
            const isSharedUI = isSharedUIBaseComponent(componentDir, absolutePaths.nodeModulesPath)
            if (!isLocal && !isLocalSharedUI && !isBase && !isSharedUI) {
                this.unfoundComponents.push(component)
            }
            // Import getAssetUrl for displaying image source if Image component is used
            if (componentName === 'Image') {
                imports.push(
                    `import {getAssetUrl} from '@salesforce/pwa-kit-react-sdk/ssr/universal/utils'`
                )
            }
            if (isLocalSharedUI || isSharedUI) {
                sharedUIComponents.push(componentName)
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
        })

        // Import all shared UI components in a single import statement
        if (sharedUIComponents.length > 0) {
            const importSharedUIComponents = sharedUIComponents.join(', ')
            imports.push(
                `import {${importSharedUIComponents}} from '@salesforce/retail-react-app/app/components/shared/ui'`
            )
        }

        return Promise.all(accessPromises).then(() => {
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

            return `
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
