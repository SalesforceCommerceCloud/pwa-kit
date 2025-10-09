/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fs from 'fs/promises'
import {z} from 'zod'
import {loadHooksCatalog} from '../utils/data'
import {
    systemPromptForFileGeneration,
    systemPromptForOrderedFileChanges,
    SYSTEM_PROMPT_FOR_LINT_INSTRUCTIONS
} from '../utils/constants'

const systemPromptForHooksRecommendation = `please enter a page path and list of hooks to include in the page.
If you would like to recommend hooks for a use case, please enter the use case.`

const systemPromptForHooksIntegration = `please enter the path to the page to update`

/**
 * Recommend hooks from the catalog based on a user-provided use case.
 * The tool outputs a prompt that tells the LLM to copy the snippet field exactly from the catalog, not to generate or modify code snippets.
 * @param {string} useCase - The use case description provided by the user.
 * @returns {Promise<string>}
 */
export async function recommendHooksForUseCase(useCase) {
    try {
        const catalog = await loadHooksCatalog()
        const recommendations = `
Given the following use case and hook catalog, recommend the top 3 most relevant hooks (with summary and snippet) for this use case.
After the recommendations, ask the user: "Based on these hook recommendations, which hooks would you like to include in your page? Please provide the hook names separated by commas (e.g., 'useProduct, useBasket'), or type 'none' if you don't want to include any hooks."

Once the user provides their hook selection, you must use the pwakit_recommend_hooks tool to update the page with the selected hooks.

For each recommended hook, output:
- The hook name (as a heading)
- The summary (copied exactly from the catalog)
- The code snippet (copied exactly from the catalog, inside a \`\`\`js code block)

Do not modify or generate new code snippets. Only use the snippet field from the catalog.

Use case: "${useCase}"

Hook Catalog:
${JSON.stringify(catalog, null, 2)}
`
        return recommendations
    } catch (error) {
        throw new Error(`Failed to read hook catalog: ${error.message}`)
    }
}

/**
 * Update a page file with selected hooks from the catalog.
 * @param {string} selectedHooks - Array of string hook names selected by user.
 * @param {string} pagePath - Absolute path to the page file to update.
 * @returns {Promise<string>}
 */
export async function updatePageWithHooks(selectedHooks, pagePath) {
    try {
        const catalog = await loadHooksCatalog()

        // Find hooks in catalog
        const selectedHookData = []
        const missingHooks = []

        for (const hookName of selectedHooks) {
            const hookData = catalog.find((hook) => hook.name === hookName)
            if (hookData) {
                selectedHookData.push(hookData)
            } else {
                missingHooks.push(hookName)
            }
        }

        if (missingHooks.length > 0) {
            throw new Error(
                `The following hooks were not found in the catalog: ${missingHooks.join(', ')}`
            )
        }

        // Read the current page file
        const pageContent = await fs.readFile(pagePath, 'utf8')

        // Extract imports and hook code from selected hooks
        const newImports = new Set()
        const hookImplementations = []

        for (const hookData of selectedHookData) {
            // Extract import statements from snippet
            const snippet = hookData.snippet
            const importMatches = snippet.match(/\/\/ Imports:.*?\n/g)

            if (importMatches) {
                importMatches.forEach((importMatch) => {
                    // Parse the import comment format: // Imports: {hook} from 'module'; {hook2} from 'react'
                    const importStr = importMatch.replace('// Imports: ', '').replace('\n', '')
                    const imports = importStr
                        .split(';')
                        .map((imp) => imp.trim())
                        .filter((imp) => imp)
                    imports.forEach((imp) => {
                        if (imp) {
                            newImports.add(`import ${imp}`)
                        }
                    })
                })
            } else {
                // Look for standard import statements in the snippet
                const standardImports = snippet.match(/^import\s+.*?$/gm)
                if (standardImports) {
                    standardImports.forEach((imp) => newImports.add(imp))
                }
            }

            // Extract hook implementation (everything after imports and comments)
            let implementation = snippet
                .replace(/\/\/ Imports:.*?\n/g, '')
                .replace(/^import\s+.*?$/gm, '')
                .trim()

            // Exclude everything after the first "Example:" comment
            const returnIndex = implementation.indexOf('// Example:')
            if (returnIndex !== -1) {
                implementation = implementation.substring(0, returnIndex).trim()
            }

            if (implementation) {
                hookImplementations.push(`  // ${hookData.name}: ${hookData.summary}`)
                hookImplementations.push(`  ${implementation.split('\n').join('\n  ')}`)
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
                // No existing imports, add at the top after the first import
                const firstImportIndex = updatedContent.indexOf('import')
                if (firstImportIndex !== -1) {
                    const lineEnd = updatedContent.indexOf('\n', firstImportIndex)
                    updatedContent =
                        updatedContent.slice(0, lineEnd) +
                        '\n' +
                        importSection +
                        updatedContent.slice(lineEnd)
                }
            }
        }

        // Add hook implementations inside the component function
        if (hookImplementations.length > 0) {
            const hookCode = hookImplementations.join('\n\n')

            // Find the component function and add hooks after the opening brace
            const componentMatch = updatedContent.match(/const\s+\w+\s*=\s*\(\)\s*=>\s*{/)
            if (componentMatch) {
                const insertPosition = componentMatch.index + componentMatch[0].length
                updatedContent =
                    updatedContent.slice(0, insertPosition) +
                    '\n' +
                    hookCode +
                    '\n' +
                    updatedContent.slice(insertPosition)
            }
        }

        const messages = []
        messages.push(systemPromptForFileGeneration(pagePath, updatedContent))
        messages.push(SYSTEM_PROMPT_FOR_LINT_INSTRUCTIONS)
        return systemPromptForOrderedFileChanges(messages)
    } catch (error) {
        throw new Error(`Failed to update page with hooks: ${error.message}`)
    }
}
class HooksRecommendationTool {
    constructor() {
        this.name = 'pwakit_recommend_hooks'
        this.description = `Recommend and use React hooks from the out of the box hooks based on a specific use case.`
        this.inputSchema = {
            useCase: z
                .string()
                .optional()
                .describe(
                    'The use case description for which to recommend hooks (e.g., "fetch product data", "manage shopping cart", "handle user authentication").'
                ),
            selectedHooks: z
                .array(z.string())
                .optional()
                .describe(
                    'Comma-separated list of hook names to include in the page (e.g., "useProduct, useBasket"), or "none" for no hooks.'
                ),
            pagePath: z.string().optional().describe('Absolute path to the page file to update.')
        }
    }

    async handler({useCase, selectedHooks, pagePath}) {
        if (!selectedHooks?.length && !useCase) {
            return {
                content: [{type: 'text', text: systemPromptForHooksRecommendation}]
            }
        } else if (selectedHooks?.length && !pagePath) {
            return {
                content: [{type: 'text', text: systemPromptForHooksIntegration}]
            }
        }

        try {
            const result = selectedHooks?.length
                ? await updatePageWithHooks(selectedHooks, pagePath)
                : await recommendHooksForUseCase(useCase)
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
                        text: `Failed to recommend hooks: ${error.message}`
                    }
                ]
            }
        }
    }
}

export default HooksRecommendationTool
