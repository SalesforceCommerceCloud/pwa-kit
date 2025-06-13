import { zodToJsonSchema } from 'zod-to-json-schema';
import { z } from 'zod';

const guidelinesText = `# Salesforce Commerce PWA Kit Composable Storefront Development Guidelines

## Overview
This document provides guidance for AI assistance with the Retail React App storefront project, a Salesforce Commerce Cloud PWA Kit Composable Storefront application template. The assistant should understand Progressive Web App(PWA) Kit project structure, provided SDK, Chakra UI and standard patterns for building React applications.

## Core Principles

### Project Understanding
- Analyze user requests thoroughly before implementation
- Ask clarifying questions when requirements are unclear
- Respect Salesforce platform boundaries and governor limits
- Follow systematic error resolution approaches

### Development Workflow
1. **Analyze Requirements** - Understand what needs to be built
2. **Review Existing Code** - Check the codebase for similar patterns and re-usable components
3. **Understand Existing Hooks and Utils** - Review available custom hooks and utils in the project includingcommerce-sdk-react and template-retail-react-app 
3. **Plan Implementation** - Design component structure before coding
4. **Implement Incrementally** - Build and test in small chunks
5. **Test Thoroughly** - Include Jest tests

## Technical Stack

### Core Technologies
- **Chakra UI** - Primary UI framework
- **React** - Primary UI framework
- **React Query** - Data querying
- **React Router** - Routing
- **React Hook Form** - Form handling
- **React Testing Library** - Testing
- **React Intl** - Internationalization
- **React Helmet** - SEO
- **React Lazy Load Image** - Image loading
- **React Lazy Load Component** - Component loading

### Development Environment
- **VS Code** - Primary development environment
- **ESLint/Prettier** - Code formatting and linting
- **Jest** - Component testing

## Best Practices

### PWA Kit Storefront Development
- Use Chakra UI components when available
- Create modular, reusable components

### Data Access
- Use commerce-sdk-react hooks for CRUD operations

### Performance Optimization
- Minimize server round-trips
- Cache data when appropriate
- Optimize queries with selective filters

## Project Structure
### PWA Kit Storefront Project Structure
\`\`\`
your-project-root/
│
├── config/                        # Likely contains configuration files for the project
│
├── overrides/                     # Custom overrides for the app
│   ├── app/
│   │   ├── assets/                # Static assets (SVGs, images, etc.)
│   │   │   └── svg/
│   │   ├── components/            # React components
│   │   │   ├── _app-config/
│   │   ├── contexts/              # React context providers
│   │   ├── pages/                 # Page components/routes
│   │   │   ├── home/
│   │   │   └── my-new-route/
│   │   ├── static/                # Static files
│   │   │   ├── ico/
│   │   │   ├── img/
│   │   │   │   └── global/
│   │   │   └── translations/
│   │   │       └── compiled/
│
├── translations/                  # Likely contains translation files for i18n
│
├── worker/                        # Possibly service worker or background scripts
│
├── babel.config.js                # Babel configuration
├── jest.config.js                 # Jest testing configuration
├── package-lock.json              # NPM lock file
├── package.json                   # Project manifest
└── README.MD                      # Project documentation
\`\`\`

### PWA Kit Structure
\`\`\`
pwa-kit/
│
├── e2e/                           # End-to-end tests and related scripts/assets
│   ├── scripts/
│   └── tests/
│       ├── a11y/
│       ├── desktop/
│       └── mobile/
│
├── packages/                      # Monorepo packages for SDKs, tools, and app logic
│   ├── commerce-sdk-react/        # React SDK for commerce features
│   ├── internal-lib-build/        # Internal build tools and configs
│   ├── pwa-kit-create-app/        # App scaffolding and templates
│   ├── pwa-kit-dev/               # Development tools and configs
│   ├── pwa-kit-react-sdk/         # React SDK for PWA features
│   ├── pwa-kit-runtime/           # Runtime utilities for PWA
│   └── pwa-storefront-mcp/        # Storefront Managed Cloud Platform components/utilities
│
├── template-express-minimal/      # Minimal Express app template
│
├── template-mrt-reference-app/    # Reference app template
│
├── template-retail-react-app/     # Retail React app template
│
├── template-typescript-minimal/   # Minimal TypeScript app template
│
├── test-commerce-sdk-react/       # Test app for commerce-sdk-react
│
├── scripts/                       # Utility scripts for project maintenance
│
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── lerna.json
├── LICENSE
├── package-lock.json
├── package.json
├── README.md
└── ...                            # Other root-level config and documentation files
\`\`\`

## Critical Constraints
- Respect governor limits and platform boundaries
- Implement proper security controls
- Write test coverage for all custom code

## Debugging & Troubleshooting
- Address governor limit issues by refactoring for efficiency

## Quality Standards
- Maintain consistent code formatting using project standards
- Write comprehensive test coverage
- Ensure components are accessible and mobile-friendly
- Follow security best practices for all code`;

export const EmptySchema = z.object({});
export const EmptyJsonSchema = zodToJsonSchema(EmptySchema);

export const Developing_LWC_Guidelines = {
  name: 'pwa-developing-guide',
  description:
    'Prior to attempting to create or modify components code, you must understand how to do this for Salesforce Commerce PWA Kit Composable Storefront.',
  inputSchema: EmptyJsonSchema,
  fn: async () => ({
    content: [{ type: 'text', text: guidelinesText }],
  }),
};
