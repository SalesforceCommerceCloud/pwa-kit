#!/usr/bin/env node
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js'
import {StreamableHTTPServerTransport} from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import {isInitializeRequest} from '@modelcontextprotocol/sdk/types.js'
import {createServer} from 'node:http'
import {randomUUID} from 'node:crypto'
import {z} from 'zod'
import logger from '../utils/logger.js'
// import {Readable} from 'node:stream'

import {
    CreateAppGuidelinesTool,
    CreateNewComponentTool,
    DeveloperGuidelinesTool,
    TestWithPlaywrightTool,
    CreateNewPageTool,
    VersionControlGitTool
} from '../tools'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const packageJson = require('../../package.json')
const FALLBACK_VERSION = '0.1.0'

class PwaStorefrontMCPServerHighLevel {
    constructor() {
        logger.debug('Initializing tools...')
        this.createNewComponentTool = new CreateNewComponentTool()
        this.versionControlGitTool = new VersionControlGitTool()
        this.testWithPlaywrightTool = new TestWithPlaywrightTool()
    }

    createConfiguredMcpServer() {
        logger.info('Creating configured MCP server instance')
        const server = new McpServer(
            {name: 'pwa-kit-mcp', version: packageJson?.version || FALLBACK_VERSION},
            {capabilities: {tools: {}}}
        )

        // Tool registration
        logger.debug('Registering tools...')
        server.tool(
            CreateAppGuidelinesTool.name,
            CreateAppGuidelinesTool.description,
            CreateAppGuidelinesTool.inputSchema,
            CreateAppGuidelinesTool.fn
        )
        logger.info({toolName: CreateAppGuidelinesTool.name}, 'Registered MCP tool')
        server.tool(
            DeveloperGuidelinesTool.name,
            DeveloperGuidelinesTool.description,
            DeveloperGuidelinesTool.inputSchema,
            DeveloperGuidelinesTool.fn
        )
        logger.info({toolName: DeveloperGuidelinesTool.name}, 'Registered MCP tool')
        server.tool(
            'run_site_test',
            'Run site performance or accessibility test for a given site URL (e.g. https://pwa-kit.mobify-storefront.com)',
            {
                testType: z.enum(['performance', 'accessibility']).describe('Type of test to run'),
                siteUrl: z.string().optional().describe('Site URL to test (optional)')
            },
            ({testType, siteUrl}) => {
                logger.info({testType, siteUrl}, 'Running site test')
                return this.testWithPlaywrightTool.run(testType, siteUrl)
            }
        )
        logger.info({toolName: 'run_site_test'}, 'Registered MCP tool')
        server.tool(
            this.createNewComponentTool.name,
            this.createNewComponentTool.description,
            this.createNewComponentTool.inputSchema,
            this.createNewComponentTool.handler
        )
        logger.info({toolName: this.createNewComponentTool.name}, 'Registered MCP tool')
        server.tool(
            CreateNewPageTool.name,
            CreateNewPageTool.description,
            CreateNewPageTool.inputSchema,
            CreateNewPageTool.handler
        )
        logger.info({toolName: CreateNewPageTool.name}, 'Registered MCP tool')
        server.tool(
            this.versionControlGitTool.name,
            this.versionControlGitTool.description,
            this.versionControlGitTool.inputSchema,
            this.versionControlGitTool.handler
        )
        logger.info({toolName: this.versionControlGitTool.name}, 'Registered MCP tool')

        logger.debug('All tools registered')
        return server
    }

