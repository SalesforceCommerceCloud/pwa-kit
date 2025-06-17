#!/usr/bin/env node

import { spawn } from 'child_process';

// Example React code to analyze and modify
const exampleCode = `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>My PWA Storefront</h1>
      </header>
    </div>
  );
}

export default App;`;

async function demonstrateMCPTools() {
  console.log('🚀 Demonstrating MCP Server Tools...\n');

  // Start the MCP server process
  const serverProcess = spawn('node', ['server.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let responseData = '';
  
  serverProcess.stdout.on('data', (data) => {
    responseData += data.toString();
  });

  serverProcess.stderr.on('data', (data) => {
    console.log('Server:', data.toString().trim());
  });

  try {
    // Initialize connection
    const initRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'demo-client', version: '1.0.0' }
      }
    };
    serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');
    await wait(500);

    // Test 1: Analyze code structure
    console.log('📋 1. Analyzing code structure...');
    const analyzeRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'analyze_code_structure',
        arguments: { code: exampleCode }
      }
    };
    serverProcess.stdin.write(JSON.stringify(analyzeRequest) + '\n');
    await wait(1000);

    // Test 2: Insert a Product Card component
    console.log('\n🛍️ 2. Inserting a ProductCard component...');
    const insertRequest = {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'insert_react_component',
        arguments: {
          code: exampleCode,
          componentType: 'product',
          options: {
            name: 'ProductCard',
            styling: 'tailwind',
            showPrice: true,
            showRating: true
          }
        }
      }
    };
    serverProcess.stdin.write(JSON.stringify(insertRequest) + '\n');
    await wait(1000);

    // Test 3: Create a new Button component file
    console.log('\n🔘 3. Creating a new Button component file...');
    const createRequest = {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'create_component_file',
        arguments: {
          componentName: 'PrimaryButton',
          componentType: 'button',
          options: {
            variant: 'primary',
            size: 'medium',
            styling: 'tailwind'
          }
        }
      }
    };
    serverProcess.stdin.write(JSON.stringify(createRequest) + '\n');
    await wait(1000);

    // Parse and display results
    console.log('\n📨 Results:');
    parseAndDisplayResults(responseData);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    serverProcess.kill();
  }
}

function parseAndDisplayResults(responseData) {
  if (!responseData.trim()) {
    console.log('No responses received');
    return;
  }

  const responses = responseData.trim().split('\n').filter(line => line.trim());
  
  responses.forEach((response, index) => {
    try {
      const parsed = JSON.parse(response);
      if (parsed.id === 1) {
        console.log('✅ Server initialized');
      } else if (parsed.id === 2 && parsed.result) {
        const data = JSON.parse(parsed.result.content[0].text);
        console.log('\n📊 Code Analysis:');
        console.log(`- Components found: ${data.summary.totalComponents}`);
        console.log(`- Imports found: ${data.summary.totalImports}`);
        console.log(`- Has React: ${data.summary.hasReact}`);
        console.log(`- Has Tailwind: ${data.summary.hasTailwind}`);
        console.log(`- Insertion points: ${data.summary.insertionPoints}`);
      } else if (parsed.id === 3 && parsed.result) {
        const data = JSON.parse(parsed.result.content[0].text);
        if (data.success) {
          console.log('\n✅ Component inserted successfully!');
          console.log('Modified code preview:');
          console.log('```javascript');
          console.log(data.modifiedCode.substring(0, 500) + '...');
          console.log('```');
        }
      } else if (parsed.id === 4 && parsed.result) {
        const data = JSON.parse(parsed.result.content[0].text);
        if (data.success) {
          console.log('\n✅ New component file created!');
          console.log(`Component: ${data.componentName}`);
          console.log('Generated code preview:');
          console.log('```javascript');
          console.log(data.code.substring(0, 300) + '...');
          console.log('```');
        }
      }
    } catch (e) {
      console.log(`Response ${index + 1}:`, response);
    }
  });
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

demonstrateMCPTools().catch(console.error); 