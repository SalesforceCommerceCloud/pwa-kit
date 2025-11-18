/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {z} from 'zod'
import {PWA_KIT_DESCRIPTIVE_NAME} from '../utils/constants'
import {loadComponentsCatalog, loadHooksCatalog} from '../utils/data'

// Define the input schema using Zod
const inputSchema = {
    task: z
        .enum(['create_page', 'create_component', 'create_helper', 'debug', 'test', 'other'])
        .describe(
            'REQUIRED: Infer the task type from the user prompt. Choose from: "create_page" (building new pages/routes), "create_component" (building new components), "create_helper" (utility functions/hooks), "debug" (fixing issues/errors), "test" (writing tests), "other" (anything else). Example: "create a page" → "create_page", "build a component" → "create_component", "fix a bug" → "debug".'
        ),
    keywords: z
        .array(z.string())
        .min(1)
        .describe(
            'REQUIRED: Extract 1-5 relevant keywords from the user prompt that describe the domain/feature being worked on. Examples: user says "create a page for sample products" → ["sample", "products", "list"]; user says "debug cart authentication" → ["cart", "authentication", "debug"]; user says "build a search form component" → ["search", "form", "component"]. Always provide at least one keyword.'
        )
}

/**
 * Generates guidance content based on task type and keywords
 * @param {string} task - The task type
 * @param {string[]} keywords - Array of keywords relevant to the task
 * @returns {Promise<string>} Formatted guidance text
 */
