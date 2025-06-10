#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { AddComponentTool } from './AddComponentTool.js';

class PwaStorefrontMCPServerHighLevel {
  constructor() {
    // Using McpServer instead of Server
    this.server = new McpServer(
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
    this.setupTools();
  }

  setupTools() {
    // Register tools using the high-level API

    this.server.tool(
      'analyze_code_structure',
      'Analyze JavaScript/React code structure to identify components, imports, and insertion points',
      {
        code: z.string().describe('The JavaScript/React code to analyze')
      },
      async (args) => {
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
      }
    );

    this.server.tool(
      'insert_react_component',
      'Insert a new React component into existing code',
      {
        code: z.string().describe('The existing JavaScript/React code'),
        componentType: z.enum(['button', 'card', 'modal', 'form', 'list', 'header', 'footer', 'product', 'cart'])
          .describe('Type of component to insert'),
        options: z.object({
          name: z.string().optional().describe('Component name'),
          variant: z.string().optional().describe('Component variant'),
          size: z.string().optional().describe('Component size'),
          styling: z.string().optional().describe('Styling system'),
          showHeader: z.boolean().optional().describe('Show header (for cards)'),
          showFooter: z.boolean().optional().describe('Show footer (for cards)'),
          showPrice: z.boolean().optional().describe('Show price (for products)'),
          showRating: z.boolean().optional().describe('Show rating (for products)'),
          closeOnOverlay: z.boolean().optional().describe('Close modal on overlay click')
        }).optional()
      },
      async (args) => {
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
      }
    );

    this.server.tool(
      'create_component_file',
      'Create a complete React component file',
      {
        componentName: z.string().describe('Name of the component to create'),
        componentType: z.enum(['button', 'card', 'modal', 'form', 'list', 'header', 'footer', 'product', 'cart'])
          .describe('Type of component to create'),
        options: z.object({
          variant: z.string().optional(),
          size: z.string().optional(),
          styling: z.string().optional(),
          framework: z.string().optional(),
          showHeader: z.boolean().optional(),
          showFooter: z.boolean().optional(),
          showPrice: z.boolean().optional(),
          showRating: z.boolean().optional(),
          closeOnOverlay: z.boolean().optional()
        }).optional()
      },
      async (args) => {
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
      }
    );
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('PWA Storefront MCP server (McpServer version) running on stdio');
  }
}

const server = new PwaStorefrontMCPServerHighLevel();
server.run().catch(console.error); 