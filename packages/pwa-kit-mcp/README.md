# PWA Storefront MCP Server

A Model Context Protocol (MCP) server that provides AI coding assistance for developing  PWA-kit-based storefront apps in an IDE.

Install and run this MCP server as a local MCP server or run locally via `npx` (when it's available on `npm` in feature).

## What is MCP?

The Model Context Protocol (MCP) is an open protocol that enables secure connections between host applications, such as Claude Desktop or other AI assistants, and external data sources and tools.

## Features

The PWA Storefront MCP Server provides these features.

- `development_guidelines`: Helps developers understand and follow PWA Storefront developer guidelines and best practices.
- `create_new_sample_component`: Helps developers create a new sample PWA Storefront component. This feature guides developers through a few simple questions and then generates code for the component based on the commerce data model used, layouts, etc.
- `create_app_guidelines`: This tool provides all the information an agent needs to correctly scaffold a new PWA Kit app using the `@salesforce/pwa-kit-create-app` CLI. 

  It returns:
    - Project creation guidelines for agent behavior
    - CLI description and available options
    - Input schemas for presets or templates

    The output enables agents to ask the right questions and use the CLI correctly without ever mixing unsupported options.

    **Example Triggers**

    This tool is automatically used when the user expresses intent to create a project, such as:

    - "Create a new PWA Kit app."
    - "Start a new storefront using a preset."
    - "What templates are available for PWA Kit?"
    - "What PWA-Kit presets are available?"
    - "Create a PWA-Kit project using the `retail-react-app-demo` preset in the `~/test-project` directory."
- `run_site_test`: Run site performance or accessibility test for a given site URL (e.g. [https://pwa-kit.mobify-storefront.com](https://pwa-kit.mobify-storefront.com))
-`create_sample_storefront_page`: Helps developers create a new sample PWA Storefront page. This feature guides develoopers through a few simple questions and then generates code for the page based on the name of the page, components included, and route.

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

<img src="https://raw.githubusercontent.com/SalesforceCommerceCloud/pwa-kit/refs/heads/develop/packages/pwa-kit-mcp/docs/images/cursor-settings.png" alt="Cursor Settings Screenshot" width="50%" />

3. Click **Tools & Integrations** > **MCP Tools** > **New MCP Server**.

<img src="https://raw.githubusercontent.com/SalesforceCommerceCloud/pwa-kit/refs/heads/develop/packages/pwa-kit-mcp/docs/images/cursor-mcp-tools.png" alt="Cursor MCP Tools Screenshot" width="50%" />

The `mcp.json` file opens. Add this definition to your `mcp.json` file and replace {{parent-dir-to-mcp}} and {{path-to-app-directory}} placeholders with correct values.

```json
{
  "mcpServers": {
    "pwa-kit-mcp": {
      "command": "npx",
      "args": ["-y", "@salesforce/pwa-kit-mcp"],
      "env": {
        "PWA_STOREFRONT_APP_PATH": "{{path-to-app-directory}}"
      }
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

<img src="https://raw.githubusercontent.com/SalesforceCommerceCloud/pwa-kit/refs/heads/develop/packages/pwa-kit-mcp/docs/images/claude-config.png" alt="Claude MCP Config Screenshot" width="50%" />

2. Add this server definition to your `claude_desktop_config.json` and replace {{path-to-node}}, {{parent-dir-to-mcp}} and {{path-to-app-directory}} placeholders with correct values.

```json
{
  "mcpServers": {
    "pwa-kit-mcp": {
      "command": "npx",
      "args": ["-y", "@salesforce/pwa-kit-mcp"],
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

<img src="https://raw.githubusercontent.com/SalesforceCommerceCloud/pwa-kit/refs/heads/develop/packages/pwa-kit-mcp/docs/images/claude-list-tools.png" alt="Claude MCP Tools Screenshot" width="40%" />

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
  - CHANGELOG.md
  - mcp.json
  - claude_desktop_config.json
  - babel.config.js
  - jest.config.js
  - jest-setup.js
  - .eslintrc.js
  - .eslintignore
  /src
    /server
      - server.js
      - server.test.js
    /tools
      - index.js
      - developer-guideline.js
      - developer-guideline.test.js
      - create-app-guideline.js
      - create-app-guideline.test.js
      - create-new-component.js
      - create-new-component.test.js
      - site-test.js
      - site-test.test.js
      - site-test-accessibility.js
      - site-test-performance.js
    /utils
      - index.js
      - utils.js
      - utils.test.js
    /data
      - CategoryDocument.json
      - DocumentList.json
      - ProductDocument.json
  /docs
    /images
        - claude-config.png
        - claude-list-tools.png
        - cursor-mcp-tools.png
        - cursor-settings.png
    - cursor-integration-guide.md
  /dist
```

- Server code is in `src/server/`.
- MCP tools are in `src/tools/`.
- Utilities are in `src/utils/`.
- Data files are in `src/data/`.
- Documentation is in `docs/`.
- Built distribution files are in `dist/`.
