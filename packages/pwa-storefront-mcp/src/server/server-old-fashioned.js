#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { AddComponentTool } from './AddComponentTool.js';

class PwaStorefrontMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'pwa-storefront-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.addComponentTool = new AddComponentTool();
    this.setupToolHandlers();
  }

  setupToolHandlers() {
    this.setupToolListHandler();
    this.setupToolCallHandler();
  }

  setupToolListHandler() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'analyze_code_structure',
            description: 'Analyze JavaScript/React code structure to identify components, imports, and insertion points',
            inputSchema: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'The JavaScript/React code to analyze'
                }
              },
              required: ['code'],
            },
          },
          {
            name: 'insert_react_component',
            description: 'Insert a new React component into existing code',
            inputSchema: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'The existing JavaScript/React code'
                },
                componentType: {
                  type: 'string',
                  enum: ['button', 'card', 'modal', 'form', 'list', 'header', 'footer', 'product', 'cart'],
                  description: 'Type of component to insert'
                },
                options: {
                  type: 'object',
                  description: 'Component-specific options (name, variant, size, etc.)',
                  properties: {
                    name: { type: 'string', description: 'Component name' },
                    variant: { type: 'string', description: 'Component variant (primary, secondary, etc.)' },
                    size: { type: 'string', description: 'Component size (small, medium, large)' },
                    styling: { type: 'string', description: 'Styling system (tailwind, css)' },
                    showHeader: { type: 'boolean', description: 'Show header (for cards)' },
                    showFooter: { type: 'boolean', description: 'Show footer (for cards)' },
                    showPrice: { type: 'boolean', description: 'Show price (for products)' },
                    showRating: { type: 'boolean', description: 'Show rating (for products)' },
                    closeOnOverlay: { type: 'boolean', description: 'Close modal on overlay click' }
                  }
                }
              },
              required: ['code', 'componentType'],
            },
          },
          {
            name: 'create_component_file',
            description: 'Create a complete React component file',
            inputSchema: {
              type: 'object',
              properties: {
                componentName: {
                  type: 'string',
                  description: 'Name of the component to create'
                },
                componentType: {
                  type: 'string',
                  enum: ['button', 'card', 'modal', 'form', 'list', 'header', 'footer', 'product', 'cart'],
                  description: 'Type of component to create'
                },
                options: {
                  type: 'object',
                  description: 'Component-specific options',
                  properties: {
                    variant: { type: 'string' },
                    size: { type: 'string' },
                    styling: { type: 'string' },
                    framework: { type: 'string' },
                    showHeader: { type: 'boolean' },
                    showFooter: { type: 'boolean' },
                    showPrice: { type: 'boolean' },
                    showRating: { type: 'boolean' },
                    closeOnOverlay: { type: 'boolean' }
                  }
                }
              },
              required: ['componentName', 'componentType'],
            },
          },
        ],
      };
    });
  }

  setupToolCallHandler() {
    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'analyze_code_structure':
          try {
            const analysis = this.addComponentTool.analyzeCodeStructure(args.code);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    analysis,
                    summary: {
                      totalImports: analysis.imports.length,
                      totalComponents: analysis.components.length,
                      hasReact: analysis.hasReact,
                      hasNextJs: analysis.hasNextJs,
                      hasTailwind: analysis.hasTailwind,
                      insertionPoints: analysis.insertionPoints.length
                    }
                  }, null, 2),
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({ error: error.message }, null, 2),
                },
              ],
              isError: true,
            };
          }

        case 'insert_react_component':
          try {
            const modifiedCode = this.addComponentTool.insertComponent(
              args.code,
              args.componentType,
              args.options || {}
            );
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    success: true,
                    modifiedCode,
                    componentType: args.componentType,
                    options: args.options
                  }, null, 2),
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({ error: error.message }, null, 2),
                },
              ],
              isError: true,
            };
          }

        case 'create_component_file':
          try {
            const componentCode = this.addComponentTool.createComponentFile(
              args.componentName,
              args.componentType,
              args.options || {}
            );
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    success: true,
                    componentName: args.componentName,
                    componentType: args.componentType,
                    code: componentCode
                  }, null, 2),
                },
              ],
            };
          } catch (error) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({ error: error.message }, null, 2),
                },
              ],
              isError: true,
            };
          }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('PWA Storefront MCP server running on stdio');
  }
}

const server = new PwaStorefrontMCPServer();
server.run().catch(console.error);
