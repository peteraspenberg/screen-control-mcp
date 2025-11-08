#!/usr/bin/env node

/**
 * Simple test script to verify the MCP server works
 * This simulates MCP protocol messages
 */

import { spawn } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverPath = path.join(__dirname, 'dist', 'index.js');

console.log('Starting MCP server test...');
console.log('Server path:', serverPath);

const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe']
});

// Test: List tools
const listToolsRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/list',
  params: {}
};

server.stdin.write(JSON.stringify(listToolsRequest) + '\n');

let output = '';
server.stdout.on('data', (data) => {
  output += data.toString();
  const lines = output.split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    try {
      const response = JSON.parse(line);
      if (response.id === 1) {
        console.log('\n✅ Server responded successfully!');
        console.log('Available tools:', response.result?.tools?.length || 0);
        if (response.result?.tools) {
          console.log('\nTools:');
          response.result.tools.forEach((tool, i) => {
            console.log(`  ${i + 1}. ${tool.name} - ${tool.description}`);
          });
        }
        server.kill();
        process.exit(0);
      }
    } catch (e) {
      // Not JSON yet, continue reading
    }
  }
});

server.stderr.on('data', (data) => {
  const msg = data.toString();
  if (msg.includes('running')) {
    console.log('✅ Server started successfully');
  } else {
    console.error('Server error:', msg);
  }
});

server.on('close', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`Server exited with code ${code}`);
    process.exit(1);
  }
});

// Timeout after 5 seconds
setTimeout(() => {
  console.error('❌ Test timeout - server did not respond');
  server.kill();
  process.exit(1);
}, 5000);

