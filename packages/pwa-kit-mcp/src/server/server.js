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
import {randomBytes} from 'node:crypto'
import {
    CreateAppGuidelinesTool,
    CreateNewComponentTool,
    DeveloperGuidelinesTool,
    TestWithPlaywrightTool,
    CreateNewPageTool
} from '../tools'
import {Telemetry} from '../utils/telemetry'

// NOTE: This is a workaround to import JSON files as ES modules.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../../package.json')

const FALLBACK_VERSION = '0.1.0'

class PwaStorefrontMCPServerHighLevel {
    constructor() {
        // Using McpServer instead of Server
        this.telemetry = new Telemetry()
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

        // Wrap server.tool so all handlers are decorated with telemetry
        const _origTool = this.server.tool.bind(this.server)
        this.server.tool = (name, description, inputSchema, handler) => {
            const wrappedHandler = async (...handlerArgs) => {
                // Unique identifier which correlates all telemetry events to a single tool for the run
                const invocationId = randomBytes(12).toString('hex')
                const start = Date.now()
                // Provide helper APIs for tools to report telemetry during execution
                const toolContext = {
                    invocationId,
                    retry: (attempt, maxAttempts, backoffMs) =>
                        this.telemetry?.sendEvent('TOOL_RETRY', {
                            toolName: name,
                            invocationId,
                            attempt,
                            maxAttempts,
                            backoffMs
                        }),
                    cancelled: (reason) =>
                        this.telemetry?.sendEvent('TOOL_CANCELLED', {
                            toolName: name,
                            invocationId,
                            reason
                        }),
                    dependencyError: (dependencyName, errorName, errorMessage) =>
                        this.telemetry?.sendEvent('TOOL_DEPENDENCY_ERROR', {
                            toolName: name,
                            invocationId,
                            dependencyName,
                            errorName,
                            errorMessage
                        })
                }
                try {
                    this.telemetry?.sendEvent('TOOL_START', {
                        toolName: name,
                        invocationId
                    })
                    const result = await handler(...handlerArgs, toolContext)
                    this.telemetry?.sendEvent('TOOL_SUCCESS', {
                        toolName: name,
                        invocationId,
                        durationMs: Date.now() - start
                    })
                    return result
                } catch (error) {
                    this.telemetry?.sendEvent('TOOL_ERROR', {
                        toolName: name,
                        invocationId,
                        durationMs: Date.now() - start,
                        errorMessage: error instanceof Error ? error.message : String(error),
                        errorName: error instanceof Error ? error.name : undefined
                    })
                    throw error
                }
            }
            return _origTool(name, description, inputSchema, wrappedHandler)
        }

        this.createNewComponentTool = new CreateNewComponentTool()
        this.createAppGuidelinesTool = new CreateAppGuidelinesTool()
        this.testWithPlaywrightTool = new TestWithPlaywrightTool()
        this.setupTools()
    }

    setupTools() {
        // Register CreateProjectTool
        this.server.tool(
            this.createAppGuidelinesTool.name,
            this.createAppGuidelinesTool.description,
            this.createAppGuidelinesTool.inputSchema,
            this.createAppGuidelinesTool.fn
        )
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
            this.createNewComponentTool.name,
            this.createNewComponentTool.description,
            this.createNewComponentTool.inputSchema,
            this.createNewComponentTool.handler
        )
        this.server.tool(
            CreateNewPageTool.name,
            CreateNewPageTool.description,
            CreateNewPageTool.inputSchema,
            CreateNewPageTool.handler
        )
    }

    async run() {
        const transport = new StdioServerTransport()
        await this.telemetry.start()
        try {
            await this.server.connect(transport)
            const clientInfo = this.server.getClientVersion?.()
            if (clientInfo) {
                this.telemetry.addAttributes({
                    clientName: clientInfo.name,
                    clientVersion: clientInfo.version
                })
            }
            this.telemetry?.sendEvent('SERVER_START_SUCCESS')
        } catch (error) {
            this.telemetry?.sendEvent('SERVER_START_ERROR', {
                error: error instanceof Error ? error.message : String(error)
            })
            throw error
        }
        const sendStop = (signal) => {
            this.telemetry?.sendEvent('SERVER_STOP', {signal})
            this.telemetry.stop()
        }
        process.on('exit', () => sendStop('exit'))
        process.on('SIGINT', () => {
            sendStop('SIGINT')
            process.exit(0)
        })
        process.on('SIGTERM', () => {
            sendStop('SIGTERM')
            process.exit(0)
        })
        console.error('PWA Storefront MCP server (McpServer version) running on stdio')
    }
}

const server = new PwaStorefrontMCPServerHighLevel()
server.run().catch(console.error)
