#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { AddComponentTool } from '../utils/AddComponentTool.js';
import { InsertExistingComponentTool } from '../utils/InsertExistingComponentTool.js';
import { CreateNewComponentTool } from '../utils/CreateNewComponentTool.js';
import fs from 'fs/promises';
import path from 'path';

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
    this.insertExistingComponentTool = new InsertExistingComponentTool();
    this.CreateNewComponentTool = new CreateNewComponentTool();
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
        'insert_existing_component',
        'Insert an existing React component into an existing page',
        {
          componentName: z.string().describe('Component name'),
          targetPage: z.string().describe('Target page name or path'),
          options: z.object({
            beforeComponentName: z.string().optional().describe('Insert before Component name'),
            afterComponentName: z.string().optional().describe('Insert after Component name')
          }).optional()
        },
        async (args) => {
          try {
            const modifiedCode = this.insertExistingComponentTool.insertComponentIntoPage(
              args.targetPage,
              args.componentName
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
        'create_new_component',
        'Create a new React component file based on the provided code or a new component',
        {
          componentName: z.string().describe('Name of the component to create'),
          componentCode: z.string().optional().describe('Code of the component to create'),
          projectDir: z.string().optional().describe('Directory of Retail React App')
        },
        async (args) => {
          try {
            const componentCode = this.CreateNewComponentTool.createNewComponent
                (
              args.componentName,
              args.componentCode,
              args.projectDir
            );
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    success: true,
                    componentName: args.componentName,
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
