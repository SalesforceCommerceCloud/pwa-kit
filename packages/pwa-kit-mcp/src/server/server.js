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
import {Telemetry} from '../utils/telemetry'

// NOTE: This is a workaround to import JSON files as ES modules.
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

        // Wrap server.tool so all handlers are decorated with telemetry
        const _origTool = this.server.tool.bind(this.server)
        this.server.tool = (name, description, inputSchema, handler) => {
            const wrappedHandler = async (...handlerArgs) => {
                const start = Date.now()
                try {
                    const result = await handler(...handlerArgs)
                    this.telemetry?.sendEvent('TOOL_CALLED_' + name, {
                        toolName: name,
                        runTimeMs: Date.now() - start,
                        isError: false
                    })
                    return result
                } catch (error) {
                    this.telemetry?.sendEvent('TOOL_CALLED_' + name, {
                        toolName: name,
                        runTimeMs: Date.now() - start,
                        isError: true
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
        // Read args passed by the MCP client (from mcp.json "args")
        const argv = process.argv.slice(2)
        const readFlag = (name, def) => {
            const i = argv.findIndex((a) => a === `--${name}` || a.startsWith(`--${name}=`))
            if (i === -1) return process.env[name.toUpperCase()] ?? def
            const curr = argv[i]
            if (curr.includes('=')) return curr.split('=').slice(1).join('=')
            return argv[i + 1] ?? true
        }

        const noTelemetry = !!readFlag('no-telemetry', false)
        const transport = new StdioServerTransport()
        await this.server.connect(transport)
        // when telemetry is enabled, then send telemetry events
        if (!noTelemetry) {
            try {
                this.telemetry = new Telemetry()
                await this.telemetry.start()
                const clientInfo = this.server.getClientVersion?.()
                if (clientInfo) {
                    this.telemetry.addAttributes({
                        clientName: clientInfo.name,
                        clientVersion: clientInfo.version
                    })
                }
                this.telemetry?.sendEvent('SERVER_STATUS', {status: 'started'})
            } catch (error) {
                this.telemetry?.sendEvent('SERVER_STATUS', {
                    status: 'error'
                })
                throw error
            }
            const sendStop = (signal) => {
                this.telemetry?.sendEvent('SERVER_STATUS', {status: 'stopped', signal})
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
        }
    }
}

const server = new PwaStorefrontMCPServerHighLevel()
server.run().catch(console.error)
