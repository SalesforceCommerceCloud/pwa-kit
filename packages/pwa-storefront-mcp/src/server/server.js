#!/usr/bin/env node
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js'

import {z} from 'zod'
import {
    CreateAppGuidelinesTool,
    CreateNewComponentTool,
    DeveloperGuidelinesTool,
    CreateCustomizePageTool
} from '../utils'
import {HookRecommenderTool} from '../utils/hook-recommender-tool'
import {TestWithPlaywrightTool} from '../utils/run-site-test-tool'

// NOTE: This is a workaround to import JSON files as ES modules.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const productDocument = require('../data/ProductDocument.json')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const categoryDocument = require('../data/CategoryDocument.json')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const documentList = require('../data/DocumentList.json')

class PwaStorefrontMCPServerHighLevel {
    constructor() {
        // Using McpServer instead of Server
        this.server = new McpServer(
            {
                name: 'pwa-storefront-mcp-server',
                version: '0.1.0'
            },
            {
                capabilities: {
                    tools: {}
                }
            }
        )

        this.hookRecommenderTool = new HookRecommenderTool()
        this.CreateNewComponentTool = new CreateNewComponentTool()
        this.testWithPlaywrightTool = new TestWithPlaywrightTool()
        this.setupTools()

        // 1. Add in-memory session management
        this.sessions = {}
        this.sessionCounter = 1
    }

