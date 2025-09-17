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
        let buffer = ''
        let timeoutId
        const onData = (chunk) => {
            buffer += chunk.toString()
            const lines = buffer.split('\n')
            buffer = lines.pop() || ''
            for (const raw of lines) {
                const line = raw.trim()
                if (!line) continue
                // Ignore non-JSON lines (e.g., startup logs)
                if (!(line.startsWith('{') || line.startsWith('['))) continue
                try {
                    const parsed = JSON.parse(line)
                    child.stdout.off('data', onData)
                    if (timeoutId) clearTimeout(timeoutId)
                    resolve(parsed)
                    return
                } catch {
                    // Ignore parse errors for non-JSON lines and continue
                }
            }
        }
        child.stdout.on('data', onData)
        child.stdin.write(JSON.stringify(request) + '\n')
        // Safety timeout to avoid hanging tests
        timeoutId = setTimeout(() => {
            try {
                child.stdout.off('data', onData)
            } catch {
                // ignore
            }
            reject(new Error('Timed out waiting for JSON-RPC response'))
        }, 5000)
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
        expect(toolNames).toContain('get_development_guidelines')

        // Explicit teardown: close stdin, terminate child, and await exit
        try {
            child.stdin.end()
        } catch {
            // ignore
        }
        try {
            child.kill('SIGTERM')
        } catch {
            // ignore
        }
        await new Promise((resolve) => child.once('exit', resolve))
    }, 10000)
})
