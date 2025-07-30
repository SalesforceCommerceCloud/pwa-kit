# 🚀 PWA Kit MCP Server

An MCP server that brings AI-assisted coding to **PWA Kit** storefront app development inside your IDE.

## 🔍 What is MCP?

**Model Context Protocol (MCP)** is an open protocol that enables secure, structured communication between host applications (like [Cursor IDE](https://www.cursor.so/) or other AI development tools) and external tools or data sources.

It allows AI agents to query context-aware services like this server to help developers build better software, faster.

👉 **[Read more at modelcontext.org](https://modelcontext.org)**


## 🧰 Features

The PWA Kit MCP Server offers the following intelligent tools tailored to Salesforce Commerce Cloud PWA development:

* **`create_app_guidelines`**
  Guides agents and developers through creating a new PWA Kit project with `@salesforce/pwa-kit-create-app`.

* **`create_new_sample_component`**
  Walks developers through a brief Q\&A to scaffold a component using the commerce data model, layout, and structure.

* **`create_sample_storefront_page`**
  Interactive tool to generate a new PWA storefront page with custom routing and components.

* **`development_guidelines`**
  Provides best practices and guidance for building PWA Kit storefronts.

* **`run_site_test`**
  Runs performance and accessibility audits on a provided site URL
  *Example: `https://pwa-kit.mobify-storefront.com`*


## ▶️ Running the MCP Server

### 🖥️ From Cursor IDE

1. Open **Cursor**.

2. Navigate to **Settings > Cursor Settings...**
![](https://raw.githubusercontent.com/SalesforceCommerceCloud/pwa-kit/refs/heads/develop/packages/pwa-kit-mcp/docs/images/cursor-settings.png)

3. Go to **Tools & Integrations > MCP Tools > New MCP Server**
![](https://raw.githubusercontent.com/SalesforceCommerceCloud/pwa-kit/refs/heads/develop/packages/pwa-kit-mcp/docs/images/cursor-mcp-tools.png)

4. Update your `mcp.json` like this (edit the placeholders as needed):
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

Once saved, Cursor will:

* Launch the MCP server
* Connect to it as a client
* Display the available tools in the UI and how you can invoke them

You can return to **MCP Tools** anytime to enable or disable specific tools or servers.

### 🧪 From Other MCP Clients

We currently only support Cursor IDE, but if you wish to try it out with your AI agent enabled IDE, you can manually run the server be following the below steps. **NOTE:** This server communicates via **stdio**, so it is important to ensure your IDE can communicate in this manner.

```bash
cd {{dir-to-mcp}}
npm run start
```

Then send JSON-RPC requests like:

```json
{"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}
{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "create_new_component", "arguments": {}}}
```

---

## 👩‍💻 Development

To run in development mode (with debug logs):

```bash
npm start
```

If you wish to rebuild the server whenever changes are made you can do so by running the following command:

```bash
npm run build:watch
```

The server logs to `stderr` and communicates using MCP via `stdio`.


## 📁 Key Files & Project Structure

```text
/ (root)
├── package.json
├── mcp.json
├── README.md
├── /src
│   ├── /server
│   │   └── server.js
│   ├── /tools
│   │   ├── create-new-component.js
│   │   ├── create-app-guideline.js
│   │   ├── developer-guideline.js
│   │   ├── site-test.js
│   │   └── ...
│   ├── /utils
│   │   └── utils.js
│   └── /data
│       ├── CategoryDocument.json
│       ├── DocumentList.json
│       └── ProductDocument.json
├── /docs
│   ├── /images
│   │   └── (used in README & guides)
│   └── cursor-integration-guide.md
└── /dist
```

### 🔹 File & Folder Overview

| Location       | Purpose                                                               |
| -------------- | --------------------------------------------------------------------- |
| `package.json` | Node.js dependencies and project scripts                              |
| `mcp.json`     | MCP client configuration (used by Cursor or other IDEs)               |
| `src/server/`  | Main server entry point (`server.js`)                                 |
| `src/tools/`   | Contains all MCP tools like `create-app-guideline`, `site-test`, etc. |
| `src/utils/`   | Shared utility functions                                              |
| `src/data/`    | Static documents (e.g., product/category data models) used by tools   |
| `docs/`        | Documentation and images for integration guides                       |
| `dist/`        | Compiled output when building the package                             |

