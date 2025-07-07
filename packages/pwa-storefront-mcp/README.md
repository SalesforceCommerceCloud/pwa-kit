# PWA Storefront MCP Server

A Model Context Protocol (MCP) server that provides AI coding assistance for developing  PWA-kit-based storefront apps in an IDE.

Install and run this MCP server as a local MCP server or run locally via `npx` (when it's available on `npm` in feature).

## What is MCP?

The Model Context Protocol (MCP) is an open protocol that enables secure connections between host applications, such as Claude Desktop or other AI assistants, and external data sources and tools.

## Features

The PWA Storefront MCP Server provides these features.

- `development_guidelines`: Helps developers understand and follow PWA Storefront developer guidelines and best practices.
- `create_new_sample_component`: Helps developers create a new sample PWA Storefront component. This feature guides developers through a few simple questions and then generates code for the component based on the commerce data model used, layouts, etc.
- `create_app_guidelines`: Helps developers generate a new PWA Storefront project.
- `run_site_test`: Run site performance or accessibility test for a given site URL (e.g. [https://pwa-kit.mobify-storefront.com](https://pwa-kit.mobify-storefront.com))

## Setup

Install dependencies and build under `pwa-kit` root directory:

```bash
cd {{pwa-kit root directory}}
npm ci
```

## Run the MCP Server

### Method 1: Run MCP Server from Cursor

1. Open the Cursor application.

2. In the Cursor Menu on the top menu bar, click **Settings** > **Cursor Settings...**. 

<img src="./docs/images/cursor-settings.png" alt="Cursor Settings Screenshot" width="50%" />

3. Click **Tools & Integrations** > **MCP Tools** > **New MCP Server**.

<img src="./docs/images/cursor-mcp-tools.png" alt="Cursor MCP Tools Screenshot" width="50%" />

The `mcp.json` file opens. Add this definition to your `mcp.json` file.

```json
{
  "mcpServers": {

    "pwa-storefront-mcp": {
      "command": "node {{parent-dir-to-mcp}}/pwa-storefront-mcp/dist/server/server.js",
      "transport": "stdio",
      "args": []
    }
  }
} 
```

After you modify the `mcp.json` file, cursor will do these actions.

- Start the MCP server.
- Connect to the MCP server as a client.
- List available tools.

You can go back to MCP Tools and choose to enable/disable any MCP Server or tools.

### Method 2: Run MCP Server from Claude

#### Using Claude Desktop

1. In the Claude app menu, on the top menu bar, click **Developer** > **Edit Config**.
The `claude_desktop_config.json` file opens.

<img src="./docs/images/claude-config.png" alt="Claude MCP Config Screenshot" width="50%" />

2. Add this server definition to your `claude_desktop_config.json`.

```json
{
  "mcpServers": {
    "pwa-storefront-mcp": {
      "command": "{{path-to-node}}/node",
      "transport": "stdio",
      "args": ["{{parent-dir-to-mcp}}}/pwa-storefront-mcp/dist/server/server.js"],
      "env": {
        "PWA_STOREFRONT_APP_PATH": "{{path-to-app-directory}}"
      }
    }
  }
}  
```

After you modify the `claude_desktop_config.json` file, Claude will do these actions.

- Start the MCP server.
- Connect to the MCP server as a client.
- List available tools.

<img src="./docs/images/claude-list-tools.png" alt="Claude MCP Tools Screenshot" width="40%" />

You can also enable/disable any available tools from here.

#### Using other MCP clients
The server runs on stdio, so you can test it with any MCP-compatible client.

### Method 3: Manually start MCP Server

You can also manually start the server from command line and sending JSON-RPC messages:

```bash
cd {{dir-to-mcp}}
# Start the server
npm run start

# Then send JSON-RPC requests to stdin:
{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}
{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "create_new_component", "arguments": {}}}
```

## Files

- `server.js` - Main MCP server implementation
- `mcp.json` - MCP configuration file for clients
- `package.json` - Node.js dependencies and scripts

## Development

To run the server in development mode:
```bash
npm start
```

The server outputs debug information to stderr and handle MCP protocol messages via stdio.

# Project Structure

```
/ (root)
  - package.json
  - package-lock.json
  - README.md
  - mcp.json
  - claude_desktop_config.json
  /src
    /server
      - server.js
    /utils
      - pwa-developer-guideline-tool.js
      - utils.js
    /tests
      - test-mcp.js
  /docs
    /images
        - claude-config.png
        - claude-list-tools.png
        - cursor-list-tools.png
        - cursor-settings.pnb
    - cursor-integration-guide.md
  /node_modules
```

- Server code is in `src/server/`.
- Utilities/tools are in `src/utils/`.
- Documentation is in `docs/`.
