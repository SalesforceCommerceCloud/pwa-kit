#!/usr/bin/env node
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {SfMcpServer} from '@salesforce/mcp/lib/sf-mcp-server.js'
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js'

import {z} from 'zod'
import {
    CreateAppGuidelinesTool,
    CreateNewComponentTool,
    DeveloperGuidelinesTool,
    TestWithPlaywrightTool,
    CreateNewPageTool
} from '../tools'
import {startTelemetry, stopTelemetry, getTelemetry} from '../utils/telemetry.js'

// NOTE: This is a workaround to import JSON files as ES modules.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../../package.json')

const FALLBACK_VERSION = '0.1.0'

class PwaStorefrontMCPServerHighLevel {
    constructor() {
        this.createNewComponentTool = new CreateNewComponentTool()
        this.createAppGuidelinesTool = new CreateAppGuidelinesTool()
        this.testWithPlaywrightTool = new TestWithPlaywrightTool()
    }

    setupTools() {
        // Register mcp tools
        this.server.registerTool(
            this.createAppGuidelinesTool.name,
            {
                description: this.createAppGuidelinesTool.description
            },
            this.createAppGuidelinesTool.fn
        )
        this.server.registerTool(
            DeveloperGuidelinesTool.name,
            {
                description: DeveloperGuidelinesTool.description
            },
            DeveloperGuidelinesTool.fn
        )
        this.server.registerTool(
            'run_site_test',
            {
                description:
                    'Run site performance or accessibility test for a given site URL (e.g. https://pwa-kit.mobify-storefront.com)',
                inputSchema: {
                    testType: z
                        .enum(['performance', 'accessibility'])
                        .describe('Type of test to run'),
                    siteUrl: z.string().optional().describe('Site URL to test (optional)')
                }
            },
            ({testType, siteUrl}) => this.testWithPlaywrightTool.run(testType, siteUrl)
        )
        this.server.registerTool(
            this.createNewComponentTool.name,
            {
                description: this.createNewComponentTool.description,
                inputSchema: this.createNewComponentTool.inputSchema
            },
            this.createNewComponentTool.handler
        )
        this.server.registerTool(
            CreateNewPageTool.name,
            {
                description: CreateNewPageTool.description,
                inputSchema: CreateNewPageTool.inputSchema
            },
            CreateNewPageTool.handler
        )
    }

    async run() {
        try {
            await startTelemetry({project: 'pwa-kit-mcp'})
        } catch (e) {
            console.error(
                'Telemetry initialization failed; continuing without telemetry:',
                e?.message || e
            )
        }
        // Create server AFTER telemetry is started, so it's injected into server options
        let telemetryOption
        try {
            telemetryOption = getTelemetry()
        } catch {
            telemetryOption = undefined
        }
        this.server = new SfMcpServer(
            {
                name: 'pwa-kit-mcp',
                version: packageJson?.version || FALLBACK_VERSION
            },
            {
                capabilities: {
                    tools: {}
                },
                telemetry: telemetryOption
            }
        )
        this.setupTools()
        const transport = new StdioServerTransport()
        await this.server.connect(transport)
        console.error('PWA Storefront MCP server (McpServer version) running on stdio')
        process.stdin.on('close', (err) => {
            try {
                const t = err ? 'SERVER_STOPPED_ERROR' : 'SERVER_STOPPED_SUCCESS'

                getTelemetry()?.sendEvent(t)
            } catch {
                // ignore
            }
            stopTelemetry()
        })
    }
}

const server = new PwaStorefrontMCPServerHighLevel()
server.run().catch(console.error)
