/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import fs from 'fs/promises'
import path from 'path'

/**
 * Suggest hooks from commerce-sdk-react based on page/component name or use case.
 * - If in generated app: node_modules/@salesforce/commerce-sdk-react/hooks
 * - If in monorepo: packages/commerce-sdk-react/src/hooks
 */
export class HooksRecommendationTool {
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

    async handler({pageName, componentList, useCase, hooksPath, selectedHooks}) {
        if (!hooksPath) {
            hooksPath = await this.findHooksPath()
        }

        // Verify hooks path exists
        if (!(await this.isValidHooksPath(hooksPath))) {
            if (Array.isArray(selectedHooks) && selectedHooks.length) {
                const md = this.buildGenericSnippetsMarkdown(
                    'Code snippets (generic)',
                    selectedHooks
                )
                return this.createResponse(md)
            }
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

        // If user explicitly asked for hook(s), return snippets for those (fallback to generic when missing)
        if (Array.isArray(selectedHooks) && selectedHooks.length) {
            const byName = new Map(records.map((r) => [r.name, r]))
            const found = []
            const missing = []
            for (const name of selectedHooks) {
                const rec = byName.get(name)
                if (rec) found.push(rec)
                else missing.push(name)
            }
            const sections = []
            if (found.length) {
                const items = await this.buildRecommendations(found)
                sections.push(this.formatRecommendationsSections(items))
            }
            if (missing.length) {
                sections.push(
                    this.buildGenericSnippetsMarkdown('Generic examples for missing hooks', missing)
                )
            }
            return this.createResponse(sections.filter(Boolean).join('\n\n'))
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

    tokenizeMany(names) {
        const tokens = new Set()
        for (const n of names) {
            for (const t of this.tokenize(n)) tokens.add(t)
        }
        return tokens
    }

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

    async buildRecommendations(rankedRecords) {
        const items = []
        for (const r of rankedRecords) {
            const exampleCode =
                (await this.tryExtractExampleFromSource(r)) ||
                (await this.buildDynamicExampleFromSource(r)) ||
                this.genericExample(r)
            items.push({name: r.name, exampleCode})
        }
        return items
    }

    async tryExtractExampleFromSource(record) {
        try {
            const fs = await import('fs/promises')
            const content = await fs.readFile(record.source, 'utf8')
            const hookName = record.name
            // Simple best-effort: look for an @example JSDoc block near the hook name
            const jsdocExampleRegex = /\*\*([\s\S]*?)\*\//g
            let match
            while ((match = jsdocExampleRegex.exec(content))) {
                const block = match[1]
                if (
                    /@example/.test(block) &&
                    new RegExp(hookName).test(content.slice(match.index))
                ) {
                    // Extract lines that look like code
                    const lines = block
                        .split('\n')
                        .map((l) => l.replace(/^\s*\* ?/, ''))
                        .filter((l) => l.trim())
                    return lines.join('\n')
                }
            }
        } catch (_) {
            // ignore
        }
        return null
    }

    formatGenericExample(hookName, {isMutation = false} = {}) {
        const header = `import React from "react"\nimport { ${hookName} } from '@salesforce/commerce-sdk-react'\n\n`
        if (isMutation) {
            return (
                header +
                `const ExampleComponent = () => {\n    const mutation = ${hookName}()\n    return (<button onClick={() => mutation.mutateAsync({/* variables */})} disabled={mutation.isLoading}>{mutation.isLoading ? 'Loading…' : 'Submit'}</button>)\n}`
            )
        }
        return (
            header +
            `const ExampleComponent = () => {\n    const {data, isLoading, error} = ${hookName}({ parameters: {/* required params */} })\n    if (isLoading) return <div>Loading…</div>\n    if (error) return <div>Error: {error.message}</div>\n    return <pre>{JSON.stringify(data, null, 2)}</pre>\n}`
        )
    }

    genericExample(record) {
        const isMutation = /\/(mutation)\.(t|j)sx?$/.test(record.source)
        return this.generateCodeSnippet(record.name, {isMutation})
    }

    async buildDynamicExampleFromSource(record) {
        const hookName = record.name
        let fileContent = ''
        try {
            fileContent = await fs.readFile(record.source, 'utf8')
        } catch (_) {
            // ignore
        }
        const header = `import React from "react"\nimport { ${hookName} } from '@salesforce/commerce-sdk-react'\n\n`
        const isMutation = /\/(mutation)\.(t|j)sx?$/.test(record.source)
        // Try to detect if the hook takes no arguments
        let takesNoArgs = false
        try {
            const declRegex = new RegExp(
                `export\\s+(?:const|function)\\s+${hookName}\\s*=?\\s*\\(([^)]*)\\)`
            )
            const match = fileContent.match(declRegex)
            if (match) {
                const paramsInside = (match[1] || '').trim()
                takesNoArgs = paramsInside.length === 0
            }
        } catch (_) {
            // ignore
        }
        if (isMutation) {
            return (
                header +
                `const ExampleComponent = () => {\n    const mutation = ${hookName}()\n    return (<button onClick={() => mutation.mutateAsync({/* variables */})} disabled={mutation.isLoading}>{mutation.isLoading ? 'Loading…' : 'Submit'}</button>)\n}`
            )
        }
        if (takesNoArgs) {
            return (
                header +
                `const ExampleComponent = () => {\n    const {data, isLoading, error} = ${hookName}()\n    if (isLoading) return <div>Loading…</div>\n    if (error) return <div>Error: {error.message}</div>\n    return <pre>{JSON.stringify(data, null, 2)}</pre>\n}`
            )
        }
        return (
            header +
            `const ExampleComponent = () => {\n    const {data, isLoading, error} = ${hookName}({ parameters: {/* required params */} })\n    if (isLoading) return <div>Loading…</div>\n    if (error) return <div>Error: {error.message}</div>\n    return <pre>{JSON.stringify(data, null, 2)}</pre>\n}`
        )
    }

    formatRecommendationsSections(items) {
        const parts = []
        for (const item of items) {
            parts.push(`- ${item.name}\n\n\`\`\`\n${item.exampleCode}\n\`\`\``)
        }
        return parts.join('\n\n')
    }

    buildGenericSnippetsMarkdown(title, hookNames) {
        const lines = [`**${title}**`, '', `Found ${hookNames.length} hook(s):`]
        for (const name of hookNames) {
            lines.push(`- ${name}`)
            lines.push('')
            lines.push('```')
            lines.push(this.formatGenericExample(name))
            lines.push('```')
            lines.push('')
        }
        return lines.join('\n')
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
        lines.push(
            '**Please let me know which hook you would like to see a sample code snippet for.**'
        )
        lines.push(
            'You can reply with the hook name (e.g., "useProduct") and I will generate a code example for you.'
        )

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
