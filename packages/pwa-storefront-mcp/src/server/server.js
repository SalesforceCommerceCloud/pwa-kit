#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { AddComponentTool } from '../utils/AddComponentTool.js';
import { InsertExistingComponentTool } from '../utils/InsertExistingComponentTool.js';
import { CreateNewComponentTool } from '../utils/CreateNewComponentTool.js';
import fs from 'fs/promises';
import path from 'path';
import { Developing_LWC_Guidelines } from './pwa-developing-guide.js';

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

    // this.server.tool(
    //   'insert_new_react_component',
    //   'Insert a new React component into existing code',
    //   {
    //     code: z.string().describe('The existing JavaScript/React code'),
    //     componentType: z.enum(['button', 'card', 'modal', 'form', 'list', 'header', 'footer', 'product', 'cart'])
    //       .describe('Type of component to insert'),
    //     options: z.object({
    //       name: z.string().optional().describe('Component name'),
    //       variant: z.string().optional().describe('Component variant'),
    //       size: z.string().optional().describe('Component size'),
    //       styling: z.string().optional().describe('Styling system'),
    //       showHeader: z.boolean().optional().describe('Show header (for cards)'),
    //       showFooter: z.boolean().optional().describe('Show footer (for cards)'),
    //       showPrice: z.boolean().optional().describe('Show price (for products)'),
    //       showRating: z.boolean().optional().describe('Show rating (for products)'),
    //       closeOnOverlay: z.boolean().optional().describe('Close modal on overlay click')
    //     }).optional()
    //   },
    //   async (args) => {
    //     try {
    //       const modifiedCode = this.addComponentTool.insertComponent(
    //         args.code,
    //         args.componentType,
    //         args.options || {}
    //       );
    //       return {
    //         content: [
    //           {
    //             type: 'text',
    //             text: JSON.stringify({
    //               success: true,
    //               modifiedCode,
    //               componentType: args.componentType,
    //               options: args.options
    //             }, null, 2),
    //           },
    //         ],
    //       };
    //     } catch (error) {
    //       return {
    //         content: [
    //           {
    //             type: 'text',
    //             text: JSON.stringify({ error: error.message }, null, 2),
    //           },
    //         ],
    //         isError: true,
    //       };
    //     }
    //   }
    // );

    this.server.tool(
        'insert_existing_component',
        'Insert an existing React component into an existing page',
        {
          componentName: z.string().describe('Component name'),
          targetPage: z.string().describe('Target page name or path')
        //   options: z.object({
        //     beforeComponentName: z.string().optional().describe('Insert before Component name'),
        //     afterComponentName: z.string().optional().describe('Insert after Component name')
        //   }).optional()
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

    // this.server.tool(
    //   'create_component_file',
    //   'Create a complete React component file',
    //   {
    //     componentName: z.string().describe('Name of the component to create'),
    //     componentType: z.enum(['button', 'card', 'modal', 'form', 'list', 'header', 'footer', 'product', 'cart'])
    //       .describe('Type of component to create'),
    //     options: z.object({
    //       variant: z.string().optional(),
    //       size: z.string().optional(),
    //       styling: z.string().optional(),
    //       framework: z.string().optional(),
    //       showHeader: z.boolean().optional(),
    //       showFooter: z.boolean().optional(),
    //       showPrice: z.boolean().optional(),
    //       showRating: z.boolean().optional(),
    //       closeOnOverlay: z.boolean().optional()
    //     }).optional()
    //   },
    //   async (args) => {
    //     try {
    //       const componentCode = this.addComponentTool.createComponentFile(
    //         args.componentName,
    //         args.componentType,
    //         args.options || {}
    //       );
    //       return {
    //         content: [
    //           {
    //             type: 'text',
    //             text: JSON.stringify({
    //               success: true,
    //               componentName: args.componentName,
    //               componentType: args.componentType,
    //               code: componentCode
    //             }, null, 2),
    //           },
    //         ],
    //       };
    //     } catch (error) {
    //       return {
    //         content: [
    //           {
    //             type: 'text',
    //             text: JSON.stringify({ error: error.message }, null, 2),
    //           },
    //         ],
    //         isError: true,
    //       };
    //     }
    //   }
    // );

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

    // Register pwa-developing-guide tool
    this.server.tool(
      Developing_LWC_Guidelines.name,
      Developing_LWC_Guidelines.description,
      {},
      Developing_LWC_Guidelines.fn
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
