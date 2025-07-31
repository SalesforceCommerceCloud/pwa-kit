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
    TestWithPlaywrightTool,
    CreateNewPageTool
} from '../tools'

// NOTE: This is a workaround to import JSON files as ES modules.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const productDocument = require('../data/ProductDocument.json')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const categoryDocument = require('../data/CategoryDocument.json')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const documentList = require('../data/DocumentList.json')
// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../../package.json')

const FALLBACK_VERSION = '0.1.0'

class PwaStorefrontMCPServerHighLevel {
    constructor() {
        // Using McpServer instead of Server
        this.server = new McpServer(
            {
                name: 'pwa-kit-mcp',
                version: packageJson?.version || FALLBACK_VERSION
            },
            {
                capabilities: {
                    tools: {}
                }
            }
        )
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

        // Register DeveloperGuidelinesTool
        this.server.tool(
            DeveloperGuidelinesTool.name,
            DeveloperGuidelinesTool.description,
            DeveloperGuidelinesTool.inputSchema,
            DeveloperGuidelinesTool.fn
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
            'create_new_sample_component',
            'Conversationally collect parameters and create a new sample React component.',
            {
                sessionId: z.string().optional().describe('Session ID for the conversational flow'),
                answer: z.string().optional().describe('User answer to the current question')
            },
            (args) => this.handleCreateNewSampleComponent(args)
        )

        this.server.tool(
            CreateNewPageTool.name,
            CreateNewPageTool.description,
            CreateNewPageTool.inputSchema,
            CreateNewPageTool.handler
        )
    }

    /**
     * Helper to handle the conversational flow for create_new_sample_component
     */
    async handleCreateNewSampleComponent(args) {
        let sessionId = args.sessionId
        if (!sessionId) {
            sessionId = `session-interactive-${this.sessionCounter++}`
            this.sessions[sessionId] = {step: 1, answers: {}}
        }
        const session = this.sessions[sessionId]
        const {step} = session
        const answer = args.answer?.trim()
        switch (step) {
            case 1:
                return this._handleComponentNameStep(session, answer, sessionId)
            case 2:
                return this._handleDirectoryStep(session, answer, sessionId)
            case 3:
                return this._handleSingleOrListStep(session, answer, sessionId)
            default:
                return this._handleDoneStep(sessionId)
        }
    }

    _next(sessionId, question) {
        return {
            content: [{type: 'text', text: JSON.stringify({sessionId, question})}]
        }
    }

    _done(sessionId, message) {
        return {
            content: [{type: 'text', text: JSON.stringify({sessionId, message})}]
        }
    }

    _handleComponentNameStep(session, answer, sessionId) {
        if (answer) {
            session.answers.name = answer

            // If PWA_STOREFRONT_APP_PATH is defined, automatically set location and go to step 3
            if (process.env.PWA_STOREFRONT_APP_PATH) {
                session.answers.location = process.env.PWA_STOREFRONT_APP_PATH + '/components'
                session.step = 3
                return this._next(
                    sessionId,
                    'Should this component display a single product, a list of products, or do you want to handle it manually? Reply with "single", "list", or "other".'
                )
            } else {
                session.step = 2
                return this._next(
                    sessionId,
                    'What should be the directory where the component should be created? Please provide the full absolute path.'
                )
            }
        }
        return this._next(sessionId, 'What would you like to name your new React component?')
    }

    _handleDirectoryStep(session, answer, sessionId) {
        if (answer) {
            session.answers.location = answer
            session.step = 3
            return this._next(
                sessionId,
                'Should this component display a single product, a list of products, or do you want to handle it manually? Reply with "single", "list", or "other".'
            )
        }
        return this._next(
            sessionId,
            'What should be the directory where the component should be created? Please provide the full absolute path.'
        )
    }

    async _handleSingleOrListStep(session, answer, sessionId) {
        if (answer && /other/i.test(answer)) {
            session.step = 99
            return this._done(
                sessionId,
                'Manual mode selected. Please proceed with manual code generation.'
            )
        }
        let isList = null
        if (answer && /list/i.test(answer)) {
            isList = true
        } else if (answer && /single/i.test(answer)) {
            isList = false
        } else {
            return this._next(
                sessionId,
                'Please reply with "single", "list", or "other".\nNote: This tool only supports generating single or list "Product" components. For other requirements, select "other".'
            )
        }

        const tool = new CreateNewComponentTool()
        tool.componentData = {
            name: session.answers.name,
            location: session.answers.location,
            createTestFile: false,
            customCode: '',
            entityType: 'product'
        }
        const dataModel = this.getDataModel('product')
        let schemaObj = dataModel && dataModel.properties ? dataModel.properties : {}
        let presentationalResult = await tool.updateComponentToPresentational(
            'product',
            session.answers.name,
            session.answers.location,
            schemaObj,
            {list: isList}
        )
        session.step = 99
        return this._done(
            sessionId,
            (session.basicComponentResult || '') +
                `\n\n${presentationalResult}\nComponent creation flow complete.`
        )
    }

    _handleDoneStep(sessionId) {
        return this._done(sessionId, 'Component creation flow complete.')
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
