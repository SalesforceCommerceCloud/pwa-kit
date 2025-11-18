/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {z} from 'zod'
import {loadHooksCatalog} from '../utils/data'

const systemPromptForHooksRecommendation = `please enter a list of hooks to include or a use case description.
If you would like to recommend hooks for a use case, please enter the use case.
If you want to get implementation details for specific hooks, please provide the hook names.`

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
 * Get selected hooks from the catalog with implementation instructions.
 * @param {string[]} selectedHooks - Array of string hook names selected by user.
 * @returns {Promise<string>}
 */
export async function getSelectedHooks(selectedHooks) {
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

        // Build response with instructions and hook details
        let response = `## ⚠️ CRITICAL: Hooks Integration Instructions\n\n`
        response += `You are about to integrate the following hooks into your page or component. Follow these rules strictly:\n\n`
        response += `### MANDATORY RULES:\n`
        response += `1. **Follow the code snippets/examples EXACTLY as provided** - Do not modify the structure or logic\n`
        response += `2. **DO NOT modify import paths** - Use the import statements exactly as shown in the snippets\n`
        response += `3. **Preserve hook usage patterns** - Copy the hook calls from the snippets\n`
        response += `4. **Keep the same hook structure** - Do not rename or restructure the hook implementations\n`
        response += `5. **Maintain the coding style** - Follow the patterns shown in the examples\n\n`
        response += `### Selected Hooks:\n\n`

        // Add each hook with full details
        response += `\`\`\`json\n${JSON.stringify(selectedHookData, null, 2)}\n\`\`\`\n\n`

        response += `---\n\n`
        response += `**REMINDER**: When integrating these hooks:\n`
        response += `- Copy import statements EXACTLY as shown\n`
        response += `- Follow the usage examples in the snippets closely\n`
        response += `- Do not modify hook names or parameters\n`
        response += `- Maintain the same import paths without changes\n`

        return response
    } catch (error) {
        throw new Error(`Failed to get selected hooks: ${error.message}`)
    }
}
class HooksRecommendationTool {
    constructor() {
        this.name = 'pwakit_recommend_hooks'
        this.description = `Recommend React hooks from the available hooks catalog, or get detailed implementation information for specific hooks.

When called WITHOUT selectedHooks: Recommends hooks based on a use case description.
When called WITH selectedHooks: Returns full JSON details (including code snippets) for those specific hooks with strict integration instructions.`
        this.inputSchema = {
            useCase: z
                .string()
                .optional()
                .describe(
                    'The use case description for which to recommend hooks (e.g., "fetch product data", "manage shopping cart", "handle user authentication"). Use this when you need recommendations.'
                ),
            selectedHooks: z
                .array(z.string())
                .optional()
                .describe(
                    'Array of hook names to get implementation details for (e.g., ["useProduct", "useBasket"]). Use this when you know which hooks you need and want their full implementation details including code snippets.'
                )
        }
    }

    async handler({useCase, selectedHooks}) {
        // If neither parameter is provided, return prompt
        if (!selectedHooks?.length && !useCase) {
            return {
                content: [{type: 'text', text: systemPromptForHooksRecommendation}]
            }
        }

        try {
            // If selectedHooks provided, return those hooks with instructions
            const result = selectedHooks?.length
                ? await getSelectedHooks(selectedHooks)
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
                        text: `Failed to process hooks request: ${error.message}`
                    }
                ]
            }
        }
    }
}

export default HooksRecommendationTool
