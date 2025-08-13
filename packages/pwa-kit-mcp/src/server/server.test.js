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
            stdio: ['pipe', 'pipe', 'inherit'],
            env: {
                ...process.env,
                // NOTE: THIS ENV VAR IS  USUALLY SET BY CURSOR OR THE MCP SERVER?
                WORKSPACE_FOLDER_PATHS: path.resolve(process.cwd(), '..', '..')
            }
        })

        // Wait a moment for the server to start
        await new Promise((r) => setTimeout(r, 500))

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

        child.kill()
    }, 10000)
})
