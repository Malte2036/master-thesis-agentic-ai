#!/usr/bin/env node

// Set shared session timestamp for all agents in nx workspace
const timestamp = new Date()
  .toISOString()
  .replace(/:/g, '-')
  .replace(/\./g, '-')
  .split('T')
  .join('-')
  .slice(0, -5); // Remove milliseconds

// Set environment variable for all child processes
process.env.AGENT_SESSION_TIMESTAMP = timestamp;

console.log(`🚀 Starting development session: ${timestamp}`);
console.log(`📁 Logs will be in: logs/${timestamp}/`);

// Execute the provided command with the environment variable
const { spawn } = require('child_process');
const command = process.argv.slice(2).join(' ');

if (!command) {
  console.error('❌ No command provided');
  process.exit(1);
}

// Parse command and args
const [cmd, ...args] = command.split(' ');

// Spawn the command with inherited stdio and environment
const child = spawn(cmd, args, {
  stdio: 'inherit',
  env: { ...process.env },
  shell: true,
});

child.on('exit', (code) => {
  console.log(`\n📊 Development session ended: ${timestamp}`);
  process.exit(code || 0);
});

child.on('error', (error) => {
  console.error('❌ Error starting development session:', error);
  process.exit(1);
});
