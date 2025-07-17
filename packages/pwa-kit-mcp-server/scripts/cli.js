#!/usr/bin/env node
/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const {Command} = require('commander')

// eslint-disable-next-line @typescript-eslint/no-var-requires
const {spawn, spawnSync} = require('cross-spawn')

// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path')

const program = new Command()

program
    .name('pwa-kit-mcp-server')
    .description('Run or install the PWA Kit MCP server')
    .version('0.1.0-preview.0')

// Start command
program
    .command('start')
    .description('Start the MCP server')
    .action(() => {
        console.log('Starting MCP server...')
        const serverPath = path.resolve(__dirname, '../dist/server/server.js')
        const child = spawn('node', [serverPath], {
            stdio: 'inherit'
        })

        child.on('exit', (code) => {
            console.log(`Server process exited with code ${code}`)
            process.exit(code)
        })

        child.on('error', (err) => {
            console.error('Failed to start server:', err)
        })
    })

// Install command with optional [ide] argument
program
    .command('install [ide]')
    .description('Install MCP server configuration into an IDE (default: cursor)')
    .action((ide = 'cursor') => {
        console.log(`Installing MCP server for IDE: ${ide}`)

        if (ide === 'cursor') {
            const result = spawn.sync('cursor', ['ide', 'install', '--tool', '@salesforce/pwa-kit-mcp-server'], {
                stdio: 'inherit'
            })
            process.exit(result.status)
        } else if (ide === 'claude') {
            console.error('Claude IDE support is not implemented yet.')
            process.exit(1)
        } else {
            console.error(`Unknown IDE: ${ide}`)
            process.exit(1)
        }
    })

// Fallback to "start" if no subcommand is given
if (!process.argv.slice(2).length) {
    process.argv.push('start')
}

program.parse(process.argv)