async function generateGuidance(task, keywords) {
    // Validate task parameter
    if (!task || task === '' || task === 'undefined' || task === 'null') {
        return `❌ ERROR: Missing required 'task' parameter!

You MUST rerun this tool immediately with BOTH required parameters.

HOW TO FIX:
1. Analyze the user's prompt to determine the task type
2. Call this tool again with:
   - task: One of ["create_page", "create_component", "create_helper", "debug", "test", "other"]
   - keywords: Array of 1-5 relevant keywords from the user's request

EXAMPLES:
- User: "create a page for sample products" 
  → Rerun with: task="create_page", keywords=["sample", "products", "list"]
  
- User: "fix cart issues"
  → Rerun with: task="debug", keywords=["cart", "issues"]
  
- User: "build a search component"
  → Rerun with: task="create_component", keywords=["search", "component"]

DO NOT proceed with any other action until you have successfully called this tool with valid parameters.`
    }

    // Validate keywords parameter
    const keywordList = Array.isArray(keywords)
        ? keywords.map((k) => k.trim()).filter((k) => k.length > 0)
        : []

    if (keywordList.length === 0) {
        return `❌ ERROR: Missing or empty 'keywords' parameter!

You MUST rerun this tool immediately with BOTH required parameters.

HOW TO FIX:
1. Extract 1-5 relevant keywords from the user's prompt
2. Call this tool again with:
   - task: "${task}" (already provided)
   - keywords: Array of strings describing the domain/feature

EXAMPLES OF KEYWORD EXTRACTION:
- User: "create a page for sample products" 
  → keywords=["sample", "products", "list"]
  
- User: "fix authentication in the cart"
  → keywords=["authentication", "cart"]
  
- User: "build a search form with filters"
  → keywords=["search", "form", "filters"]
  
- User: "add product recommendations"
  → keywords=["product", "recommendations"]

DO NOT proceed with any other action until you have successfully called this tool with valid keywords.`
    }

    let guidance = `# ${PWA_KIT_DESCRIPTIVE_NAME} Prompt Guidance\n\n`
    guidance += `## Task Type: ${task.replace(/_/g, ' ').toUpperCase()}\n\n`
    guidance += `## Keywords: ${keywordList.join(', ')}\n\n`

    // Task-specific guidance
    switch (task) {
        case 'create_page':
            guidance += `### Guidelines for Creating Pages\n\n`
            guidance += `⚠️ **MANDATORY FIRST STEP**: Before planning any code changes, you MUST call the \`pwakit_get_dev_guidelines\` tool to review the development guidelines.\n\n`
            guidance += `After reviewing the guidelines:\n`
            guidance += `- Pages should be created in the \`app/pages\` directory\n`
            guidance += `- Follow React best practices and PWA Kit conventions\n`
            guidance += `- Ensure proper routing configuration\n`
            guidance += `- Import necessary components and hooks\n\n`
            guidance += `**DO NOT proceed with planning or code changes until you have called \`pwakit_get_dev_guidelines\`.**\n\n`
            break

        case 'create_component':
            guidance += `### Guidelines for Creating Components\n\n`
            guidance += `⚠️ **MANDATORY FIRST STEP**: Before planning any code changes, you MUST call the \`pwakit_get_dev_guidelines\` tool to review the development guidelines.\n\n`
            guidance += `After reviewing the guidelines:\n`
            guidance += `- Components should be created in the \`app/components\` directory\n`
            guidance += `- Use functional components with React Hooks\n`
            guidance += `- Follow PWA Kit component patterns and conventions\n`
            guidance += `- Ensure proper prop types and documentation\n`
            guidance += `- Consider reusability and composition\n\n`
            guidance += `**DO NOT proceed with planning or code changes until you have called \`pwakit_get_dev_guidelines\`.**\n\n`
            break

        case 'create_helper':
            guidance += `### Guidelines for Creating Helper Functions\n\n`
            guidance += `⚠️ **MANDATORY FIRST STEP**: Before planning any code changes, you MUST call the \`pwakit_get_dev_guidelines\` tool to review the development guidelines.\n\n`
            guidance += `After reviewing the guidelines:\n`
            guidance += `- Helper functions should be created in appropriate utility directories\n`
            guidance += `- Keep functions pure and testable\n`
            guidance += `- Provide clear JSDoc documentation\n`
            guidance += `- Export functions properly for reuse\n`
            guidance += `- Consider edge cases and error handling\n\n`
            guidance += `**DO NOT proceed with planning or code changes until you have called \`pwakit_get_dev_guidelines\`.**\n\n`
            break

        case 'debug':
            guidance += `### Guidelines for Debugging\n\n`
            guidance += `⚠️ **MANDATORY FIRST STEP**: Before planning any code changes, you MUST call the \`pwakit_get_dev_guidelines\` tool to review the development guidelines.\n\n`
            guidance += `After reviewing the guidelines:\n`
            guidance += `- Check console logs and error messages\n`
            guidance += `- Verify component imports and exports\n`
            guidance += `- Ensure proper data flow and state management\n`
            guidance += `- Review Commerce SDK React hook usage\n\n`
            guidance += `**DO NOT proceed with planning or code changes until you have called \`pwakit_get_dev_guidelines\`.**\n\n`
            break

        case 'test':
            guidance += `### Guidelines for Testing\n\n`
            guidance += `- Write unit tests for components and functions\n`
            guidance += `- Follow PWA Kit testing conventions\n`
            guidance += `- Use appropriate testing libraries (Jest, React Testing Library)\n`
            guidance += `- Ensure adequate test coverage\n`
            guidance += `- Test edge cases and error scenarios\n\n`
            break

        default:
        case 'other':
            guidance += `### General PWA Kit Development Guidelines\n\n`
            guidance += `- Always review the developer guidelines before starting\n`
            guidance += `- Follow PWA Kit best practices and conventions\n`
            guidance += `- Use appropriate tools for your specific task\n`
            guidance += `- Leverage Commerce SDK React hooks when applicable\n`
            guidance += `- Maintain code quality and consistency\n\n`
            break
    }

    // Add keyword-specific guidance
    if (keywordList.length > 0) {
        guidance += `### Keyword-Specific Considerations\n\n`

        const keywordGuidance = {
            cart: 'Consider using useShopperBaskets or useBasket hooks for cart operations',
            product:
                'Consider using useProduct, useProducts, or useShopperSearch hooks for product data',
            checkout: 'Review checkout flow components and payment integration patterns',
            authentication:
                'Use useCustomer, useShopperLogin, or useShopperCustomers hooks for auth operations',
            search: 'Consider using useShopperSearch or useSearchSuggestions hooks',
            category: 'Use useCategory or useCategories hooks for category data',
            wishlist: 'Consider using useCustomerProductLists hooks for wishlist functionality',
            navigation: 'Review routing configuration and navigation patterns',
            form: 'Use Chakra UI form components and validation patterns',
            api: 'Review Commerce SDK React hooks and custom API integration patterns',
            styling: 'Use Chakra UI components and theming system',
            performance: 'Review code splitting, lazy loading, and optimization techniques',
            accessibility: 'Ensure ARIA labels, keyboard navigation, and screen reader support',
            mobile: 'Test responsive design and mobile-specific interactions',
            seo: 'Review metadata, structured data, and SEO best practices'
        }

        for (const keyword of keywordList) {
            const lowerKeyword = keyword.toLowerCase()
            for (const [key, value] of Object.entries(keywordGuidance)) {
                if (lowerKeyword.includes(key)) {
                    guidance += `- **${key}**: ${value}\n`
                }
            }
        }

        guidance += `\n`
    }

    // Load and append component catalog for create_page and create_component tasks
    if (task === 'create_page' || task === 'create_component') {
        try {
            const catalog = await loadComponentsCatalog()
            // Strip out snippet field to exclude code samples
            const catalogWithoutSnippets = catalog.map(({name, summary}) => ({name, summary}))

            const taskName = task.replace(/_/g, ' ')
            guidance += `---\n\n`
            guidance += `## ⚠️ CRITICAL: Component Selection Process\n\n`
            guidance += `Before making ANY code modifications, you MUST follow this process:\n\n`
            guidance += `1. Review the available components in the catalog below\n`
            guidance += `2. Identify which components you intend to use for this ${taskName}\n`
            guidance += `3. Call the \`pwakit_recommend_components\` tool with:\n`
            guidance += `   - selectedComponents: Array of component names you plan to use (e.g., ["ProductTile", "Breadcrumb"])\n`
            guidance += `4. The tool will return full implementation details including code snippets and import statements\n`
            guidance += `5. ONLY AFTER receiving the response, proceed with integrating the components following the provided snippets EXACTLY\n\n`
            guidance += `**DO NOT write or modify any code until you have completed the component selection process above.**\n\n`
            guidance += `### Available Components Catalog\n\n`
            guidance += `The following components are available for use. Each component includes a name and summary description:\n\n`
            guidance += `\`\`\`json\n${JSON.stringify(catalogWithoutSnippets, null, 2)}\n\`\`\`\n\n`
            guidance += `Remember: You must use \`pwakit_recommend_components\` with your selectedComponents array BEFORE making any code changes.\n`
        } catch (error) {
            guidance += `\n\n⚠️ Warning: Could not load component catalog: ${error.message}\n`
        }

        // Load and append hooks catalog
        try {
            const hooksCatalog = await loadHooksCatalog()
            // Strip out snippet field to exclude code samples
            const hooksCatalogWithoutSnippets = hooksCatalog.map(({name, summary}) => ({
                name,
                summary
            }))

            const hooksTaskName = task.replace(/_/g, ' ')
            const hooksJson = JSON.stringify(hooksCatalogWithoutSnippets, null, 2)
            guidance += `\n---\n\n`
            guidance += `## ⚠️ CRITICAL: Hooks Selection Process\n\n`
            guidance += `Before making ANY code modifications, you MUST follow this process:\n\n`
            guidance += `1. Review the available hooks in the catalog below\n`
            guidance += `2. Identify which hooks you intend to use for this ${hooksTaskName}\n`
            guidance += `3. Call the \`pwakit_recommend_hooks\` tool with:\n`
            guidance += `   - selectedHooks: Array of hook names you plan to use (e.g., ["useProduct", "useBasket"])\n`
            guidance += `4. The tool will return full implementation details including code snippets and usage examples\n`
            guidance += `5. ONLY AFTER receiving the response, proceed with integrating the hooks following the provided snippets EXACTLY\n\n`
            guidance += `**DO NOT write or modify any code until you have completed the hooks selection process above.**\n\n`
            guidance += `### Available Hooks Catalog\n\n`
            guidance += `The following hooks are available for use. Each hook includes a name and summary description:\n\n`
            guidance += `\`\`\`json\n${hooksJson}\n\`\`\`\n\n`
            guidance += `Remember: You must use \`pwakit_recommend_hooks\` with your selectedHooks array BEFORE making any code changes.\n`
        } catch (error) {
            guidance += `\n\n⚠️ Warning: Could not load hooks catalog: ${error.message}\n`
        }
    }

    return guidance
}

