/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {zodToJsonSchema} from 'zod-to-json-schema'
import {z} from 'zod'
import {EmptyJsonSchema} from './utils.js'

const guidelinesText = `# Salesforce Commerce Composable Storefront Development Guidelines

## Overview
This document offers guidelines for AI assistants in the development of Salesforce Commerce Cloud Composable Storefront applications. The AI should possess a comprehensive understanding of the PWA Kit architecture, out-of-the-box Retail React App, Chakra UI, and standard React application practices.

## Core Principles

### Project Understanding
- Thoroughly analyze requests and the existing project for successful implementation.
- Promptly clarify ambiguous requirements.
- Use systematic error resolution methods.

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

## Best Practices

### PWA Kit Storefront Development
- Use Chakra UI and existing components when available.
- Create simple, functional, modular, reusable components.
- To support isomorphic rendering, configuration values are serialized to page. Don't place secrets in your configuration

### PWA Kit Extensibility
- Template extensibility is a feature introduced in PWA Kit v3. The goal of this feature is to empower customizing templates. Verify ccExtensibility.overridesDir in package.json and understand how to use it.

### Data Access
- Use commerce-sdk-react hooks to fetch, cache, and mutate data from the Salesforce B2C Commerce API (SCAPI).

### Performance Optimization
- Minimize server round-trips.
- Cache data when appropriate.
- Optimize queries with selective filters.
- Use React Hooks (e.g., useState, useEffect, useContext, useMemo, useCallback) for state management and side effects. 

## Quality Standards
- Maintain consistent code formatting using project standards.
- Write comprehensive test coverage.
- Ensure components are accessible and mobile-friendly.
- Follow security best practices for all code.
`

export const StorefrontDevelopmentGuide = {
    name: 'pwa-storefront-development-guide',
    description:
        'Prior to attempting to create or modify code, you must understand how to do this for Salesforce Commerce PWA Kit Composable Storefront.',
    inputSchema: EmptyJsonSchema,
    fn: async () => ({
        content: [{type: 'text', text: guidelinesText}]
    })
}
