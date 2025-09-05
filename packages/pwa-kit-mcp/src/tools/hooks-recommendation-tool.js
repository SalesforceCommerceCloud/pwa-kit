/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * HooksRecommendationTool
 * ----------------------
 * This tool suggests hooks from commerce-sdk-react based on a given page/component name or use case.
 * It is designed to work in both monorepo and generated app environments, automatically locating the hooks directory.
 *
 * Usage:
 *   - Provide a page name, a list of component names, or a use case description.
 *   - Optionally, specify exact hook names to get code snippets for.
 *   - The tool will recommend relevant hooks.
 *
 * Main Features:
 *   - Intelligent tokenization and matching of page/component/use case names to available hooks.
 *   - Fallback to generic code snippets if no direct match is found.
 *   - Works with both TypeScript and JavaScript hook files.
 *
 * Example input:
 *   {
 *     pageName: 'CartPage',
 *     componentList: ['CartSummary', 'CartItems'],
 *     useCase: 'basket',
 *     selectedHooks: ['useBasket'],
 *     hooksPath: '/absolute/path/to/hooks'
 *   }
 */

import fs from 'fs/promises'
import path from 'path'

/**
 * Suggests hooks from commerce-sdk-react based on page/component name or use case.
 * @class HooksRecommendationTool
 */
export class HooksRecommendationTool {
    /**
     * Constructs the HooksRecommendationTool.
     */
    constructor() {
        this.name = 'recommend_hooks'
        this.description =
            'Suggest hooks from commerce-sdk-react based on page/components or a short use case.'
        this.inputSchema = {
            pageName: {
                type: 'string',
                description: 'Name of the page (PascalCase)'
            },
            componentList: {
                type: 'array',
                items: {type: 'string'},
                description: 'List of component names (PascalCase)'
            },
            useCase: {
                type: 'string',
                description:
                    'Optional: Describe the primary use case (e.g., "product detail", "basket", "customer profile")'
            },
            selectedHooks: {
                type: 'array',
                items: {type: 'string'},
                description:
                    'Optional: Exact hook name(s) to return code snippets for. If a hook is not found, a generic template snippet will be returned.'
            },
            hooksPath: {
                type: 'string',
                description: 'Absolute path to hooks directory (node_modules or monorepo)'
            }
        }
        this.handler = this.handler.bind(this)
    }

