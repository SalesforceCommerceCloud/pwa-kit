/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'path'
import fs from 'fs'
import {spawn} from 'child_process'

// Resolve the @babel/node CLI entry file without relying on import.meta or .bin shims
const BABEL_NODE_CLI = [
    // package-local node_modules (from this package root)
    path.resolve(__dirname, '../../node_modules/@babel/node/bin/babel-node.js'),
    // repo root fallback
    path.resolve(process.cwd(), 'node_modules/@babel/node/bin/babel-node.js')
].find((candidate) => {
    try {
        return fs.existsSync(candidate)
    } catch {
        return false
    }
})

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

describe('PWA Storefront MCP server', () => {
    let child

    const startServer = () => {
        const serverEntry = path.resolve(__dirname, 'server.js')
        if (!BABEL_NODE_CLI) {
            throw new Error('Could not locate @babel/node CLI (babel-node.js)')
        }
        child = spawn(process.execPath, [BABEL_NODE_CLI, serverEntry], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: {
                ...process.env
            }
        })
        return child
    }

    const stopServer = async () => {
        if (!child) return
        try {
            // Gracefully close stdin to trigger server shutdown handler
            child.stdin.end()
        } catch {
            // ignore
        }
        // Give the server a moment to exit cleanly, then ensure it's killed
        await new Promise((resolve) => {
            const timeout = setTimeout(() => {
                try {
                    child.kill('SIGTERM')
                } catch {
                    // ignore
                }
                resolve()
            }, 500)
            child.on('exit', () => {
                clearTimeout(timeout)
                resolve()
            })
        })
        child = null
    }

    afterEach(async () => {
        await stopServer()
    })

    it('responds to tools/list with expected tools registered', async () => {
        const proc = startServer()

        const response = await sendJsonRpcRequest(proc, {
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/list',
            params: {}
        })

        expect(response).toBeTruthy()
        expect(response.id).toBe(1)
        expect(response.result).toBeTruthy()
        expect(Array.isArray(response.result.tools)).toBe(true)

        const toolNames = response.result.tools.map((t) => t.name)

        // Core tools registered by server.js
        expect(toolNames).toEqual(
            expect.arrayContaining([
                'create_storefront_app',
                'get_development_guidelines',
                'run_site_test',
                'create_component',
                'create_page'
            ])
        )
    })
})
