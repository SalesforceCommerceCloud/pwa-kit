/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {z} from 'zod'
import fs from 'fs/promises'
import path from 'path'
import {autoDetectNodeModulesPath, autoDetectCommerceSDKTypesPath} from '../utils/index.js'

function getDescribePath(nodeModulesPath) {
    return path.join(nodeModulesPath, 'commerce-sdk-isomorphic/lib/index.cjs.d.ts')
}

function extractAllClassNames(fileContent) {
    // Match all lines like: declare class ShopperProducts<...> { or declare class ShopperProducts {
    // Allow for any amount of whitespace before 'declare'
    const classRegex = /\bdeclare class (\w+)(?:<[^{]+>)?\s*{/g
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
        `declare class ${className}(?:<(.+?)>)?.*?{(.*?)}\\s*(?:export|declare|$)`,
        'ms'
    )
    const classMatch = fileContent.match(classRegex)
    if (!classMatch) {
        return {
            error: `${className} class not found.`
        }
    }
    const classBody = classMatch[2]
    return extractMethodsFromClassBody(classBody, fileContent)
}

function extractMethodsFromClassBody(classBody, fileContent) {
    // Find all methods with JSDoc comments
    const methodRegex = /\/\*\*([\s\S]*?)\*\/\s*(\w+)\s*\(([^)]*)\):\s*([^;]+);?/g
    const docs = {}
    let match

    while ((match = methodRegex.exec(classBody))) {
        const jsdoc = match[1]
        const methodName = match[2]
        const parameters = match[3]
        const returnType = match[4]

        // Parse JSDoc
        const parsedJSDoc = parseJSDoc(jsdoc)

        // Parse TypeScript parameters
        const parameterStructure = parseTypeScriptParameters(parameters)

        // Parse return type
        const parsedReturnType = parseReturnType(returnType, fileContent)

        docs[methodName] = {
            ...parsedJSDoc,
            fullSignature: `${methodName}(${parameters}): ${returnType}`,
            parameterStructure,
            returnType: parsedReturnType
        }
    }
    return docs
}

function parseJSDoc(jsdoc) {
    // Extract description (first non-@ line)
    const descMatch = jsdoc.match(/\*\s*([^@\n*]+)/)
    const description = descMatch ? descMatch[1].trim() : ''

    // Extract @param lines
    const paramLines = [...jsdoc.matchAll(/@param\s+([^\n]+)/g)].map((m) => m[1].trim())

    // Extract @returns
    const returnsMatch = jsdoc.match(/@returns?\s+([^\n]+)/)
    const returns = returnsMatch ? returnsMatch[1].trim() : ''

    // Extract @example (if present)
    const exampleMatch = jsdoc.match(/@example\s+([\s\S]*?)(?=\n\s*\*@|\n\s*\*\/|$)/)
    const example = exampleMatch ? exampleMatch[1].replace(/^\s*\*\s?/gm, '').trim() : ''

    return {
        description,
        params: paramLines,
        returns,
        example
    }
}

function parseTypeScriptParameters(parametersString) {
    if (!parametersString.trim()) {
        return {parameters: {}, headers: {}}
    }

    // Handle the common pattern: options: { parameters?: {...}, headers?: {...} }
    const optionsMatch = parametersString.match(/options\s*:\s*{([^}]+)}/)
    if (optionsMatch) {
        return parseOptionsParameter(optionsMatch[1])
    }

    // For other parameter patterns, return basic structure
    return {
        raw: parametersString,
        parameters: {},
        headers: {}
    }
}

function parseOptionsParameter(optionsContent) {
    const result = {parameters: {}, headers: {}}

    // Extract parameters object
    const parametersMatch = optionsContent.match(/parameters\?\s*:\s*{([^}]+)}/)
    if (parametersMatch) {
        const paramContent = parametersMatch[1]
        const paramFields = paramContent.split(',').map((p) => p.trim())

        for (const field of paramFields) {
            const fieldMatch = field.match(/(\w+)\??\s*:\s*(.+)/)
            if (fieldMatch) {
                result.parameters[fieldMatch[1]] = fieldMatch[2].trim()
            }
        }
    }

    // Extract headers object
    const headersMatch = optionsContent.match(/headers\?\s*:\s*{([^}]+)}/)
    if (headersMatch) {
        const headerContent = headersMatch[1]
        const headerFields = headerContent.split(',').map((h) => h.trim())

        for (const field of headerFields) {
            const fieldMatch = field.match(/(\w+)\??\s*:\s*(.+)/)
            if (fieldMatch) {
                result.headers[fieldMatch[1]] = fieldMatch[2].trim()
            }
        }
    }

    return result
}

function parseReturnType(returnTypeString, fileContent) {
    let cleanType = returnTypeString.trim()

    // Handle Promise types
    const promiseMatch = cleanType.match(/Promise<(.+)>/)
    if (promiseMatch) {
        cleanType = promiseMatch[1]
    }

    const result = {
        type: returnTypeString.trim(),
        structure: {properties: []}
    }

    // Extract detailed structure for known Commerce SDK types
    result.structure = extractReturnTypeStructure(cleanType, fileContent)

    return result
}

