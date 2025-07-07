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
import {CreateAppGuidelinesTool, CreateNewComponentTool, DeveloperGuidelinesTool} from '../utils'
import {TestWithPlaywrightTool} from '../utils/run-site-test-tool'

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
                name: 'pwa-storefront-mcp-server',
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
        const {step, answers} = session
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
            session.step = 2
            const defaultDir = process.env.PWA_STOREFRONT_APP_PATH
                ? process.env.PWA_STOREFRONT_APP_PATH + '/components'
                : '/components'
            return this._next(
                sessionId,
                `Answer yes to use the default components directory (${defaultDir}), or no if you want to specify the full absolute path to use a different directory:`
            )
        }
        return this._next(sessionId, 'What would you like to name your new React component?')
    }

    _handleDirectoryStep(session, answer, sessionId) {
        const defaultDir = process.env.PWA_STOREFRONT_APP_PATH
            ? process.env.PWA_STOREFRONT_APP_PATH + '/components'
            : '/components'
        if (answer) {
            if (/^(yes|y|true|1)$/i.test(answer)) {
                session.answers.location = defaultDir
            } else {
                session.answers.location = answer
            }
            session.step = 3
            return this._next(
                sessionId,
                'Should this component display a single product or a list of products? Reply with "single" or "list".'
            )
        }
        return this._next(
            sessionId,
            `Answer yes to use the default components directory (${defaultDir}), or no if you want to specify the full absolute path to use a different directory:`
        )
    }

    async _handleSingleOrListStep(session, answer, sessionId) {
        if (answer && /list/i.test(answer)) {
            // List of products
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
                {list: true}
            )
            session.step = 99
            return this._done(
                sessionId,
                (session.basicComponentResult || '') +
                    `\n\n${presentationalResult}\nComponent creation flow complete.`
            )
        } else if (answer && /single/i.test(answer)) {
            // Single product
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
                {list: false}
            )
            session.step = 99
            return this._done(
                sessionId,
                (session.basicComponentResult || '') +
                    `\n\n${presentationalResult}\nComponent creation flow complete.`
            )
        } else {
            return this._next(sessionId, 'Please reply with "single" or "list".')
        }
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
