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

function getCommerceSDKTypesFromNodeModulesPath(nodeModulesPath) {
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
    if (!typeName) return {properties: []}
    // Try to find interface/type definition in the file content
    const interfaceRegex = new RegExp(`interface\\s+${typeName}\\s*{([^}]*)}`, 'ms')
    const typeRegex = new RegExp(`type\\s+${typeName}\\s*=\\s*{([^}]*)}`, 'ms')
    const interfaceMatch = fileContent.match(interfaceRegex) || fileContent.match(typeRegex)
    if (interfaceMatch) {
        return parseInterfaceProperties(interfaceMatch[1])
    }
    // fallback for type = ...; forms
    const fallback = fileContent.match(new RegExp(`type\\s+${typeName}\\s*=\\s*([^;]+);`, 'm'))
    if (fallback) {
        return {properties: [{name: '(raw)', type: fallback[1].trim()}]}
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

function extractNamedParameterTypes(parametersString) {
    // Match param: <name>: <TypeName>
    // Only matches top-level non-primitive type references
    const regex = /(?:[\w\d_]+)\s*:\s*([A-Z][A-Za-z0-9_]+)/g
    const types = new Set()
    let match
    while ((match = regex.exec(parametersString))) {
        // Exclude primitives
        if (
            !['string', 'number', 'boolean', 'void', 'any', 'unknown', 'object'].includes(match[1])
        ) {
            types.add(match[1])
        }
    }
    return Array.from(types)
}

function getTypeDefinitionMarkdown(typeName, fileContent) {
    // Find interface or type definition block
    const interfaceRegex = new RegExp(`interface\\s+${typeName}\\s*{([\\s\\S]*?)}\\s`, 'm')
    const typeRegex = new RegExp(`type\\s+${typeName}\\s*=\\s*{([\\s\\S]*?)}\\s`, 'm')
    let match = fileContent.match(interfaceRegex) || fileContent.match(typeRegex)
    if (!match) {
        // fallback for type = ...; forms
        const fallback = fileContent.match(new RegExp(`type\\s+${typeName}\\s*=\\s*([^;]+);`, 'm'))
        if (fallback) return `\n**Type ${typeName}:** \n\n\`${fallback[1].trim()}\``
        return `\n_No type definition found for ${typeName}_\n`
    }
    const block = match[1].trim()
    // Format as markdown properties
    const lines = block
        .split('\n')
        .filter(Boolean)
        .map((l) => l.trim().replace(/;?$/, ''))
    let out = `\n**Parameters for \`${typeName}\`**\n\n| Name | Type |\n|---|---|\n`
    for (const line of lines) {
        // Parse as: name?: type
        const propMatch = line.match(/^(\w+)\??\s*:\s*([^,{}]+)/)
        if (propMatch) {
            out += `| \`${propMatch[1]}\` | \`${propMatch[2].trim()}\` |\n`
        }
    }
    return out
}

function printTypeWithNestedReferences(typeName, fileContent, seenTypes = new Set()) {
    if (seenTypes.has(typeName)) return ''
    seenTypes.add(typeName)
    // Find interface or type definition block
    const interfaceRegex = new RegExp(`interface\\s+${typeName}\\s*{([\\s\\S]*?)}\\s`, 'm')
    const typeRegex = new RegExp(`type\\s+${typeName}\\s*=\\s*{([\\s\\S]*?)}\\s`, 'm')
    let match = fileContent.match(interfaceRegex) || fileContent.match(typeRegex)
    if (!match) {
        // fallback for type = ...; forms
        const fallback = fileContent.match(new RegExp(`type\\s+${typeName}\\s*=\\s*([^;]+);`, 'm'))
        if (fallback) return `\n**Type ${typeName}:** \n\n\`${fallback[1].trim()}\``
        return `\n_No type definition found for ${typeName}_\n`
    }
    const block = match[1].trim()
    // Format as markdown property table
    const lines = block
        .split('\n')
        .filter(Boolean)
        .map((l) => l.trim().replace(/;?$/, ''))
    let out = `\n**Parameters for \`${typeName}\`**\n\n| Name | Type |\n|---|---|\n`
    const nestedTypes = []
    for (const line of lines) {
        // Parse as: name?: type
        const propMatch = line.match(/^(\w+)\??\s*:\s*([^,{}]+)/)
        if (propMatch) {
            out += `| \`${propMatch[1]}\` | \`${propMatch[2].trim()}\` |\n`
            // If this property is a capitalized type reference, queue it for expansion if not seen yet
            const subType = propMatch[2].trim()
            if (
                /^[A-Z][A-Za-z0-9_]+$/.test(subType) &&
                !seenTypes.has(subType) &&
                !['String', 'Number', 'Boolean', 'Object', 'Date'].includes(subType)
            ) {
                nestedTypes.push(subType)
            }
        }
    }
    // Add 1-level nested types inline below this table
    for (const nested of nestedTypes) {
        out += printTypeWithNestedReferences(nested, fileContent, seenTypes)
    }
    return out
}

class ExploreCommerceAPITool {
    constructor() {
        this.name = 'pwakit_explore_scapi_shop_api'
        this.description =
            'Explore and document any commerce-sdk-isomorphic class API endpoints, parameters, and usage examples. Reads from the commerce-sdk-isomorphic type definitions.'
        this.inputSchema = {
            prompt: z
                .string()
                .describe(
                    'Natural language question or method query (e.g., "How do I get a product?", "ShopperProducts.getProduct", "search products")'
                )
        }
        this.handler = this.handler.bind(this)
    }

    /**
     * Returns a markdown snippet for just the most relevant class(es)/method(s) for the user's query, plus referenced parameter types.
     */
    getRelevantAPIContext(fileContent, userQuery) {
        const classNames = extractAllClassNames(fileContent)
        const normalizedQuery = userQuery.toLowerCase()
        let context = '# Commerce SDK API Reference\n\n'

        // Try to detect explicit class.method: e.g., ShopperProducts.getProduct
        let matchClass = null
        let matchMethod = null
        const dotMatch = userQuery.match(/(\w+)\.(\w+)/)
        if (dotMatch) {
            matchClass = dotMatch[1]
            matchMethod = dotMatch[2]
        } else {
            // Try keyword match: see if query includes a class name
            matchClass = classNames.find((cn) => normalizedQuery.includes(cn.toLowerCase())) || null
        }

        if (matchClass) {
            const classDocs = extractClassDocs(fileContent, matchClass)
            if (classDocs.error) return `Class ${matchClass} not found.`
            context += `## ${matchClass}\n`
            if (matchMethod && classDocs[matchMethod]) {
                const method = classDocs[matchMethod]
                context += `- **${matchMethod}**: ${method.description || ''}\n`
                context += `  - Full signature: ${method.fullSignature}\n`
                // Look for referenced parameter types and print those
                const refTypes = extractNamedParameterTypes(method.fullSignature)
                for (const refType of refTypes) {
                    context += printTypeWithNestedReferences(refType, fileContent) + '\n'
                }
                if (
                    method.parameterStructure &&
                    method.parameterStructure.parameters &&
                    Object.keys(method.parameterStructure.parameters).length > 0
                ) {
                    context += `  - Parameters: ${JSON.stringify(
                        method.parameterStructure.parameters
                    )}\n`
                }
                if (method.returnType && method.returnType.type) {
                    context += `  - Returns: ${method.returnType.type}\n`
                }
                if (method.example) {
                    context += `  - Example: ${method.example}\n`
                }
            } else {
                // No explicit method, show all methods in class
                for (const key of Object.keys(classDocs)) {
                    const method = classDocs[key]
                    context += `- **${key}**: ${method.description || ''}\n`
                }
            }
        } else {
            // Ambiguous/keyword: show candidate classes with a sample method for each
            context += '## Top classes in Commerce SDK\n'
            for (const cn of classNames.slice(0, 3)) {
                const classDocs = extractClassDocs(fileContent, cn)
                if (!classDocs.error) {
                    context += `### ${cn}\n`
                    const keys = Object.keys(classDocs).slice(0, 1)
                    for (const key of keys) {
                        const method = classDocs[key]
                        context += `- **${key}**: ${method.description || ''}\n`
                    }
                }
            }
        }
        return context
    }

    async handler(args) {
        // Auto-detect Commerce SDK path
        let describePath = autoDetectCommerceSDKTypesPath()
        if (!describePath) {
            const nodeModulesPath = autoDetectNodeModulesPath()
            if (nodeModulesPath) {
                describePath = getCommerceSDKTypesFromNodeModulesPath(nodeModulesPath)
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
        // Only build context for relevant API area
        const apiContext = this.getRelevantAPIContext(fileContent, args.prompt)
        return {
            role: 'system',
            content: [
                {
                    type: 'text',
                    text:
                        `${apiContext}\n---\n` +
                        `**User Query:** "${args.prompt}"\n` +
                        'Please analyze this query and provide:\n' +
                        '1. The most relevant Commerce SDK API method(s) for this query\n' +
                        '2. Complete documentation including:\n' +
                        '   - Method description and purpose\n' +
                        '   - Full method signature\n' +
                        "   - Detailed parameter structure (especially the 'options' object)\n" +
                        '   - Return type structure with key properties\n' +
                        '   - Usage examples if available\n' +
                        'If the query is ambiguous, suggest 2-3 relevant options with brief explanations.\n' +
                        'Focus on being concise, comprehensive, and practical for developers using the Commerce SDK.'
                }
            ]
        }
    }
}

export {
    extractAllClassNames,
    extractClassDocs,
    parseJSDoc,
    parseTypeScriptParameters,
    parseOptionsParameter,
    parseReturnType,
    extractReturnTypeStructure,
    parseInterfaceProperties,
    extractNamedParameterTypes,
    getTypeDefinitionMarkdown
}
export default ExploreCommerceAPITool
