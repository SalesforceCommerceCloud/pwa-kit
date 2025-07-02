/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {spawn} from 'cross-spawn'
import path from 'path'

const BABEL_NODE_PATH = path.resolve(
    './node_modules/.bin/babel-node' + (process.platform === 'win32' ? '.cmd' : '')
)

function sendJsonRpcRequest(child, request) {
    return new Promise((resolve, reject) => {
        let data = ''
        const onData = (chunk) => {
            data += chunk.toString()
            // MCP server sends each message as a line-delimited JSON
            if (data.includes('\n')) {
                child.stdout.off('data', onData)
                try {
                    // Only parse the first line (response)
                    const line = data.split('\n').find((l) => l.trim().length > 0)
                    resolve(JSON.parse(line))
                } catch (e) {
                    reject(e)
                }
            }
        }
        child.stdout.on('data', onData)
        child.stdin.write(JSON.stringify(request) + '\n')
    })
}

describe('PwaStorefrontMCPServerHighLevel integration', () => {
    it('should list registered tools via stdio', async () => {
        const child = spawn(BABEL_NODE_PATH, ['src/server/server.js'], {
            cwd: process.cwd(),
            stdio: ['pipe', 'pipe', 'inherit']
        })

        // Wait a moment for the server to start
        await new Promise((r) => setTimeout(r, 500))
    }, 10000)

    afterAll(async () => {
        // Clean up the server process
        if (child) {
            child.kill()
        }
    })

    it('should list registered tools via stdio', async () => {
        // Send the list tools request (JSON-RPC 2.0)
        const request = {
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/list',
            params: {}
        }
        const response = await sendJsonRpcRequest(child, request)
        expect(response).toHaveProperty('result')
        expect(response.result).toHaveProperty('tools')
        // Check that at least the DeveloperGuidelinesTool is present
        const toolNames = response.result.tools.map((t) => t.name)
        expect(toolNames).toContain('development_guidelines')
    }, 10000)

    it('should register CreateCustomizePageTool and list it in available tools', async () => {
        // Send the list tools request (JSON-RPC 2.0)
        const request = {
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/list',
            params: {}
        }
        const response = await sendJsonRpcRequest(child, request)
        expect(response).toHaveProperty('result')
        expect(response.result).toHaveProperty('tools')
        
        // Check that CreateCustomizePageTool is present
        const toolNames = response.result.tools.map((t) => t.name)
        expect(toolNames).toContain('create_or_custom_page')

        // Find the CreateCustomizePageTool in the tools list
        const createCustomizePageTool = response.result.tools.find((t) => t.name === 'create_or_custom_page')
        expect(createCustomizePageTool).toBeDefined()
        expect(createCustomizePageTool).toHaveProperty('description')
        expect(createCustomizePageTool.description).toContain('create or customize pages')
    }, 10000)

    it('should be able to call CreateCustomizePageTool and get guidelines', async () => {
        // Send the call tool request for CreateCustomizePageTool
        const request = {
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/call',
            params: {
                name: 'create_or_custom_page',
                arguments: {}
            }
        }
        const response = await sendJsonRpcRequest(child, request)
        expect(response).toHaveProperty('result')
        expect(response.result).toHaveProperty('content')
        expect(Array.isArray(response.result.content)).toBe(true)
        expect(response.result.content.length).toBeGreaterThan(0)
        
        // Check that the response contains the expected guidelines text
        const textContent = response.result.content.find((item) => item.type === 'text')
        expect(textContent).toBeDefined()
        expect(textContent.text).toContain('Creating and Overriding Pages in PWA Kit Composable Storefront')
        expect(textContent.text).toContain('Creating a New Page')
        expect(textContent.text).toContain('Overriding an Existing Page')
    }, 10000)
})