    setupTools() {
        // Register CreateProjectTool
        this.server.tool(
            CreateAppGuidelinesTool.name,
            CreateAppGuidelinesTool.description,
            CreateAppGuidelinesTool.inputSchema,
            CreateAppGuidelinesTool.fn
        )

        // Register CreateCustomizePageTool
        this.server.tool(
            CreateCustomizePageTool.name,
            CreateCustomizePageTool.description,
            CreateCustomizePageTool.inputSchema,
            CreateCustomizePageTool.fn
        )

        // Register DeveloperGuidelinesTool
        this.server.tool(
            DeveloperGuidelinesTool.name,
            DeveloperGuidelinesTool.description,
            DeveloperGuidelinesTool.inputSchema,
            DeveloperGuidelinesTool.fn
        )

        this.server.tool(
            'recommend_hooks',
            'Recommends relevant hooks for a given entity (e.g., product, category).',
            {
                entity: z
                    .string()
                    .describe(
                        'The entity to get hook recommendations for (e.g., product, category, basket, customer)'
                    )
            },
            async (args) => {
                try {
                    const recommendations = this.hookRecommenderTool.getRecommendations(args.entity)
                    return {
                        content: [
                            {
                                type: 'text',
                                text: JSON.stringify(recommendations, null, 2)
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
            'run_site_test',
            'Run site performance or accessibility test for a given site URL (e.g. https://pwa-kit.mobify-storefront.com)',
            {
                testType: z.enum(['performance', 'accessibility']).describe('Type of test to run'),
                siteUrl: z.string().optional().describe('Site URL to test (optional)')
            },
            ({testType, siteUrl}) => this.testWithPlaywrightTool.run(testType, siteUrl)
        )

        this.server.tool(
            'create_new_component',
            'Conversationally collect parameters and create a new React component.',
            {
                sessionId: z.string().optional().describe('Session ID for the conversational flow'),
                answer: z.string().optional().describe('User answer to the current question')
            },
            async (args) => {
                let sessionId = args.sessionId
                if (!sessionId) {
                    sessionId = `session-interactive-${this.sessionCounter++}`
                    this.sessions[sessionId] = {step: 1, answers: {}}
                }
                const session = this.sessions[sessionId]
                const {step, answers} = session
                const answer = args.answer?.trim()
                const next = (question) => ({
                    content: [{type: 'text', text: JSON.stringify({sessionId, question})}]
                })
                const done = (message) => ({
                    content: [{type: 'text', text: JSON.stringify({sessionId, message})}]
                })
                switch (step) {
                    case 1:
                        if (answer) {
                            answers.name = answer
                            session.step = 2
                            const defaultDir = process.env.PWA_STOREFRONT_APP_PATH
                                ? process.env.PWA_STOREFRONT_APP_PATH + '/components'
                                : '/components'
                            return next(
                                `Answer yes to use the default components directory (${defaultDir}), or no if you want to specify the full absolute path to use a different directory:`
                            )
                        }
                        return next('What would you like to name your new React component?')
                    case 2: {
                        const defaultDir = process.env.PWA_STOREFRONT_APP_PATH
                            ? process.env.PWA_STOREFRONT_APP_PATH + '/components'
                            : '/components'
                        if (answer) {
                            if (/^(yes|y|true|1)$/i.test(answer)) {
                                answers.location = defaultDir
                            } else {
                                answers.location = answer
                            }
                            const tool = new CreateNewComponentTool()
                            tool.componentData = {
                                name: answers.name,
                                location: answers.location,
                                createTestFile: false,
                                customCode: '',
                                entityType: ''
                            }
                            session.basicComponentResult = await tool.createComponent()
                            session.step = 3
                            return next(
                                'Is this component related to a specific entity (e.g., product, category, basket, customer)? (optional, press enter to skip)'
                            )
                        }
                        return next(
                            `Answer yes to use the default components directory (${defaultDir}), or no if you want to specify the full absolute path to use a different directory:`
                        )
                    }
                    case 3:
                        if (answer !== undefined) {
                            answers.entityType = answer
                        } else {
                            answers.entityType = ''
                        }
                        // If product, ask for single or list, else continue generic flow
                        if (answers.entityType && answers.entityType.toLowerCase() === 'product') {
                            session.step = 4
                            return next(
                                'Should this component display a single product or a list of products ? Reply with "single" or "list".'
                            )
                        } else {
                            // Generic flow for other entities
                            const {HookRecommenderTool} = await import(
                                '../utils/hook-recommender-tool.js'
                            )
                            const recommender = new HookRecommenderTool()
                            const hooks = Array.isArray(
                                recommender.getRecommendations(answers.entityType)
                            )
                                ? recommender.getRecommendations(answers.entityType)
                                : []
                            session.hookOptions = hooks.map((h) => h.name)
                            session.hookDescriptions = hooks.map((h) => h.description)
                            session.hookOptions.push('schema')
                            session.hookDescriptions.push('Use schema fields directly')
                            session.hookOptions.push('none')
                            session.hookDescriptions.push(
                                'None of the above (finish component creation now)'
                            )
                            let prompt = 'Select data fetching details for this component:'
                            session.hookOptions.forEach((opt, idx) => {
                                prompt += `\n${idx + 1}. ${opt}`
                                if (session.hookDescriptions[idx]) {
                                    prompt += ` (${session.hookDescriptions[idx]})`
                                }
                            })
                            prompt += '\n\nReply with the number of your choice.'
                            session.step = 5
                            return next(prompt)
                        }
                    case 4: {
                        // Only for product entity: handle single/list
                        if (answer && /list/i.test(answer)) {
                            // List of products
                            const tool = new CreateNewComponentTool()
                            tool.componentData = {
                                name: answers.name,
                                location: answers.location,
                                createTestFile: false,
                                customCode: '',
                                entityType: 'product'
                            }
                            const dataModel = this.getDataModel('product')
                            let schemaObj =
                                dataModel && dataModel.properties ? dataModel.properties : {}
                            let presentationalResult = await tool.updateComponentToPresentational(
                                'product',
                                answers.name,
                                answers.location,
                                schemaObj,
                                {list: true}
                            )
                            session.step = 99
                            return done(
                                (session.basicComponentResult || '') +
                                    `\n\n${presentationalResult}\nComponent creation flow complete.`
                            )
                        } else if (answer && /single/i.test(answer)) {
                            // Single product
                            const tool = new CreateNewComponentTool()
                            tool.componentData = {
                                name: answers.name,
                                location: answers.location,
                                createTestFile: false,
                                customCode: '',
                                entityType: 'product'
                            }
                            const dataModel = this.getDataModel('product')
                            let schemaObj =
                                dataModel && dataModel.properties ? dataModel.properties : {}
                            let presentationalResult = await tool.updateComponentToPresentational(
                                'product',
                                answers.name,
                                answers.location,
                                schemaObj,
                                {list: false}
                            )
                            session.step = 99
                            return done(
                                (session.basicComponentResult || '') +
                                    `\n\n${presentationalResult}\nComponent creation flow complete.`
                            )
                        } else {
                            return next('Please reply with "single" or "list".')
                        }
                    }
                    case 5: {
                        // Generic flow for other entities (hook selection, schema, etc.)
                        const selectedIdx = parseInt(answer, 10) - 1
                        const selectedOption =
                            session.hookOptions && session.hookOptions[selectedIdx]
                        if (!selectedOption) {
                            return next(
                                'Invalid selection. Please reply with a valid number from the list.'
                            )
                        }
                        if (selectedOption === 'none') {
                            session.step = 99
                            return done(
                                (session.basicComponentResult || '') +
                                    '\nComponent creation flow complete.'
                            )
                        }
                        const tool = new CreateNewComponentTool()
                        tool.componentData = {
                            name: answers.name,
                            location: answers.location,
                            createTestFile: false, // already created
                            customCode: '',
                            entityType: answers.entityType || ''
                        }
                        let result = session.basicComponentResult || ''
                        let dataModel = null
                        if (selectedOption === 'schema') {
                            dataModel = this.getDataModel(answers.entityType)
                            let schemaObj =
                                dataModel && dataModel.properties ? dataModel.properties : {}
                            let presentationalResult = await tool.updateComponentToPresentational(
                                answers.entityType,
                                answers.name,
                                answers.location,
                                schemaObj
                            )
                            session.step = 99
                            session.dataModel = dataModel
                            return next(
                                result +
                                    `\n\n${presentationalResult}\nComponent creation flow complete.`
                            )
                        } else {
                            dataModel = this.getDataModel(answers.entityType)
                            let hookResult = await tool.handleHookSelection(
                                selectedOption,
                                answers.entityType,
                                answers.name,
                                answers.location,
                                {
                                    [answers.entityType]: dataModel
                                }
                            )
                            session.step = 99
                            session.dataModel = dataModel
                            return next(
                                result + `\n\n${hookResult}\nComponent creation flow complete.`
                            )
                        }
                    }
                    case 99: {
                        if (answer) {
                            // Completely re-initialize session for new component creation
                            this.sessions[sessionId] = {step: 2, answers: {name: answer}}
                            // Immediately process the new step (step 2) with the current answer
                            const session = this.sessions[sessionId]
                            const {answers} = session
                            // Make handleStep async to allow await inside
                            const handleStep = async (step, answer) => {
                                switch (step) {
                                    case 2: {
                                        const defaultDir = process.env.PWA_STOREFRONT_APP_PATH
                                            ? process.env.PWA_STOREFRONT_APP_PATH + '/components'
                                            : '/components'
                                        if (answer) {
                                            if (/^(yes|y|true|1)$/i.test(answer)) {
                                                answers.location = defaultDir
                                            } else {
                                                answers.location = answer
                                            }
                                            const tool = new CreateNewComponentTool()
                                            tool.componentData = {
                                                name: answers.name,
                                                location: answers.location,
                                                createTestFile: false,
                                                customCode: '',
                                                entityType: ''
                                            }
                                            session.basicComponentResult =
                                                await tool.createComponent()
                                            session.step = 3
                                            return next(
                                                'Is this component related to a specific entity (e.g., product, category, basket, customer)? (optional, press enter to skip)'
                                            )
                                        }
                                        return next(
                                            `Answer yes to use the default components directory (${defaultDir}), or no if you want to specify the full absolute path to use a different directory:`
                                        )
                                    }
                                    default:
                                        return next(
                                            'What would you like to name your new React component?'
                                        )
                                }
                            }
                            return await handleStep(session.step, undefined)
                        }
                        return done('Component creation flow complete.')
                    }
                    default:
                        session.step = 1
                        return next('What would you like to name your new React component?')
                }
            }
        )
    }

    /**
     * Simple method to get data models directly from imports
     * @param {string} modelName - Name of the model (e.g., 'product', 'category')
     * @returns {object|null} The data model object or null if not found
     */
    getDataModel(modelName) {
        const models = {
            product: productDocument,
            category: categoryDocument,
            documentList: documentList
        }
        return models[modelName.toLowerCase()] || null
    }

    async run() {
        const transport = new StdioServerTransport()
        await this.server.connect(transport)
        console.error('PWA Storefront MCP server (McpServer version) running on stdio')
    }
}

const server = new PwaStorefrontMCPServerHighLevel()
server.run().catch(console.error)
