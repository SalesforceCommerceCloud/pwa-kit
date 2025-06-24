# PWA Storefront MCP Server

An Model Context Protocol (MCP) server that helps PWA Storefront developers with development.

## What is MCP?

The Model Context Protocol (MCP) is an open protocol that enables secure connections between host applications (like Claude Desktop or other AI assistants) and external data sources and tools.

## Features

This MCP server provides:
- `development_guidelines`: Help developers to understand and follow PWA Storefront developer guidelines and best practices
- `create_new_component`: Help developers to create a new PWA Storefront component
- `submit_pwa_kit_project_answers`: Help developers to generate a new PWA Storefront project

## Setup

1. Install dependencies:
```bash
npm install
```

## Run the MCP Server

### Method 1: Run MCP Server From Cursor
Open Cursor Application

Go to Cursor Menu on top menu bar, then *Settings* > *Cursor Settings...* 

<img src="./docs/images/cursor-settings.png" alt="Cursor Settings Screenshot" width="50%" />

Select Tools & Integrations > MCP Tools > New MCP Server

<img src="./docs/images/cursor-mcp-tools.png" alt="Cursor MCP Tools Screenshot" width="50%" />

You will be led to mcp.json file. Add this to your mcp.json:
``` json
{
  "mcpServers": {

    "pwa-storefront-mcp": {
      "command": "node {{parent-dir-to-mcp}}/pwa-storefront-mcp/src/server/server.js",
      "transport": "stdio",
      "args": []
    }
  }
} 
```

Cursor will:
- Start the MCP server
- Connect to it as a client
- List available tools

You can go back to MCP Tools choose to enable/disable any MCP Server or tools.

### Method 2: Run MCP Server from Claude

#### Using Claude Desktop
1. Go to Claude menu on top menu bar then "Developer" > "Edit Config"
This will lead you to "claude_desktop_config.json" file.

<img src="./docs/images/claude-config.png" alt="Claude MCP Config Screenshot" width="50%" />

2. Add this server to your claude_desktop_config.json:
```json
{
  "mcpServers": {
    "pwa-storefront-mcp": {
      "command": "{{path-to-node}}/node",
      "transport": "stdio",
      "args": ["{{parent-dir-to-mcp}}}/pwa-storefront-mcp/src/server/server.js"]
    }
  }
}
```

Claude will:
- Start the MCP server
- Connect to it as a client
- List available tools
<img src="./docs/images/claude-list-tools.png" alt="Claude MCP Tools Screenshot" width="50%" />

#### Using other MCP clients
The server runs on stdio, so you can test it with any MCP-compatible client.

### Method 3: Direct stdio testing

You can also test directly by running the server and sending JSON-RPC messages:

```bash
# Start the server
node server.js

# Then send JSON-RPC requests to stdin:
{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}
{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "create_new_component", "arguments": {}}}
```

## Files

- `server.js` - Main MCP server implementation
- `test-mcp.js` - Automated test script
- `mcp.json` - MCP configuration file for clients
- `package.json` - Node.js dependencies and scripts

## Development

To run the server in development mode:
```bash
npm start
```

The server will output debug information to stderr and handle MCP protocol messages via stdio.

# Project Structure

```
/ (root)
  - package.json
  - package-lock.json
  - README.md
  - mcp.json
  - claude_desktop_config.json
  /src
    /components
      - index.js
      - PrimaryButton.jsx
      ... (other components)
    /server
      - server.js
      - server-old-fashioned.js
    /utils
      - AddComponentTool.js
    /scripts
      - create-button.js
      - demo.js
    /tests
      - test-mcp.js
  /docs
    - cursor-integration-guide.md
  /node_modules
  /.cursor
```

- All React components are in `src/components/`.
- Server code is in `src/server/`.
- Utilities/tools are in `src/utils/`.
- Scripts are in `src/scripts/`.
- Tests are in `src/tests/`.
- Documentation is in `docs/`.

Update your import paths accordingly. 