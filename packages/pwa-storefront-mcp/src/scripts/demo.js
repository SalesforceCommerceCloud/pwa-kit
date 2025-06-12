import { AddComponentTool } from '../utils/AddComponentTool.js'; 
import { spawn } from 'child_process';

const serverProcess = spawn('node', ['src/server/server.js'], {
  // ... existing code ...
}); 