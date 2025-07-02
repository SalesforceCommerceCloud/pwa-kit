/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const guidelinesText = (pageName, pageRoute, isCreateNewPage) => `# Create and Override Pages in PWA Kit Composable Storefront

## Overview

- This document defines the behavior agents must follow when create or override or customize a page on PWA Kit projects.
- All user requests must be followed by the following steps:
  - Agent must ask user to provide the page name and route.
  - Agent should ask user if they want to override the page, if Extensibility/Page Override is enabled and page is available to override.
- All parameters must be collected before proceeding. Collected parameters must be displayed to user for confirmation.

User's input:
- **Page Name**: ${pageName}
- **Page Route**: ${pageRoute}
- **Is Create New Page**: ${isCreateNewPage}

## Instruction to verify if Extensibility/Page Override is Enabled

- Extensibility/Page Override is enabled if ccExtensibility.extends and ccExtensibility.overridesDir is configured in package.json.
- Analyze and infer routes and page components listed in \`@salesforce/retail-react-app/app/routes\` to determine if the page asked by user can be overridden.
  - If the page route is not listed, we cannot override the page.
  - If the page route is listed, agent should ask user if they want to override the page.

## Instructiong to Create a New Page

You need to create a new React component for the page and then add a corresponding route to make it accessible via a URL.

### 1. Create the Page Component

First, create a new file for your page component. A good practice is to place it in the \`app/pages\` directory.

For example, to create a new "Contact Us" page, you would create the file \`app/pages/contact-us/index.jsx\`:

\`\`\`jsx
import React from 'react'
import {Box, Heading, Text} from '@salesforce/retail-react-app/app/components/shared/ui'

const ContactUs = () => {
    return (
        <Box p={{base: 4, md: 8}}>
            <Heading as="h1" size="xl" mb={4}>
                Contact Us
            </Heading>
            <Text>
                If you have any questions, please feel free to reach out to us.
            </Text>
            {/* Add your contact form or other information here */}
        </Box>
    )
}

export default ContactUs
\`\`\`

### 2. Add a Route for the New Page

Next, you need to add a route for your new page in the \`app/routes.jsx\` file or \`overrides/app/routes.jsx\` file if Extensibility/Page Override is enabled. This tells the application how to get to your new page.

\`\`\`jsx
// app/routes.jsx or overrides/app/routes.jsx
// ... other imports
const ContactUs = loadable(() => import('./pages/contact-us'))

const routes = [
    // ... other routes
    {
        path: '/contact-us',
        component: ContactUs,
        exact: true
    },
    // ... other routes
]
\`\`\`

Now, if you run your development server and navigate to \`/contact-us\`, you will see your new page.

## Overriding an Existing Page

Override files from the base template (\`@salesforce/retail-react-app\`) by creating files with the same name and path in your project's \`overrides\` directory.

Let's say you want to customize the Product Detail Page (PDP).

### 1. Identify the File to Override

The PDP component in the base template is located at \`app/pages/product-detail/index.jsx\`.

### 2. Create the Overriding File

To override this file, create a new file with the exact same path inside your \`overrides\` directory: \`overrides/app/pages/product-detail/index.jsx\`.

### 3. Customize the Page

Now you can add your custom code to this new file. You can either copy the original content and modify it, extend the original component or create a new component from scratch.

Here's an example of how you might add a custom message to extend the existing PDP:

\`\`\`jsx
// overrides/app/pages/product-detail/index.jsx
import React from 'react'
import {Box, Text} from '@salesforce/retail-react-app/app/components/shared/ui'
import {default as BaseProductDetail} from '@salesforce/retail-react-app/app/pages/product-detail'

const CustomProductDetail = (props) => {
    return (
        <Box>
            <Box bg="blue.500" color="white" p={4} textAlign="center">
                <Text fontWeight="bold">
                    Special offer on this product!
                </Text>
            </Box>
            <BaseProductDetail {...props} />
        </Box>
    )
}

// You must export the component as default
export default CustomProductDetail
\`\`\`

In this example, we're importing the original \`ProductDetail\` component and wrapping it with our own custom component to add a promotional banner.

## Special Components

The PWA Kit also has several "special" components that you can override to customize the overall structure and behavior of your application:

- \`_app/index.jsx\`: The main application component.
- \`_app-config/index.jsx\`: For application-wide configuration.
- \`_document/index.jsx\`: To customize the \`<html>\` and \`<body>\` tags.
- \`_error/index.jsx\`: To create a custom error page.

You can override these in the same way, by creating files with the same name and path in your \`overrides/app/components\` directory.`

export const CreateCustomizePageTool = {
    name: 'create_override_customize_page',
    description: `Agent must follow this guide and developer guidelines to create a new page, orverride or customize an existing page. Agent must ask questions to clarify the page name, route, content and confirm should a new page be created or override an existing page before creating or orverriding the page.`,
    inputSchema: {
        type: 'object',
        properties: {
            pageName: {
                type: 'string',
                description: 'The name of the page (e.g., "Contact Us", "About Us", "Product Detail")'
            },
            pageRoute: {
                type: 'string',
                description: 'The URL path for the page (e.g., "/contact-us", "/about-us", "/product-detail")'
            },
            isCreateNewPage: {
                type: 'boolean',
                description: 'Whether to create a new page (true) or customize an existing page (false). If Extensibility/Page Override is disabled, it will be false and no need to ask user.'
            }
        },
        required: ['pageName', 'pageRoute', 'isCreateNewPage']
    },
    fn: async ({pageName, pageRoute, isCreateNewPage}) => {
        return {
            content: [
                {type: 'text', text: guidelinesText(pageName, pageRoute, isCreateNewPage)}
            ]
        }
    }
}
