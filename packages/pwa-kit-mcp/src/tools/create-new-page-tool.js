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
    - With page name specified, what is the layout type (e.g., grid, flex, list) of the new page? \
    - List the components to include on the page, separated by commas (e.g., Header, ProductCard, Footer) \
    - What is the URL route for this page? (e.g., /new-home, /my-products) \
    Collect answers to these questions, then call the tool with the collected information as input parameters. `;

class CreateNewPageTool {
    constructor() {
        this.name = 'create_sample_storefront_page';
        this.description = 'Create a sample PWA storefront page. Gather information from user for the MCP tool parameters **one at a time**, in a natural and conversational way. Do **not** ask all the questions at once.';
        this.inputSchema = {
            pageName: z.string().describe('Tthe name of the new page to create?'),
            layout: z.string().optional().describe('The layout type (e.g., flex, grid, list) of the new page?'),
            componentList: z.array(z.string()).describe('The components to include on the page, separated by commas (e.g., Header, ProductView, Footer)'),
            route: z.string().describe('The URL route for this page? (e.g., /new-home, /my-product-view)')
        };

        this.handler = async (args) => {
            logMCPMessage(`------- Calling CreateNewPageTool handler`)
            if (!args || !args.pageName || !args.layout || !args.componentList || !args.route) {
                return {
                    role: 'system',
                    content: [{ type: 'text', text: systemPromptForCreatePage }]
                };
            }
            return this.createPage(args.pageName, args.layout, args.componentList, args.route);
        };
    }

    async createPage(pageName, layout = 'flex', componentList, route) {
        logMCPMessage(`========== Creating page ${pageName} with layout ${layout} and components ${componentList} and route ${route}`);
        await logMCPMessage(`Creating page ${pageName} with layout ${layout} and components ${componentList} and route ${route}`);

        try {
            const messages = [];
            const pagesDir = path.join(process.env.PWA_STOREFRONT_APP_PATH, 'pages');
            pageName = toPascalCase(pageName);
            const pageDir = path.join(pagesDir, toKebabCase(pageName));
            try {
                await fs.access(pageDir);
                throw new Error(`Page directory already exists: ${pageDir}`);
            } catch (err) {
                if (err.code !== 'ENOENT') throw err;
            }
            await fs.mkdir(pageDir, { recursive: true });
            const pageContent = this.generatePageContent(pageName, layout, componentList);
            const indexPath = path.join(pageDir, 'index.jsx');
            await fs.writeFile(indexPath, pageContent, 'utf8');
            await this.updateRoutes(pageName, route);
            messages.push(`Created page ${pageName} at ${pageDir}`);
            messages.push(`Added route ${route}`);
            if (componentList.includes('ProductView')) {
 
                messages.push(`User have added the ProductView component to the new page. Please ask user: \
                "To make it work, would you like to add the hook useProduct to your page?" \
                If user answers yes, add the hook useProduct to the new page following product-detail/index.jsx as example, \
                update ProductView tag to pass product and isProductLoading as props, \
                and update the path for the new page in routes.jsx with '/:productId'. If user answers no, skip this step.`);
            }
            logMCPMessage(messages.join('\n'));
            return {
                role: 'system',
                content: [{ type: 'text', text: messages.join('\n') }]
            };
        } catch (error) {
            logMCPMessage(`Error creating page: ${error.message}`);
            return {
                role: 'developer',
                content: [{ type: 'text', text: `Error creating page: ${error.message}` }]
            };
        }   
    }

    generatePageContent(pageName, layout, componentList) {
        const imports = [
            `import React from 'react'`,
            `import {useIntl} from 'react-intl'`,
            `import {Box} from '@salesforce/retail-react-app/app/components/shared/ui'`,
            `import Seo from '@salesforce/retail-react-app/app/components/seo'`
        ];

        // Add component imports
        componentList.forEach(component => {
            const componentName = component.charAt(0).toUpperCase() + component.slice(1);
            const componentDir = toKebabCase(componentName);
            imports.push(
                `import ${componentName} from '@salesforce/retail-react-app/app/components/${componentDir}'`
            );
        });

        const layoutStyle = layout === 'flex' ? 'display="flex"' : 
                           layout === 'grid' ? 'display="grid"' : '';

        const componentJsx = componentList.map(component => {
            const componentName = component.charAt(0).toUpperCase() + component.slice(1);
            return `                <${componentName} />`;
        }).join('\n');

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
        <Box data-testid="${pageName.toLowerCase()}-page" layerStyle="page" ${layoutStyle}>
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
`;
    }

    async updateRoutes(pageName, route) {
        const routesPath = path.join(process.env.PWA_STOREFRONT_APP_PATH, 'routes.jsx');
        try {
            const routesContent = await fs.readFile(routesPath, 'utf8')
            // Debugging output to log the routesContent
            //console.log('Routes content before replace:', routesContent)
            const importStatement = `import ${pageName} from './pages/${toKebabCase(pageName)}'`;

            const routeObject = `{
    path: '${route}',
    component: ${pageName},
    exact: true
},`;

            let updatedContent = routesContent.replace(
                /(import\s+\w+\s+from\s+'.\/pages\/.*?';?\n)(?!import)/g,
                `$1${importStatement}\n`
            );

            updatedContent = updatedContent.replace(
                /(export\s+const\s+routes\s*=\s*\[\s*{[^}]*},)/g,
                `$1\n${routeObject}`
            );
            await fs.writeFile(routesPath, updatedContent, 'utf8')
        } catch (error) {
            throw new Error(`Failed to update routes: ${error.message}`)
        }
    }
}

const createNewPageTool = new CreateNewPageTool();
createNewPageTool.createPage('New Home', 'flex', ['ProductView', 'Hero'], '/new-home');

export default createNewPageTool;
