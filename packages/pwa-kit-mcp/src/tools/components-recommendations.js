/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fs from 'fs/promises'
import {z} from 'zod'
import {loadComponentsCatalog} from '../utils/data'
import {
    systemPromptForFileGeneration,
    systemPromptForOrderedFileChanges,
    SYSTEM_PROMPT_FOR_LINT_INSTRUCTIONS
} from '../utils/constants'

const systemPromptForComponentsRecommendation = `please enter a page path and list of components to include in the page.
If you would like to recommend components for a use case, please enter the use case.`

const systemPromptForComponentsIntegration = `please enter the path to the page to update`

/**
 * Recommend components from the catalog based on a user-provided use case.
 * The tool outputs a prompt that tells the LLM to copy the snippet field exactly from the catalog, not to generate or modify code snippets.
 * @param {string} useCase - The use case description provided by the user.
 * @returns {Promise<string>}
 */
export async function recommendComponentsForUseCase(useCase) {
    try {
        const catalog = await loadComponentsCatalog()
        const recommendations = `
Given the following use case and component catalog, recommend the top 3 most relevant components (with summary and snippet) for this use case.
After the recommendations, ask the user: "Based on these component recommendations, which components would you like to include in your page? Please provide the component names separated by commas (e.g., 'ProductTile, Breadcrumb'), or type 'none' if you don't want to include any components."

Once the user provides their component selection, you must use the pwakit_recommend_components tool to update the page with the selected components.

For each recommended component, output:
- The component name (as a heading)
- The summary (copied exactly from the catalog)
- The code snippet (copied exactly from the catalog, inside a \`\`\`javascript code block)

Do not modify or generate new code snippets. Only use the snippet field from the catalog.

Use case: "${useCase}"

Component Catalog:
${JSON.stringify(catalog, null, 2)}
`
        return recommendations
    } catch (error) {
        throw new Error(`Failed to read component catalog: ${error.message}`)
    }
}

/**
 * Update a page file with selected components from the catalog.
 * @param {string} selectedComponents - Array of string component names selected by user.
 * @param {string} pagePath - Absolute path to the page file to update.
 * @returns {Promise<string>}
 */
