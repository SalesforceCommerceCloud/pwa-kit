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
    CreateNewPageTool,
    VersionControlGitTool
} from '../tools'

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
        this.createNewComponentTool = new CreateNewComponentTool()
        this.versionControlGitTool = new VersionControlGitTool()
        this.testWithPlaywrightTool = new TestWithPlaywrightTool()
        this.setupTools()
    }

    setupTools() {
        // Register CreateProjectTool
        this.server.tool(
            CreateAppGuidelinesTool.name,
            CreateAppGuidelinesTool.description,
            CreateAppGuidelinesTool.inputSchema,
            CreateAppGuidelinesTool.fn
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
        this.server.tool(
            this.versionControlGitTool.name,
            this.versionControlGitTool.description,
            this.versionControlGitTool.inputSchema,
            this.versionControlGitTool.handler
        )
    }

    async run() {
        const transport = new StdioServerTransport()
        await this.server.connect(transport)
        console.error('PWA Storefront MCP server (McpServer version) running on stdio')
    }
}

const server = new PwaStorefrontMCPServerHighLevel()
server.run().catch(console.error)