    /**
     * Main handler for recommending hooks and generating code snippets.
     * @param {Object} params - The input parameters.
     * @param {string} params.pageName - Name of the page (PascalCase).
     * @param {string[]} params.componentList - List of component names (PascalCase).
     * @param {string} params.useCase - Optional: primary use case description.
     * @param {string[]} params.selectedHooks - Optional: exact hook names to return code snippets for.
     * @param {string} params.hooksPath - Absolute path to hooks directory.
     * @returns {Promise<Object>} Assistant response with recommendations or code snippets.
     */
    async handler({pageName, componentList, useCase, hooksPath, selectedHooks}) {
        if (!hooksPath) {
            hooksPath = await this.findHooksPath()
        }

        // Verify hooks path exists
        if (!(await this.isValidHooksPath(hooksPath))) {
            return this.createResponse(`Could not access hooks directory at: ${hooksPath}`)
        }

        const records = await this.getAvailableHookRecords(hooksPath)
        if (!records.length) {
            return this.createResponse(`No hooks found in directory: ${hooksPath}`)
        }

        // Filter out generic/common components that don't help with hook recommendation
        const genericComponents = new Set([
            'header',
            'footer',
            'layout',
            'wrapper',
            'container',
            'box'
        ])
        const filteredComponents = (componentList || []).filter(
            (comp) => !genericComponents.has(comp.toLowerCase())
        )
        const names = [pageName, ...filteredComponents].filter(Boolean)
        const buildNoMatchesMessage = () =>
            '**No matching hooks found for the given context**\n' +
            [
                pageName ? `- pageName: ${pageName}` : '',
                Array.isArray(filteredComponents) && filteredComponents.length
                    ? `- components: ${filteredComponents.join(', ')}`
                    : '',
                useCase ? `- useCase: ${useCase}` : ''
            ]
                .filter(Boolean)
                .join('\n') +
            '\n\nYou can still get a working snippet by specifying the hook name(s). Re-run with `selectedHooks` (e.g., ["useTaxesFromBasket"]) or just reply with the hook name(s) and I will return generic snippets.'
        const nameTokens = this.tokenizeMany(names)
        const rankedByNames = this.rankHookRecordsByTokens(records, nameTokens)
        if (rankedByNames.length && rankedByNames[0].score > 0) {
            const top = rankedByNames.slice(0, 5)
            const md = this.buildHookRecommendationsPrompt(
                'Recommended hooks based on names',
                top,
                {pageName, componentList: filteredComponents, useCase}
            )
            return this.createResponse(md)
        }

        // If no hooks match the tokens, show a message and fallback hooks
        if (rankedByNames.length) {
            const tokensString = Array.from(nameTokens).join(', ')
            let md = `**No hooks found related to: ${tokensString || 'your input'}**\n\n`
            md += 'However, here are some other hooks you might want to consider:\n\n'
            const fallback = rankedByNames.slice(0, 5)
            md += fallback.map((r) => `- **${r.name}**`).join('\n')
            return this.createResponse(md)
        }

        // If user explicitly asked for hook(s), return which are found/missing (no code snippets)
        if (Array.isArray(selectedHooks) && selectedHooks.length) {
            const byName = new Map(records.map((r) => [r.name, r]))
            const found = []
            const missing = []
            for (const name of selectedHooks) {
                const rec = byName.get(name)
                if (rec) found.push(name)
                else missing.push(name)
            }
            let response = '**Selected Hooks Check**\n'
            if (found.length) {
                response += `Found: ${found.join(', ')}\n`
            }
            if (missing.length) {
                response += `Missing: ${missing.join(', ')}\n`
            }
            return this.createResponse(response.trim())
        }

        if (useCase && typeof useCase === 'string') {
            const ucTokens = this.tokenize(useCase)
            const rankedByUseCase = this.rankHookRecordsByTokens(records, ucTokens)
            if (rankedByUseCase.length && rankedByUseCase[0].score > 0) {
                const md = this.buildHookRecommendationsPrompt(
                    'Recommended hooks based on use case',
                    rankedByUseCase.slice(0, 5),
                    {pageName, componentList: filteredComponents, useCase}
                )
                return this.createResponse(md)
            }
            return this.createResponse(buildNoMatchesMessage())
        }

        return this.createResponse(buildNoMatchesMessage())
    }

    /**
     * Scans the hooks directory and returns available hook records.
     * @param {string} hooksPath - Absolute path to hooks directory.
     * @returns {Promise<Array<{name: string, source: string}>>} List of hook records.
     */
    async getAvailableHookRecords(hooksPath) {
        try {
            const records = []

            // Add any file that starts with 'use' and ends with .ts/.js (skip .d.ts/.d.tsx)
            const dirContents = await fs.readdir(hooksPath, {withFileTypes: true})

            // First pass: collect top-level hooks
            for (const entry of dirContents) {
                if (
                    !entry.isDirectory() &&
                    /^use[A-Z].*\.(t|j)sx?$/.test(entry.name) &&
                    !/\.d\.(t|j)sx?$/.test(entry.name)
                ) {
                    const hookName = entry.name.replace(/\.(t|j)sx?$/, '')
                    records.push({
                        name: hookName,
                        source: path.join(hooksPath, entry.name)
                    })
                }
            }

            // Second pass: check Shopper* directories
            for (const entry of dirContents) {
                if (entry.isDirectory() && entry.name.startsWith('Shopper')) {
                    const dirPath = path.join(hooksPath, entry.name)
                    const subFiles = await fs.readdir(dirPath)

                    // Look for query.js and mutation.js
                    for (const file of subFiles) {
                        if (/^(query|mutation)\.(t|j)sx?$/.test(file)) {
                            try {
                                const filePath = path.join(dirPath, file)
                                const content = await fs.readFile(filePath, 'utf8')
                                const hookNames = this.extractHookNames(content)
                                for (const hookName of hookNames) {
                                    records.push({
                                        name: hookName,
                                        source: filePath
                                    })
                                }
                            } catch (error) {
                                // ignore file-level read errors
                            }
                        }
                    }
                }
            }

            // De-duplicate
            const unique = new Map()
            for (const r of records) {
                unique.set(r.name, r)
            }
            const finalRecords = [...unique.values()]
            return finalRecords
        } catch (error) {
            return []
        }
    }