function extractReturnTypeStructure(typeName, fileContent) {
    // Common Commerce SDK return types with their key properties
    const commonTypes = {
        Product: ['id', 'name', 'price', 'currency', 'imageGroups', 'variationAttributes'],
        ProductSearchResult: ['hits', 'query', 'total', 'count', 'searchPhraseSuggestions'],
        Basket: ['basketId', 'productItems', 'productSubTotal', 'productTotal', 'currency'],
        Customer: ['customerId', 'customerName', 'email', 'firstName', 'lastName'],
        Order: ['orderNo', 'orderToken', 'productItems', 'orderTotal', 'status'],
        Category: ['id', 'name', 'description', 'parentCategoryId', 'subCategories']
    }

    if (commonTypes[typeName]) {
        return {
            properties: commonTypes[typeName].map((prop) => ({name: prop, type: 'unknown'}))
        }
    }

    // Try to find interface/type definition in the file content
    const interfaceRegex = new RegExp(`interface\\s+${typeName}\\s*{([^}]+)}`, 'ms')
    const typeRegex = new RegExp(`type\\s+${typeName}\\s*=\\s*{([^}]+)}`, 'ms')

    const interfaceMatch = fileContent.match(interfaceRegex) || fileContent.match(typeRegex)
    if (interfaceMatch) {
        return parseInterfaceProperties(interfaceMatch[1])
    }

    return {properties: []}
}

function parseInterfaceProperties(interfaceBody) {
    if (!interfaceBody) {
        return {properties: []}
    }

    const properties = []
    const lines = interfaceBody.split('\n')

    for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*')) continue

        const propMatch = trimmed.match(/(\w+)\??\s*:\s*([^;,]+)/)
        if (propMatch) {
            properties.push({
                name: propMatch[1],
                type: propMatch[2].trim()
            })
        }
    }

    return {properties}
}

class ExploreCommerceAPITool {
    constructor() {
        this.name = 'explore_commerce_api'
        this.description =
            'Explore and document any commerce-sdk-isomorphic class API endpoints, parameters, and usage examples. Reads from the commerce-sdk-isomorphic type definitions.'
        this.inputSchema = {
            prompt: z
                .string()
                .describe(
                    'Natural language question or method query (e.g., "How do I get a product?", "ShopperProducts.getProduct", "search products")'
                )
        }
        // Bind handler to always have correct 'this'
        this.handler = this.handler.bind(this)
    }

    /**
     * Generate dynamic API context from Commerce SDK TypeScript definitions
     */
    async getAllAPIMethods(fileContent) {
        const classNames = extractAllClassNames(fileContent)
        let apiContext = '# Commerce SDK API Reference\n\n'

        for (const className of classNames) {
            const classDocs = extractClassDocs(fileContent, className)
            if (classDocs.error) continue

            apiContext += `## ${className}\n`

            const methodNames = Object.keys(classDocs)
            for (const methodName of methodNames) {
                const method = classDocs[methodName]
                apiContext += `- **${methodName}**: ${method.description}\n`

                // Add key parameter info
                if (method.parameterStructure && method.parameterStructure.parameters) {
                    const keyParams = Object.keys(method.parameterStructure.parameters).slice(0, 3)
                    if (keyParams.length > 0) {
                        apiContext += `  - Key params: ${keyParams.join(', ')}\n`
                    }
                }

                // Add return type info
                if (method.returnType && method.returnType.type) {
                    apiContext += `  - Returns: ${method.returnType.type}\n`
                }
            }
            apiContext += '\n'
        }

        return apiContext
    }

    async handler(args) {
        // Auto-detect Commerce SDK path
        let describePath = autoDetectCommerceSDKTypesPath()
        if (!describePath) {
            const nodeModulesPath = autoDetectNodeModulesPath()
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
                        text: 'Could not auto-detect the commerce-sdk-isomorphic type definitions. Please ensure you have commerce-sdk-isomorphic installed in your node_modules.'
                    }
                ]
            }
        }

        // Read Commerce SDK TypeScript definitions
        let fileContent
        try {
            fileContent = await fs.readFile(describePath, 'utf-8')
        } catch (e) {
            return {
                role: 'system',
                content: [
                    {
                        type: 'text',
                        text: `Could not read Commerce SDK type definitions at ${describePath}: ${e.message}`
                    }
                ]
            }
        }

        // Generate dynamic API context for LLM to analyze
        const apiContext = await this.getAllAPIMethods(fileContent)

        // Let LLM do the semantic analysis and provide documentation
        return {
            role: 'system',
            content: [
                {
                    type: 'text',
                    text: `${apiContext}

---

**User Query:** "${args.prompt}"

Please analyze this query and provide:
1. The most relevant Commerce SDK API method(s) for this query
2. Complete documentation including:
   - Method description and purpose
   - Full method signature
   - Detailed parameter structure (especially the 'options' object)
   - Return type structure with key properties
   - Usage examples if available

If the query is ambiguous, suggest 2-3 relevant options with brief explanations.

Focus on being comprehensive and practical for developers using the Commerce SDK.`
                }
            ]
        }
    }
}

export {extractAllClassNames, extractClassDocs}
export default ExploreCommerceAPITool
