/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fs from 'fs/promises'
import path from 'path'

/**
 * Converts markdown to JSON format for sample data.
 *
 * @description
 * The input markdown file only supports level 3 sections (3 #) and fenced code blocks (3 backticks).
 * - Any text before the first section is ignored including code blocks.
 * - It supports one code block per section.
 * - The code block programming language is ignored (text after the first 3 backticks up to the first new line).
 * - Any text after a code block is ignored.
 *
 * @param {string} markdown - The markdown content to convert
 *
 * @returns {Array<{name: string, summary: string, snippet: string}>} An array of objects with the following structure:
 * - `name`: section header
 * - `summary`: section text
 * - `snippet`: section code block
 *
 * @example
 * const markdown = `
 * ### Example Section
 * This is a summary
 * \`\`\`javascript
 * const code = 'example';
 * \`\`\`
 * `;
 * const result = hooksCatalogAsJson(markdown);
 * // Returns: [{ name: 'Example Section', summary: 'This is a summary', snippet: "const code = 'example';" }]
 */
export function hooksCatalogAsJson(markdown) {
    const sections = markdown.split('### ').slice(1)
    return sections.map((section) => {
        const [beforeCode, codeBlock] = section.split('```')

        // Extract name (first line) and summary (rest) from before code
        const firstNewline = beforeCode.indexOf('\n')
        const name = beforeCode.substring(0, firstNewline).trim()
        const summary = beforeCode.substring(firstNewline + 1).trim()

        // Extract snippet from code block (skip first line which is the language)
        let snippet = ''
        if (codeBlock) {
            const codeFirstNewline = codeBlock.indexOf('\n')
            snippet = codeBlock.substring(codeFirstNewline + 1).trim()
        }

        return {name, summary, snippet}
    })
}

/**
 * Load the hook catalog from the given path or the default path.
 * @returns {Promise<Array<{name: string, summary: string, snippet: string}>>}
 */
export async function loadHooksCatalog() {
    const resolvedCatalogPath = path.resolve(__dirname, '../data/hook-catalog.md')
    const catalogRaw = await fs.readFile(resolvedCatalogPath, 'utf8')
    return hooksCatalogAsJson(catalogRaw)
}