    /**
     * Tokenizes a list of names into a set of tokens for matching.
     * @param {string[]} names - List of names to tokenize.
     * @returns {Set<string>} Set of tokens.
     */
    tokenizeMany(names) {
        const tokens = new Set()
        for (const n of names) {
            for (const t of this.tokenize(n)) tokens.add(t)
        }
        return tokens
    }

    /**
     * Tokenizes a single value into an array of tokens for matching.
     * @param {string} value - The value to tokenize.
     * @returns {string[]} Array of tokens.
     */
    tokenize(value) {
        if (!value) return []
        const stopwords = new Set(['page', 'component', 'view', 'screen', 'details', 'new'])

        // Completely dynamic word boundary detection
        let processed = value
            // Split standard camelCase (lowercase to uppercase)
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            // Split letter-to-number and number-to-letter boundaries
            .replace(/([a-z])([0-9])/g, '$1 $2')
            .replace(/([0-9])([a-z])/g, '$1 $2')

        // Dynamic compound word splitting - look for any word followed by stopwords
        const stopwordPattern = new RegExp(`(\\w+)(${Array.from(stopwords).join('|')})`, 'gi')
        processed = processed.replace(stopwordPattern, '$1 $2')
        // Additional dynamic splitting: look for likely compound patterns
        // Split very long words that might be compounds (>12 chars) at vowel boundaries
        processed = processed.replace(/\b([a-z]{6,})([a-z]{6,})\b/g, (match, p1, p2) => {
            // Only split if it's very long and has clear vowel/consonant patterns indicating separate words
            if (match.length > 12) {
                // Look for natural word boundaries (vowel-consonant or consonant-vowel transitions)
                const vowelConsonantEnd = /[aeiou][bcdfghjklmnpqrstvwxyz]*$/.test(p1)
                const consonantVowelStart = /^[bcdfghjklmnpqrstvwxyz]*[aeiou]/.test(p2)
                const naturalBoundary = vowelConsonantEnd && consonantVowelStart

                if (naturalBoundary) {
                    return `${p1} ${p2}`
                }
            }
            return match
        })

        const raw = processed
            .replace(/[^a-zA-Z]+/g, ' ')
            .toLowerCase()
            .split(' ')
            .filter((t) => t && !stopwords.has(t))

        // Add simple singular forms to improve matching (e.g., taxes -> tax)
        const tokens = new Set()
        for (const t of raw) {
            tokens.add(t)
            if (t.endsWith('es')) tokens.add(t.slice(0, -2))
            else if (t.endsWith('s')) tokens.add(t.slice(0, -1))
        }
        return Array.from(tokens)
    }

    isRelevantToPageName(hook, nameTokens) {
        // Purely dynamic tie-breaker: Jaccard-like overlap (no hardcoded domain terms)
        const hookTokens = new Set([
            ...hook.hookParts.map((p) => p.toLowerCase()),
            ...hook.pathParts.map((p) => p.toLowerCase())
        ])
        const nameTokenSet = new Set([...nameTokens].map((t) => t.toLowerCase()))
        let intersection = 0
        for (const t of hookTokens) if (nameTokenSet.has(t)) intersection += 1
        const union = new Set([...hookTokens, ...nameTokenSet]).size || 1
        return intersection / union
    }

