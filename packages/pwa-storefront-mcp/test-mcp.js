#!/usr/bin/env node

import { spawn } from 'child_process';

async function testMCPServer() {
  console.log('🚀 Testing MCP Server...\n');

  // Start the MCP server process
  const serverProcess = spawn('node', ['server.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Handle server stderr output
  serverProcess.stderr.on('data', (data) => {
    console.log('Server:', data.toString().trim());
  });

  let responseData = '';
  
  // Collect server responses
  serverProcess.stdout.on('data', (data) => {
    responseData += data.toString();
  });

  try {
    console.log('✅ Started MCP server');

    // Test 1: Initialize the connection
    console.log('\n🔗 Initializing connection...');
    const initRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0'
        }
      }
    };
    
    serverProcess.stdin.write(JSON.stringify(initRequest) + '\n');
    
    // Wait a bit for response
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: List available tools
    console.log('\n📋 Listing available tools...');
    const toolsRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    };
    
    serverProcess.stdin.write(JSON.stringify(toolsRequest) + '\n');
    
    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 3: Call the get_current_time tool
    console.log('\n🕐 Calling get_current_time tool...');
    const toolCallRequest = {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'get_current_time',
        arguments: {}
      }
    };
    
    serverProcess.stdin.write(JSON.stringify(toolCallRequest) + '\n');
    
    // Wait for final response
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('\n📨 Server responses:');
    if (responseData.trim()) {
      // Split by lines and parse each JSON response
      const responses = responseData.trim().split('\n').filter(line => line.trim());
      responses.forEach((response, index) => {
        try {
          const parsed = JSON.parse(response);
          console.log(`Response ${index + 1}:`, JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.log(`Raw response ${index + 1}:`, response);
        }
      });
    } else {
      console.log('No responses received from server');
    }

    console.log('\n✅ Test completed!');

  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    // Clean up
    serverProcess.kill();
    process.exit(0);
  }
}

testMCPServer().catch(console.error); 