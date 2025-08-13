/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {z} from 'zod'
import fs from 'fs/promises'
import path from 'path'

function getDescribePath(nodeModulesPath) {
    return path.join(nodeModulesPath, 'commerce-sdk-isomorphic/lib/index.cjs.d.ts')
}

function extractAllClassNames(fileContent) {
    // Match all lines like: declare class ShopperProducts<...> { or declare class ShopperProducts {
    // Allow for whitespace, generics, and comments
    const classRegex = /^declare class (\w+)(?:<[^>]+>)?\s*{/gm
    const classNames = []
    let match
    while ((match = classRegex.exec(fileContent))) {
        classNames.push(match[1])
    }
    return classNames
}

function extractClassDocs(fileContent, className) {
    // Find the class block, allowing for generics, whitespace, and comments (multi-line)
    const classRegex = new RegExp(
        `declare class ${className}(?:<([\s\S]*?)>)?[\s\S]*?{([\s\S]*?)^}`,
        'm'
    )
    const classMatch = fileContent.match(classRegex)
    if (!classMatch) {
        // Debug output: show context around the className and the regex
        const idx = fileContent.indexOf(className)
        const context =
            idx !== -1
                ? fileContent.slice(Math.max(0, idx - 500), idx + 500)
                : 'Class name not found in file.'
        return {
            error: `${className} class not found.\nRegex used: ${classRegex}\nContext around className:\n${context}`
        }
    }
    const classBody = classMatch[2]
    // Find all methods with JSDoc
    const methodRegex = /\*\*([\s\S]*?)\*\/\s+(\w+)\s*\(([^)]*)\)/g
    const docs = {}
    let match
    while ((match = methodRegex.exec(classBody))) {
        const jsdoc = match[1]
        const methodName = match[2]
        // Extract description (first non-@ line)
        const descMatch = jsdoc.match(/\*\s*([^@\n]+)/)
        const description = descMatch ? descMatch[1].trim() : ''
        // Extract @param lines
        const paramLines = [...jsdoc.matchAll(/@param ([^\n]+)/g)].map((m) => m[1].trim())
        // Extract @returns
        const returnsMatch = jsdoc.match(/@returns ([^\n]+)/)
        const returns = returnsMatch ? returnsMatch[1].trim() : ''
        // Extract @example (if present)
        const exampleMatch = jsdoc.match(/@example ([\s\S]*?)(?=\n\s*\*@|\n\s*\*\/)/)
        const example = exampleMatch ? exampleMatch[1].replace(/^\s*\*\s?/gm, '').trim() : ''
        docs[methodName] = {
            description,
            params: paramLines,
            returns,
            example
        }
    }
    return docs
}

const systemPrompt = (className, endpointDocs) => {
    const endpointList = Object.keys(endpointDocs)
        .map((ep, i) => `${i + 1}. ${ep} - ${endpointDocs[ep]?.description || ''}`)
        .join('\n')
    return `You are a documentation assistant for the Salesforce Commerce Cloud ${className} API.\n\nAvailable endpoints:\n${endpointList}\n\nPlease reply with the endpoint you want to explore (e.g., getProducts).`
}

const classListPrompt = (classNames) => {
    return `Available Commerce API classes:\n${classNames
        .map((c, i) => `${i + 1}. ${c}`)
        .join('\n')}\n\nPlease reply with the class you want to explore.`
}

class ExploreCommerceAPITool {
    constructor() {
        this.name = 'explore_commerce_api'
        this.description =
            'Explore and document any commerce-sdk-isomorphic class API endpoints, parameters, and usage examples. Reads from the commerce-sdk-isomorphic type definitions.'
        this.inputSchema = {
            className: z
                .string()
                .optional()
                .describe(
                    'The class to explore (e.g., ShopperProducts). If not provided, lists all available classes.'
                ),
            endpoint: z
                .string()
                .optional()
                .describe(
                    'The endpoint to explore (e.g., getProducts). Leave blank to list all endpoints.'
                ),
            nodeModulesPath: z
                .string()
                .optional()
                .describe('The absolute path to the node_modules directory.'),
            describePath: z
                .string()
                .optional()
                .describe(
                    'The absolute path to the commerce-sdk-isomorphic type definitions (index.cjs.d.ts).'
                )
        }
        this.handler = async (args) => {
            let describePath = args?.describePath
            if (!describePath) {
                const nodeModulesPath = args?.nodeModulesPath
                if (nodeModulesPath) {
                    describePath = getDescribePath(nodeModulesPath)
                }
            }
            if (!describePath) {
                return {
                    role: 'system',
                    content: [
                        {
                            type: 'text',
                            text: 'Please provide the absolute path to your node_modules directory (nodeModulesPath).'
                        }
                    ]
                }
            }
            let fileContent
            try {
                fileContent = await fs.readFile(describePath, 'utf-8')
            } catch (e) {
                return {
                    role: 'system',
                    content: [
                        {type: 'text', text: `Could not read file at ${describePath}: ${e.message}`}
                    ]
                }
            }
            // If className is not provided, list all available classes
            if (!args?.className) {
                const classNames = extractAllClassNames(fileContent)
                return {
                    role: 'system',
                    content: [{type: 'text', text: classListPrompt(classNames)}]
                }
            }
            const className = args.className
            const endpointDocs = extractClassDocs(fileContent, className)
            if (endpointDocs.error) {
                return {
                    role: 'system',
                    content: [{type: 'text', text: endpointDocs.error}]
                }
            }
            if (!args.endpoint) {
                return {
                    role: 'system',
                    content: [{type: 'text', text: systemPrompt(className, endpointDocs)}]
                }
            }
            const endpoint = args.endpoint
            const doc = endpointDocs[endpoint]
            if (!doc) {
                return {
                    role: 'system',
                    content: [
                        {
                            type: 'text',
                            text: `Unknown endpoint.\n\n${systemPrompt(className, endpointDocs)}`
                        }
                    ]
                }
            }
            return {
                role: 'system',
                content: [
                    {
                        type: 'text',
                        text: `Endpoint: ${endpoint}\nDescription: ${
                            doc.description
                        }\n\nParameters:\n${
                            doc.params.map((p) => `- ${p}`).join('\n') || 'None'
                        }\n\nReturns: ${doc.returns}\n\nExample usage:\n${
                            doc.example || '(none provided)'
                        }`
                    }
                ]
            }
        }
    }
}

export default ExploreCommerceAPITool
