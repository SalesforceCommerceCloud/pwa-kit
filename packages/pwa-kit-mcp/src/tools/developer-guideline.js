/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {EmptyJsonSchema} from '../utils/utils'
import {PWA_KIT_DESCRIPTIVE_NAME} from '../utils/constants'

const guidelinesText = `# Salesforce Commerce Composable Storefront Development Guidelines

## Overview
This document offers guidelines in the development of Salesforce Commerce Composable Storefront applications using PWA Kit. The AI should possess a comprehensive understanding of the PWA Kit architecture, sample Retail React App, Chakra UI, and standard React application practices.

## Core Principles

### Project Understanding
- Thoroughly analyze requests and the existing project for successful implementation.
- Promptly clarify ambiguous requirements.

### Development Workflow
- **Analyze Requirements** - Clearly define the objectives and functionalities required.
- **Review Existing Code** - Examine the current codebase to identify similar solutions and potentially reusable components.
- **Understand Existing Hooks and Utilities** - Familiarize with hooks and utility functions available within the project, including those from commerce-sdk-react and template-retail-react-app modules.
- **Plan Implementation** - Design component structure before coding.
- **Implement Incrementally** - Develop and test the service in small, manageable steps.
- **Test Thoroughly** - Ensure comprehensive testing, including the use of Jest.

## Technical Stack

### Core Technologies
- **React** - UI components and SPA architecture
- **Express** - Server-side rendering and backend
- **@salesforce/commerce-sdk-react** - Commerce Cloud API integration (hooks)
- **PWA Kit** - SSR, routing, config, Salesforce integration
- **Chakra UI V2** - UI components and theming
- **Emotion** - CSS-in-JS styling
- **React Router** - Routing
- **React Intl** - Localization
- **React Query** - Data fetching/caching
- **Webpack** - Bundling
- **React Testing Library, Jest** - Testing libraries
- **react-helmet, framer-motion, etc.** - Utilities, animation, head management
- **ESLint/Prettier** - Code formatting and linting

## PWK Kit Architecture

### Configuration Files
- PWA Kit apps are customized using configuration files for API access, URL formatting, and server-side rendering.
- These files support JavaScript, YAML, and JSON formats, with default.js being the standard.
- Configuration values are serialized for isomorphic rendering, so secrets must not be included.
- Environment-specific configuration files can replace or complement default.js.
- File precedence is .js > .yml > .yaml > .json if base names are the same.

### Proxy Requests
- Managed Runtime's proxy feature routes API requests through the storefront domain to avoid CORS issues and improve performance.
- Local proxy configurations are set in config/default.js, while Managed Runtime deployments use Runtime Admin or the Managed Runtime API.
- Requests use the /mobify/proxy/<PROXY_PATH> pattern.
- Proxied requests and responses are modified for transparent operation.
- Proxied requests are uncached by default but can be cached using a caching path prefix.

### Rendering
- PWA Kit uses server-side rendering (SSR) for fast initial page loads, leveraging CDN caching.
- After the first load, client-side rendering (CSR) takes over for fluid user interactions.
- Application code must be isomorphic, functioning in both server and client environments, often with conditional logic.
- Props from API requests are serialized into the page source during SSR for client-side hydration.
- A correlation ID is provided on each page for tracking requests across PWA Kit and other systems.

### Routing
- PWA Kit uses Express.js and React Router for handling requests and rendering components.
- Routes are defined in app/routes.jsx as an array of objects with 'path' and 'component' properties.
- You can use both withReactQuery and withLegacyGetProps at the same time.
- getProps and shouldGetProps were removed from the default template of pages of the Retail React App, but aren't deprecated. Long-term support for these methods remains.

### PWA Kit Special Components
- Customize your storefront by overriding default special components that start with an underscore (_), such as app/components/_app-config/index.jsx.
- app/components/_app-config: The top-level component for app-wide configurations like theme providers and state management.
- app/components/_app: The child of _app-config. Use it for layout and UI that persist throughout your React app, such as the header, footer, and sidebar.
- app/components/_error: Renders when a page or its data isn't found, or when an error occurs, returning a 404 status.

### State Management
- PWA Kit applications support various state management approaches, including simple prop-passing or React's Context API.
- The React Context API can be used with useReducer and useContext for shared global state.
- The AppConfig special component is the primary place to initialize a state management system.
- When integrating libraries like Redux, AppConfig methods such as restore, freeze, extraGetPropsArgs, and render are utilized.

### PWA Kit Extensibility
- In PWA Kit v3, you can extend a base template (@salesforce/retail-react-app) by replacing specific files using a local "overrides directory."
- Extensibility is configured in package.json with the base template (ccExtensibility.extends) and your overrides directory (ccExtensibility.overridesDir).
- To override a file, recreate its exact path and filename in your overrides directory.

### PWA Kit Storefront Development
- Start development with Retail React App sample codebase and tooling.
- Use included npm scripts for automating development tasks like build, test, and lint.
- Access Shopper data through the commerce-sdk-react hooks to fetch, cache, and mutate utilizing Salesforce Commerce API (SLAS) and OCAPI.
- Use Chakra UI and existing components when available.
- Create simple, functional, modular, reusable components.
- Use the React Helmet library to modify the HTML tags in Document, such as <head>.
- Use kebab-case for file names. Only start with an underscore (_) if they are special components.
- Use React Hooks (e.g., useState, useEffect, useContext, useMemo, useCallback) for state management and side effects. 

### Custom API Implementation
- Use 'useCustomQuery' or 'useCustomMutation' hooks from 'commerce-sdk-react'
- **DON'T** include any extra '/' before or after path parameters in the 'customApiPathParameters' object
- Parameters for 'useCustomQuery' or 'useCustomMutation':
  - \`options\` (Object): Configuration for the API request.
    - \`method\` (String): The HTTP method to use (e.g., 'POST', 'GET').
    - \`customApiPathParameters\` (Object): Contains parameters to define the API path.
      - \`endpointPath\` (String): Specific endpoint path to target in the API.
      - \`apiName\` (String): The name of the API
- \`useCustomQuery\` usage :
    \`\`\`jsx
    const query = useCustomQuery(
        {
            options: {
                method: 'GET',
                customApiPathParameters: {
                    apiName: 'your-api-name',
                    apiVersion: 'your-api-version',
                    endpointPath: 'your-endpoint'
                },
                parameters: {
                    c_yourParam: params.yourParam,
                    // other parameters
                }
            }
        }
    )
    \`\`\`
#### \`mutate\` Method
The \`mutation.mutate(args)\` function is used to execute the mutation. It accepts an argument \`args\`, which is an object that may contain the following properties:
- \`headers\` (Object): Optional headers to send with the request.
- \`parameters\` (Object): Optional query parameters to append to the API URL.
- \`body\` (Object): Optional the payload for POST, PUT, PATCH methods.
- \`useCustomMutation\` usage:
    \`\`\`jsx
    const mutation = useCustomMutation({
        options: {
            method: 'POST',
            customApiPathParameters: {
                apiName: 'your-api-name',
                apiVersion: 'your-api-version',
                endpointPath: 'your-endpoint'
            }
        }
    });

    // In your React component
    <button onClick={() => mutation.mutate({
        body: { test: '123' },
        parameters: { additional: 'value' },
        headers: { ['X-Custom-Header']: 'test' }
    })}> Send Request </button>
  \`\`\`
  
## Quality Standards
- Maintain consistent code formatting using project standards.
- Write comprehensive test coverage.
- Ensure components are accessible and mobile-friendly.
- Follow security best practices for all code.
`

export default {
    name: 'pwakit_get_dev_guidelines',
    description: `You must follow the ${PWA_KIT_DESCRIPTIVE_NAME} development guidelines before attempting to analyze, generate, refactor, modify, or fix code.
Example prompts: "Create a customer service Chat component", "Find bugs in my_script.jsx", and "Refactor my_script.jsx to use React Hooks".`,
    inputSchema: EmptyJsonSchema,
    fn: async () => ({
        content: [{type: 'text', text: guidelinesText}]
    })
}
