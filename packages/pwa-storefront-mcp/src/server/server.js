#!/usr/bin/env node
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {McpServer, ResourceTemplate} from '@modelcontextprotocol/sdk/server/mcp.js'
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js'
import {z} from 'zod'
import {AddComponentTool} from '../utils/AddComponentTool.js'
import {InsertExistingComponentTool} from '../utils/InsertExistingComponentTool.js'
import {CreateNewComponentTool} from '../utils/CreateNewComponentTool.js'
import {generatePwaKitProject} from '../utils/GenerateProject.js'

// TODO: It might be better to use and index file.

// Preset and Template data
import createAppPresets from '@salesforce/pwa-kit-create-app/data/presets.json' assert {type: 'json'}
import createAppTemplates from '@salesforce/pwa-kit-create-app/data/templates.json' assert {type: 'json'}
import createAppValidators from '@salesforce/pwa-kit-create-app/data/validators.json' assert {type: 'json'}


// Preset and Template schemas
import createAppPresetsSchema from '@salesforce/pwa-kit-create-app/schemas/presets.json' assert {type: 'json'}
import createAppTemplatesSchema from '@salesforce/pwa-kit-create-app/schemas/templates.json' assert {type: 'json'}
import createAppValidatorsSchema from '@salesforce/pwa-kit-create-app/schemas/validators.json' assert {type: 'json'}


import fs from 'fs/promises'
import path from 'path'
import {fileURLToPath} from 'url'
import {DeveloperGuidelinesTool} from '../utils/pwa-developer-guideline-tool.js'

class PwaStorefrontMCPServerHighLevel {
    constructor() {
        console.error('PwaStorefrontMCPServerHighLevel constructor')
        // Using McpServer instead of Server
        this.server = new McpServer({
            name: 'pwa-storefront-mcp-server',
            version: '0.1.0'
        })

        console.error = console.error.bind(console)
        
        this.addComponentTool = new AddComponentTool()
        this.insertExistingComponentTool = new InsertExistingComponentTool()
        this.CreateNewComponentTool = new CreateNewComponentTool()
        this.setupTools()
    }

