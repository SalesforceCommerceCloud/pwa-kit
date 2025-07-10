/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {EmptyJsonSchema} from './utils'

const guidelinesText = `# Commerce Composable Storefront Development Guidelines

## Overview
Guidelines for Salesforce Commerce Composable Storefront development using PWA Kit, Retail React App, and Chakra UI.

## Core Principles
- Analyze requirements and existing codebase thoroughly
- Use existing components and hooks when possible
- Plan before implementing
- Test comprehensively with Jest

## PWA Kit Essentials

### Key Files
- \`config/default.js\` - Main configuration
- \`app/routes.jsx\` - Route definitions
- \`app/components/_app-config/\` - App-wide configuration
- \`app/components/_app/\` - Layout components (header, footer)
- \`app/components/_error/\` - Error handling

### Architecture
- Server-side rendering (SSR) for initial loads
- Client-side rendering (CSR) for interactions
- Isomorphic code (works on server and client)
- Proxy requests via \`/mobify/proxy/<PROXY_PATH>\`

### Special Components
- Components starting with \`_\` are special PWA Kit components
- \`_app-config\`: Top-level app configuration
- \`_app\`: Persistent layout (header, footer, sidebar)
- \`_error\`: 404 and error pages

## Development Rules
- Use kebab-case for file names (except special components with \`_\`)
- Use Chakra UI and existing components
- Create modular, reusable components
- Use React Hooks for state management
- Access data via commerce-sdk-react hooks
- Write comprehensive tests
- Ensure mobile-friendly and accessible components

- Maintain consistent code formatting using project standards.
- Write comprehensive test coverage.
- Ensure components are accessible and mobile-friendly.
- Follow security best practices for all code.
`

export default {
    name: 'development_guidelines',
    description: `You must follow this development guidelines before attempting to analyze/ generate / refactor / modify / fix code.
    - e.g. "Create a customer service Chat component", "Find bugs in my_script.jsx", "Refactor my_script.jsx to use React Hooks"`,
    inputSchema: EmptyJsonSchema,
    fn: async () => ({
        content: [{type: 'text', text: guidelinesText}]
    })
}