    /**
     * Ranks hook records by overlap with provided tokens.
     * @param {Array<{name: string, source: string}>} records - Hook records.
     * @param {Set<string>} nameTokens - Tokens to match against.
     * @returns {Array<Object>} Ranked hook records with scores.
     */
    rankHookRecordsByTokens(records, nameTokens) {
        const nameTokenArray = Array.from(nameTokens)
        const results = []
        for (const r of records) {
            const hookNameParts = this.tokenize(r.name.replace(/^use/, ''))
            const pathParts = this.tokenize(r.source)
            let score = 0

            score += this.countOverlap(nameTokens, hookNameParts) * 2
            score += this.countOverlap(nameTokens, pathParts)

            results.push({
                name: r.name,
                source: r.source,
                score,
                hookParts: hookNameParts,
                pathParts: pathParts
            })
        }

        results.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score
            const aRelevance = this.isRelevantToPageName(a, nameTokenArray)
            const bRelevance = this.isRelevantToPageName(b, nameTokenArray)
            if (aRelevance !== bRelevance) return bRelevance - aRelevance
            return a.name.localeCompare(b.name)
        })

        return results
    }

    countOverlap(aTokens, bTokens) {
        const aSet = aTokens instanceof Set ? aTokens : new Set(aTokens)
        const bSet = bTokens instanceof Set ? bTokens : new Set(bTokens)
        let count = 0
        for (const t of bSet) if (aSet.has(t)) count += 1
        return count
    }

    buildHookRecommendationsPrompt(title, rankedRecords, context) {
        const lines = [`**${title}**`]
        const ctx = []
        if (context.pageName) ctx.push(`- pageName: ${context.pageName}`)
        if (Array.isArray(context.componentList) && context.componentList.length) {
            ctx.push(`- components: ${context.componentList.join(', ')}`)
        }
        if (context.useCase) ctx.push(`- useCase: ${context.useCase}`)
        if (ctx.length) lines.push(ctx.join('\n'))

        lines.push('')
        lines.push(`Found ${rankedRecords.length} recommended hook(s):`)
        lines.push('')

        for (const record of rankedRecords) {
            lines.push(`- **${record.name}**`)
        }

        lines.push('')
        return lines.join('\n')
    }

    // Helper methods
    extractHookNames(content) {
        const patterns = [
            /export\s+const\s+(use[A-Z]\w*)/g,
            /export\s*{[^}]*?(use[A-Z]\w*)[^}]*?}/g,
            /export\s+function\s+(use[A-Z]\w*)/g,
            /const\s+(use[A-Z]\w*)\s*=/g
        ]

        const hookNames = new Set()
        for (const pattern of patterns) {
            let match
            while ((match = pattern.exec(content))) {
                const hookName = match[1]
                    .replace(/^(export\s+)?(const\s+|function\s+)?/, '')
                    .replace(/[{}=\s].*$/, '')
                    .replace(/\.d$/, '')
                    .trim()
                if (/^use[A-Z]/.test(hookName)) {
                    hookNames.add(hookName)
                }
            }
        }
        return Array.from(hookNames)
    }

    /**
     * Attempts to find the hooks directory path in various environments.
     * @returns {Promise<string|null>} Absolute path to hooks directory, or null if not found.
     */
    async findHooksPath() {
        const candidates = [
            // 1. Monorepo path
            path.resolve(process.cwd(), 'packages/commerce-sdk-react/src/hooks'),
            // 2. From PWA_STOREFRONT_APP_PATH env
            ...(process.env.PWA_STOREFRONT_APP_PATH ? [this.getPathFromEnv()] : []),
            // 3. Current project node_modules
            this.getProjectNodeModulesPath(),
            // 4. Walk up directory tree
            ...(await this.walkUpForNodeModules())
        ].filter(Boolean)

        for (const candidate of candidates) {
            if (await this.isValidHooksPath(candidate)) {
                return candidate
            }
        }
        return null
    }

    getPathFromEnv() {
        const appPath = process.env.PWA_STOREFRONT_APP_PATH
        if (!appPath) return null

        const isOverridesApp = /\boverrides\/(app|app\/)?.*$/i.test(appPath)
        const appRoot = isOverridesApp ? path.resolve(appPath, '..', '..') : appPath
        return path.resolve(appRoot, 'node_modules/@salesforce/commerce-sdk-react/hooks')
    }

    getProjectNodeModulesPath() {
        const cwd = process.cwd()
        const projectRoot = cwd.includes('overrides/app') ? path.resolve(cwd, '..', '..') : cwd
        return path.resolve(projectRoot, 'node_modules/@salesforce/commerce-sdk-react/hooks')
    }

    async walkUpForNodeModules() {
        const paths = []
        let current = process.cwd()
        const limit = 6

        for (let i = 0; i < limit && current !== path.dirname(current); i++) {
            paths.push(path.join(current, 'node_modules/@salesforce/commerce-sdk-react/hooks'))
            current = path.dirname(current)
        }
        return paths
    }

    async isValidHooksPath(hooksPath) {
        if (!hooksPath) return false
        try {
            const stat = await fs.stat(hooksPath)
            return stat.isDirectory()
        } catch {
            return false
        }
    }

    createResponse(text) {
        return {
            role: 'assistant',
            content: [{type: 'text', text}]
        }
    }
}

const hooksRecommendationTool = new HooksRecommendationTool()
export default hooksRecommendationTool