    async run() {
        const sessions = new Map()
        const SESSION_GRACE_PERIOD_MS = 30000

        const setCorsHeaders = (res) => {
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Access-Control-Allow-Methods', 'POST, GET, DELETE, OPTIONS')
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, mcp-session-id')
            res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id')
        }

        const readJsonBody = (req) =>
            new Promise((resolve) => {
                let data = ''
                req.on('data', (chunk) => {
                    data += chunk
                })
                req.on('end', () => {
                    if (!data) return resolve(undefined)
                    try {
                        resolve(JSON.parse(data))
                    } catch (e) {
                        logger.warn('Invalid JSON received in request body')
                        resolve(undefined)
                    }
                })
            })

        const server = createServer(async (req, res) => {
            setCorsHeaders(res)

            if (req.method === 'OPTIONS') {
                res.writeHead(204)
                res.end()
                return
            }

            const url = new URL(req.url || '/', 'http://localhost')
            if (url.pathname !== '/mcp') {
                logger.warn({path: url.pathname}, '404 Not Found')
                res.writeHead(404, {'content-type': 'text/plain'})
                res.end('Not Found')
                return
            }

            const sessionIdHeader = req.headers['mcp-session-id']
            const existing = sessionIdHeader ? sessions.get(sessionIdHeader) : undefined

            try {
                if (req.method === 'POST') {
                    const body = await readJsonBody(req)

                    if (existing) {
                        logger.debug({sessionId: sessionIdHeader}, 'Reusing existing session')
                        await existing.transport.handleRequest(req, res, body)
                        return
                    }

                    if (!isInitializeRequest(body)) {
                        logger.error('Bad request: No valid session ID provided')
                        res.writeHead(400, {'content-type': 'application/json'})
                        res.end(
                            JSON.stringify({
                                jsonrpc: '2.0',
                                error: {
                                    code: -32000,
                                    message: 'Bad Request: No valid session ID provided'
                                },
                                id: null
                            })
                        )
                        return
                    }

                    logger.info('Creating new session...')
                    let transport
                    let mcpServer
                    transport = new StreamableHTTPServerTransport({
                        sessionIdGenerator: () => randomUUID(),
                        onsessioninitialized: (sid) => {
                            sessions.set(sid, {transport, server: mcpServer})
                            logger.info({sessionId: sid}, 'Session initialized')
                            res.setHeader('Mcp-Session-Id', sid)
                        }
                    })

                    mcpServer = this.createConfiguredMcpServer()

                    transport.onclose = () => {
                        const sid = transport.sessionId
                        if (!sid) return
                        logger.debug(
                            {sessionId: sid},
                            'Session transport closed, scheduling cleanup'
                        )
                        setTimeout(() => {
                            if (sessions.get(sid)?.transport === transport) {
                                sessions.delete(sid)
                                if (mcpServer && typeof mcpServer.close === 'function') {
                                    mcpServer.close()
                                    logger.info({sessionId: sid}, 'Session cleaned up')
                                }
                            }
                        }, SESSION_GRACE_PERIOD_MS)
                    }

                    await mcpServer.connect(transport)
                    await transport.handleRequest(req, res, body)
                    return
                }

                if (req.method === 'GET' || req.method === 'DELETE') {
                    if (!existing) {
                        logger.error('Invalid or missing session ID')
                        res.writeHead(400, {'content-type': 'text/plain'})
                        res.end('Invalid or missing session ID')
                        return
                    }
                    logger.debug(
                        {method: req.method, sessionId: sessionIdHeader},
                        'Handling request'
                    )
                    await existing.transport.handleRequest(req, res)
                    return
                }

                logger.warn({method: req.method}, 'Method not allowed')
                res.writeHead(405, {'content-type': 'application/json'})
                res.end(
                    JSON.stringify({
                        jsonrpc: '2.0',
                        error: {code: -32000, message: 'Method not allowed.'},
                        id: null
                    })
                )
            } catch (error) {
                if (error?.message?.includes('terminated')) {
                    logger.debug('Ignoring SSE termination error')
                    return
                }
                logger.error({err: error}, 'Error handling MCP request')
                if (!res.headersSent) {
                    res.writeHead(500, {'content-type': 'application/json'})
                    res.end(
                        JSON.stringify({
                            jsonrpc: '2.0',
                            error: {code: -32603, message: 'Internal server error'},
                            id: null
                        })
                    )
                }
            }
        })

        server.keepAliveTimeout = 0
        server.headersTimeout = 0
        server.timeout = 0

        // server.on('request', (req, res) => {
        //     const chunks = []
        //     req.on('data', (chunk) => {
        //         chunks.push(chunk)
        //     })

        //     req.on('end', () => {
        //         const rawBody = Buffer.concat(chunks).toString('utf8')

        //         try {
        //             const jsonBody = JSON.parse(rawBody)
        //             logger.info({jsonBody}, 'Full MCP request payload')
        //         } catch (err) {
        //             logger.warn({rawBody, err}, 'Failed to parse MCP request body as JSON')
        //         }

        //         // Re-create a readable stream from rawBody
        //         const newReq = new Readable()
        //         newReq.push(rawBody)
        //         newReq.push(null)
        //         newReq.headers = req.headers
        //         newReq.method = req.method
        //         newReq.url = req.url

        //         // Remove this handler temporarily to avoid infinite loop
        //         server.off('request', arguments.callee)
        //         server.emit('request', newReq, res)
        //         server.on('request', arguments.callee)
        //     })

        //     req.on('error', (err) => {
        //         logger.error({err}, 'Error reading MCP request body')
        //         res.writeHead(500, {'content-type': 'text/plain'})
        //         res.end('Internal Server Error')
        //     })
        // })

        setInterval(() => {
            for (const {transport} of sessions.values()) {
                try {
                    transport.send({
                        jsonrpc: '2.0',
                        method: 'ping',
                        params: {time: Date.now()}
                    })
                } catch {} // eslint-disable-line no-empty
            }
        }, 15000)

        const port = Number(process.env.PORT || 3001)
        server.listen(port, () => {
            logger.info(`PWA Storefront MCP server listening at http://localhost:${port}/mcp`)
        })
    }
}

const serverInstance = new PwaStorefrontMCPServerHighLevel()
serverInstance.run().catch((err) => {
    logger.fatal({err}, 'MCP server failed to start')
})