    setupTools() {
        // Register DeveloperGuidelinesTool
        this.server.tool(
            DeveloperGuidelinesTool.name,
            DeveloperGuidelinesTool.description,
            DeveloperGuidelinesTool.inputSchema,
            DeveloperGuidelinesTool.fn
        )

        this.server.tool(
            'analyze_code_structure',
            'Analyze JavaScript/React code structure to identify components, imports, and insertion points',
            {
                code: z.string().describe('The JavaScript/React code to analyze')
            },
            async (args) => {
                try {
                    const analysis = this.addComponentTool.analyzeCodeStructure(args.code)
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify(
                                    {
                                        analysis,
                                        summary: {
                                            totalImports: analysis.imports.length,
                                            totalComponents: analysis.components.length,
                                            hasReact: analysis.hasReact,
                                            hasNextJs: analysis.hasNextJs,
                                            hasTailwind: analysis.hasTailwind,
                                            insertionPoints: analysis.insertionPoints.length
                                        }
                                    },
                                    null,
                                    2
                                )
                            }
                        ]
                    }
                } catch (error) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({error: error.message}, null, 2)
                            }
                        ],
                        isError: true
                    }
                }
            }
        )

        this.server.tool(
            'insert_existing_component',
            'Insert an existing React component into an existing page',
            {
                componentName: z.string().describe('Component name'),
                targetPage: z.string().describe('Target page name or path'),
                options: z
                    .object({
                        beforeComponentName: z
                            .string()
                            .optional()
                            .describe('Insert before Component name'),
                        afterComponentName: z
                            .string()
                            .optional()
                            .describe('Insert after Component name')
                    })
                    .optional()
            },
            async (args) => {
                try {
                    const modifiedCode = this.insertExistingComponentTool.insertComponentIntoPage(
                        args.targetPage,
                        args.componentName
                    )
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify(
                                    {
                                        success: true,
                                        modifiedCode,
                                        componentType: args.componentType,
                                        options: args.options
                                    },
                                    null,
                                    2
                                )
                            }
                        ]
                    }
                } catch (error) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({error: error.message}, null, 2)
                            }
                        ],
                        isError: true
                    }
                }
            }
        )

        this.server.tool(
            'create_new_component',
            'Create a new React component file based on the provided code or a new component',
            {
                componentName: z.string().describe('Name of the component to create'),
                componentCode: z.string().optional().describe('Code of the component to create'),
                projectDir: z.string().optional().describe('Directory of Retail React App')
            },
            async (args) => {
                try {
                    const componentCode = this.CreateNewComponentTool.createNewComponent(
                        args.componentName,
                        args.componentCode,
                        args.projectDir
                    )
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify(
                                    {
                                        success: true,
                                        componentName: args.componentName,
                                        code: componentCode
                                    },
                                    null,
                                    2
                                )
                            }
                        ]
                    }
                } catch (error) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify({error: error.message}, null, 2)
                            }
                        ],
                        isError: true
                    }
                }
            }
        )

        this.server.resource(
            'data-model',
            new ResourceTemplate('data://data-models/{modelName}', {}),
            {
                title: 'Commerce Cloud Data Model',
                description: 'Commerce Cloud Data Model, such as Product, Category, Order, etc.'
            },
            async (uri, {modelName}) => {
                return this.getDataModelDocument(modelName, uri.href)
            }
        )

        this.server.tool(
            'get_data_model',
            'Get the schema of a data model',
            {
                modelName: z
                    .string()
                    .describe('The name of the data model (e.g., Product, Category, etc.)')
            },
            async ({modelName}) => {
                const uriHref = `data://data-models/${modelName}`
                const result = await this.getDataModelDocument(modelName, uriHref)
                return {
                    content: result.contents.map((item) => ({
                        type: 'text',
                        text: item.text
                    }))
                }
            }
        )

        // submit_pwa_kit_project_answers
        this.server.tool(
            'submit_pwa_kit_project_answers',
            'Submit completed PWA Kit project answers to generate the PWA Kit project. This should be called after the get_project_questions tool is called and the answers are collected.',
            {
                selectedPreset: z.record(z.any()).describe('The selected preset for project generation')
            },
            async (thing) => {
                try {
                    const jsonData = {
                        ...thing.selectedPreset.answers,
                        'general.presetOrTemplateId': thing.selectedPreset.templateId
                    }
                    
                    const result = await generatePwaKitProject(jsonData)
                    
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `Project generation completed successfully:\n${result}`
                            }
                        ]
                    }
                } catch (error) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `Project generation failed: ${error.message}`
                            }
                        ],
                        isError: true
                    }
                }
            }
        )

        // get_create_app_validators
        this.server.tool(
            'get_create_app_validators',
            getCreateAppValidatorsDescription,
            {},
            async () => {

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(
                                {
                                    validators: createAppValidators,
                                    schema: createAppValidatorsSchema,
                                    guidelines: createAppGuidelines
                                },
                                null,
                                2
                            )
                        }
                    ]
                }
            }
        )

        // get_create_app_presets
        this.server.tool(
            'get_create_app_presets',
            getCreateAppPresetsDescription,
            {},
            async () => {

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(
                                {
                                    presets: createAppPresets,
                                    schema: createAppPresetsSchema,
                                    guidelines: createAppGuidelines
                                },
                                null,
                                2
                            )
                        }
                    ]
                }
            }
        )

        // get_create_app_templates
        this.server.tool(
            'get_create_app_templates',
            getCreateAppTemplatesDescription,
            {},
            async () => {

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(
                                {
                                    templates: createAppTemplates,
                                    schema: createAppTemplatesSchema,
                                    guidelines: createAppGuidelines
                                },
                                null,
                                2
                            )
                        }
                    ]
                }
            }
        )
    }

    async getDataModelDocument(modelName, uriHref) {
        try {
            const __filename = fileURLToPath(import.meta.url)
            const __dirname = path.dirname(__filename)
            const dataDir = path.join(__dirname, '..', 'data')
            const filePath = path.join(dataDir, `${modelName}Document.json`)
            let fileContent
            try {
                fileContent = await fs.readFile(filePath, 'utf8')
            } catch (err) {
                if (err.code === 'ENOENT') {
                    fileContent = JSON.stringify({message: `No document found for ${modelName}`})
                } else {
                    throw err
                }
            }
            return {
                contents: [
                    {
                        uri: uriHref,
                        text: fileContent
                    }
                ]
            }
        } catch (error) {
            return {
                contents: [
                    {
                        uri: uriHref,
                        text: JSON.stringify({error: error.message}, null, 2)
                    }
                ]
            }
        }
    }

    async run() {
        const transport = new StdioServerTransport()
        await this.server.connect(transport)
        console.error('PWA Storefront MCP server (McpServer version) running on stdio')
    }
}

const server = new PwaStorefrontMCPServerHighLevel()
server.run().catch(console.error)
