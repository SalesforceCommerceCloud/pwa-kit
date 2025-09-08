#!/usr/bin/env node

/**
 * PWA Kit MCP Server with Theming Tool
 * This server provides theming functionality that can be integrated with GitHub MCP server
 */

const { createServer } = require('@modelcontextprotocol/sdk/server/index.js')
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js')
const { themingTool, handleThemingTool } = require('./theming-tool.js')

// Create MCP server
const server = createServer({
    name: 'pwa-kit-mcp-server',
    version: '1.0.0'
})

// Register our theming tool
server.tool(themingTool, handleThemingTool)

// Start the server
async function main() {
    const transport = new StdioServerTransport()
    await server.connect(transport)
    console.error('PWA Kit MCP Server with Theming Tool started')
}

main().catch(console.error)