export default {
    name: 'pwakit_prompt_guidance',
    description: `⚠️ CRITICAL: You MUST call this tool FIRST before taking any other action when working with ${PWA_KIT_DESCRIPTIVE_NAME}.

This tool provides essential contextual guidance, best practices, and recommended approaches based on your specific task type and keywords. It will help you:
- Understand the correct tools and patterns to use
- Follow PWA Kit conventions and standards
- Avoid common mistakes and anti-patterns
- Leverage the appropriate Commerce SDK React hooks and components

REQUIRED WORKFLOW:
1. FIRST: Analyze the user's prompt to extract the task type and relevant keywords
2. IMMEDIATELY: Call this tool with BOTH required parameters:
   - task: Infer from user intent (create_page, create_component, create_helper, debug, test, or other)
   - keywords: Extract 1-5 domain/feature keywords from the user's request
3. THEN: Follow the guidance provided to complete the task

Example calls based on user prompts:
- User: "create a page for sample products" → Call with task="create_page", keywords=["sample", "products", "list"]
- User: "fix authentication in cart" → Call with task="debug", keywords=["authentication", "cart"]
- User: "build a search component with filters" → Call with task="create_component", keywords=["search", "filter", "component"]
- User: "add product recommendations" → Call with task="create_component", keywords=["product", "recommendations"]

IMPORTANT: ALWAYS provide both task AND keywords parameters - they are not optional!`,
    inputSchema,
    fn: async ({task, keywords}) => {
        const guidance = await generateGuidance(task, keywords)
        return {
            content: [{type: 'text', text: guidance}]
        }
    }
}
