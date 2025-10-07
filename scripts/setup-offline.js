#!/usr/bin/env node
const { existsSync, readFileSync } = require('node:fs');
const { spawn } = require('node:child_process');
const path = require('node:path');

const base64Path = path.resolve(__dirname, '..', 'offline', 'node_modules.base64');
const projectRoot = path.resolve(__dirname, '..');
const targetDir = path.join(projectRoot, 'node_modules');

if (!existsSync(base64Path)) {
  console.error('Offline base64 archive not found at', base64Path);
  process.exit(1);
}

if (existsSync(targetDir)) {
  console.log('node_modules already exists, skipping extraction.');
  process.exit(0);
}

console.log('Extracting offline dependencies from base64 archive...');
let base64;
try {
  base64 = readFileSync(base64Path, 'utf8').replace(/\s+/g, '');
} catch (error) {
  console.error('Failed to read offline archive:', error.message);
  process.exit(1);
}

const tar = spawn('tar', ['-xz', '-C', projectRoot], {
  stdio: ['pipe', 'inherit', 'inherit'],
});

tar.on('error', (error) => {
  console.error('Failed to spawn tar:', error.message);
  process.exit(1);
});

tar.on('close', (code) => {
  if (code !== 0) {
    console.error(`tar exited with code ${code}`);
    process.exit(code);
  }
  console.log('Offline dependencies extracted to node_modules/.');
});

try {
  tar.stdin.write(Buffer.from(base64, 'base64'));
  tar.stdin.end();
} catch (error) {
  console.error('Failed to decode offline archive:', error.message);
  tar.kill();
  process.exit(1);
}
