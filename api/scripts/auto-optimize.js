#!/usr/bin/env node
/**
 * Auto-optimize uploaded images
 * Calls Python optimization script to create thumbnails for newly uploaded images
 * 
 * Usage:
 *   node scripts/auto-optimize.js [photo-id]
 * 
 * If photo-id is provided, only that photo is optimized
 * Otherwise, all photos without thumbnails are optimized
 */

const { spawn } = require('child_process');
const path = require('path');

const photoId = process.argv[2];

// Path to Python script
const pythonScript = path.join(__dirname, 'optimize-images.py');

// Build arguments
const args = ['--new']; // Only process new images without thumbnails

console.log('🖼️  Auto-optimizing images...');
console.log(`   Python script: ${pythonScript}`);

// Spawn Python process
const python = spawn('python3', [pythonScript, ...args], {
  cwd: path.join(__dirname, '..'),
  stdio: 'inherit' // Inherit stdio to see Python script output
});

python.on('error', (error) => {
  console.error('❌ Failed to start Python script:', error);
  process.exit(1);
});

python.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Image optimization complete!');
  } else {
    console.error(`❌ Image optimization failed with code ${code}`);
  }
  process.exit(code);
});
