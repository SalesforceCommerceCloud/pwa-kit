/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fs from 'fs/promises'
import path from 'path'

/**
 * Recommend hooks from the catalog based on a user-provided use case.
 * The tool outputs a prompt that tells the LLM to copy the snippet field exactly from the catalog, not to generate or modify code snippets.
 * @param {string} useCase - The use case description provided by the user.
 * @param {string} [catalogPath] - Optional absolute path to the hook catalog JSON file.
 * @returns {Promise<{recommendations: string}|{error: string}>}
 */
export async function recommendHooksForUseCase(useCase, catalogPath) {
    try {
        const resolvedCatalogPath =
            catalogPath || path.resolve(__dirname, '../utils/hook-catalog.json')
        const catalogRaw = await fs.readFile(resolvedCatalogPath, 'utf8')
        const catalog = JSON.parse(catalogRaw)
        const recommendations = `
Given the following use case and hook catalog, recommend the top 3 most relevant hooks (with summary and snippet) for this use case.

For each recommended hook, output:
- The hook name (as a heading)
- The summary (copied exactly from the catalog)
- The code snippet (copied exactly from the catalog, inside a \`\`\`js code block)

Do not modify or generate new code snippets. Only use the snippet field from the catalog.

Use case: "${useCase}"

Hook Catalog:
${JSON.stringify(catalog, null, 2)}
`
        return {recommendations}
    } catch (error) {
        return {error: `Failed to read hook catalog: ${error.message}`}
    }
}
