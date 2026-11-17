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
    it.each([false, true])(
        'should list tools and warn once on stderr (TTY: %s)',
        async (isTTY) => {
            const warning =
                '[DEPRECATED] @salesforce/pwa-kit-mcp is discontinued. Use @salesforce/b2c-dx-mcp instead. Setup instructions: https://salesforcecommercecloud.github.io/b2c-developer-tooling/mcp/'
            const expectedWarning = isTTY ? `\u001b[33m${warning}\u001b[0m` : warning
            const args = isTTY
                ? [
                      '--eval',
                      "Object.defineProperty(process.stderr, 'isTTY', {value: true}); process.argv = [process.execPath, 'src/server/server.js', '--no-telemetry']; require('./src/server/server.js')"
                  ]
                : ['src/server/server.js', '--no-telemetry']
            const child = spawn(BABEL_NODE_PATH, args, {
                cwd: process.cwd(),
                stdio: ['pipe', 'pipe', 'pipe'],
                env: {
                    ...process.env,
                    // NOTE: THIS ENV VAR IS  USUALLY SET BY CURSOR OR THE MCP SERVER?
                    WORKSPACE_FOLDER_PATHS: path.resolve(process.cwd(), '..', '..')
                }
            })
            let stderr = ''
            child.stderr.on('data', (chunk) => {
                stderr += chunk.toString()
            })

            try {
                await new Promise((resolve, reject) => {
                    const timer = setTimeout(() => {
                        child.stderr.off('data', onData)
                        reject(new Error('Timed out waiting for the startup warning'))
                    }, 5000)
                    const onData = () => {
                        if (stderr.includes(`${expectedWarning}\n`)) {
                            clearTimeout(timer)
                            child.stderr.off('data', onData)
                            resolve()
                        }
                    }
                    child.stderr.on('data', onData)
                })

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
                expect(toolNames).toContain('pwakit_get_dev_guidelines')
                const warningLines = stderr.split('\n').filter((line) => line.includes(warning))
                expect(warningLines).toEqual([expectedWarning])
            } finally {
                child.kill()
            }
        },
        10000
    )
})