export async function updatePageWithComponents(selectedComponents, pagePath) {
    try {
        const catalog = await loadComponentsCatalog()

        // Find components in catalog
        const selectedComponentData = []
        const missingComponents = []

        for (const componentName of selectedComponents) {
            const componentData = catalog.find((component) => component.name === componentName)
            if (componentData) {
                selectedComponentData.push(componentData)
            } else {
                missingComponents.push(componentName)
            }
        }

        if (missingComponents.length > 0) {
            throw new Error(
                `The following components were not found in the catalog: ${missingComponents.join(
                    ', '
                )}`
            )
        }

        // Read the current page file
        const pageContent = await fs.readFile(pagePath, 'utf8')

        // Extract imports and component usage from selected components
        const newImports = new Set()
        const componentUsages = []

        for (const componentData of selectedComponentData) {
            // Extract import statements from snippet
            const snippet = componentData.snippet
            const importMatches = snippet.match(/^import\s+.*?$/gm)

            if (importMatches) {
                importMatches.forEach((imp) => newImports.add(imp))
            }

            // Extract component usage example
            let usage = snippet.replace(/^import\s+.*?$/gm, '').trim()

            // Look for the JSX usage in the snippet
            const functionMatch = usage.match(/function\s+MyComponent\s*\(\)\s*{([\s\S]*?)}\s*$/m)
            if (functionMatch) {
                const functionBody = functionMatch[1].trim()
                // Try to find the return statement and extract everything after it
                const returnMatch = functionBody.match(/return\s*\(([\s\S]*)\)\s*$/m)
                if (returnMatch) {
                    usage = returnMatch[1].trim()
                } else {
                    // Try to find JSX without parentheses
                    const jsxMatch = functionBody.match(/return\s+([\s\S]*?)$/m)
                    if (jsxMatch) {
                        usage = jsxMatch[1].trim()
                    }
                }
            }

            if (usage) {
                componentUsages.push(`  {/* ${componentData.name}: ${componentData.summary} */}`)
                componentUsages.push(`  ${usage.split('\n').join('\n  ')}`)
            }
        }

        // Update the page content
        let updatedContent = pageContent

        // Add new imports after existing imports
        const importSection = Array.from(newImports).join('\n')
        if (importSection) {
            // Find the last import statement
            const lastImportMatch = [...updatedContent.matchAll(/^import\s+.*?$/gm)]
            if (lastImportMatch.length > 0) {
                const lastImport = lastImportMatch[lastImportMatch.length - 1]
                const insertPosition = lastImport.index + lastImport[0].length
                updatedContent =
                    updatedContent.slice(0, insertPosition) +
                    '\n' +
                    importSection +
                    updatedContent.slice(insertPosition)
            } else {
                // No existing imports, add at the top
                updatedContent = importSection + '\n\n' + updatedContent
            }
        }

        // Add component usages inside the component's return statement
        if (componentUsages.length > 0) {
            const componentCode = componentUsages.join('\n\n')

            // Find the return statement and add components after it
            let returnMatch = updatedContent.match(/return\s*\(/m)
            if (returnMatch) {
                const insertPosition = returnMatch.index + returnMatch[0].length
                updatedContent =
                    updatedContent.slice(0, insertPosition) +
                    '\n' +
                    componentCode +
                    '\n' +
                    updatedContent.slice(insertPosition)
            } else {
                // Try to find return without parentheses
                returnMatch = updatedContent.match(/return\s+</m)
                if (returnMatch) {
                    const insertPosition = returnMatch.index + returnMatch[0].length - 1 // -1 to keep the <
                    updatedContent =
                        updatedContent.slice(0, insertPosition) +
                        '\n' +
                        componentCode +
                        '\n  ' +
                        updatedContent.slice(insertPosition)
                }
            }
        }

        const messages = []
        messages.push(systemPromptForFileGeneration(pagePath, updatedContent))
        messages.push(SYSTEM_PROMPT_FOR_LINT_INSTRUCTIONS)
        return systemPromptForOrderedFileChanges(messages)
    } catch (error) {
        throw new Error(`Failed to update page with components: ${error.message}`)
    }
}

class ComponentsRecommendationTool {
    constructor() {
        this.name = 'pwakit_recommend_components'
        this.description = `Recommend and use React components from the out of the box components based on a specific use case.`
        this.inputSchema = {
            useCase: z
                .string()
                .optional()
                .describe(
                    'The use case description for which to recommend components (e.g., "display product information", "show breadcrumb navigation", "create checkout form").'
                ),
            selectedComponents: z
                .array(z.string())
                .optional()
                .describe(
                    'Comma-separated list of component names to include in the page (e.g., "ProductTile, Breadcrumb"), or "none" for no components.'
                ),
            pagePath: z.string().optional().describe('Absolute path to the page file to update.')
        }
    }

    async handler({useCase, selectedComponents, pagePath}) {
        if (!selectedComponents?.length && !useCase) {
            return {
                content: [{type: 'text', text: systemPromptForComponentsRecommendation}]
            }
        } else if (selectedComponents?.length && !pagePath) {
            return {
                content: [{type: 'text', text: systemPromptForComponentsIntegration}]
            }
        }

        try {
            const result = selectedComponents?.length
                ? await updatePageWithComponents(selectedComponents, pagePath)
                : await recommendComponentsForUseCase(useCase)
            return {
                content: [
                    {
                        type: 'text',
                        text: result
                    }
                ]
            }
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Failed to recommend components: ${error.message}`
                    }
                ]
            }
        }
    }
}

export default ComponentsRecommendationTool
