#!/usr/bin/env node

/**
 * Batch ZIP Processing Script
 * Processes all ZIP files in a folder, then deletes them after successful processing
 * 
 * Usage:
 *   node scripts/process-zip-folder.js [zip-folder-path] [category]
 */

// Load environment variables
require('dotenv').config();

const path = require('path');
const fs = require('fs').promises;
const readline = require('readline');

// Import the ZIP processing function from upload-zip.js
const { processZipFile } = require('./upload-zip');
const pool = require('../config/database');

// Valid categories
const VALID_CATEGORIES = ['pre-wedding', 'brides-dinner', 'morning-wedding', 'grooms-dinner'];

// Category display names
const CATEGORY_NAMES = {
  'pre-wedding': 'Pre-Wedding',
  'brides-dinner': "Bride's Dinner",
  'morning-wedding': 'Morning Wedding',
  'grooms-dinner': "Groom's Dinner"
};

// Default photographer email
const DEFAULT_PHOTOGRAPHER_EMAIL = 'angjinsheng@gmail.com';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask questions
function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Display category menu
function displayCategories() {
  console.log('\n📁 Available Categories:');
  VALID_CATEGORIES.forEach((cat, index) => {
    console.log(`   ${index + 1}. ${CATEGORY_NAMES[cat]} (${cat})`);
  });
  console.log();
}

// Get category from user
async function getCategory() {
  displayCategories();
  while (true) {
    const answer = await askQuestion('Select category (1-4) or enter name: ');
    const trimmed = answer.trim();
    
    // Check if it's a number
    const num = parseInt(trimmed);
    if (num >= 1 && num <= 4) {
      return VALID_CATEGORIES[num - 1];
    }
    
    // Check if it's a valid category name
    if (VALID_CATEGORIES.includes(trimmed)) {
      return trimmed;
    }
    
    console.log('❌ Invalid category. Please try again.');
  }
}

// Get folder path
async function getFolderPath() {
  while (true) {
    const folderPath = await askQuestion('Enter ZIP folder path (or press Enter for "../uploads/zip"): ');
    const trimmed = folderPath.trim().replace(/^["']|["']$/g, ''); // Remove quotes
    
    // Default to uploads/zip folder (relative to api directory)
    const targetPath = trimmed || path.join(__dirname, '../../uploads/zip');
    
    try {
      const stats = await fs.stat(targetPath);
      if (!stats.isDirectory()) {
        console.log('❌ Path is not a directory. Please try again.');
        continue;
      }
      return targetPath;
    } catch (error) {
      console.log(`❌ Folder not found: ${error.message}. Please try again.`);
    }
  }
}

// Find all ZIP files in a directory
async function findZipFiles(folderPath) {
  try {
    const files = await fs.readdir(folderPath);
    const zipFiles = files
      .filter(file => file.toLowerCase().endsWith('.zip'))
      .map(file => path.join(folderPath, file))
      .sort(); // Sort alphabetically
    
    return zipFiles;
  } catch (error) {
    throw new Error(`Failed to read folder: ${error.message}`);
  }
}

// Process a single ZIP file
async function processAndDeleteZip(zipFilePath, category, photographerEmail) {
  console.log('\n' + '='.repeat(70));
  console.log(`📦 Processing: ${path.basename(zipFilePath)}`);
  console.log('='.repeat(70));
  
  try {
      // Process the ZIP file (skip confirmation since we already confirmed batch processing)
      const results = await processZipFile(zipFilePath, category, photographerEmail, true);
    
    // Only delete if processing was successful (no failures or very few)
    if (results.failed === 0 || (results.successful > 0 && results.failed < results.total * 0.1)) {
      await fs.unlink(zipFilePath);
      console.log(`\n🗑️  Deleted: ${path.basename(zipFilePath)}`);
      return { success: true, results };
    } else {
      console.log(`\n⚠️  Keeping ZIP file due to many failures (${results.failed}/${results.total} failed)`);
      return { success: false, results, reason: 'too_many_failures' };
    }
  } catch (error) {
    console.error(`\n❌ Error processing ${path.basename(zipFilePath)}: ${error.message}`);
    console.log(`⚠️  Keeping ZIP file due to error`);
    return { success: false, error: error.message };
  }
}

// Main function
async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('📸 Batch ZIP Processing Script');
  console.log('📁 Process all ZIP files in a folder and delete after processing');
  console.log('='.repeat(70));

  let folderPath, category;

  // Check command line arguments
  const args = process.argv.slice(2);

  if (args.length >= 1) {
    // Non-interactive mode
    folderPath = args[0];
    category = args[1] || null;

    // Validate folder exists
    try {
      const stats = await fs.stat(folderPath);
      if (!stats.isDirectory()) {
        console.error('❌ Path is not a directory.');
        process.exit(1);
      }
    } catch (error) {
      console.error(`❌ Folder not found: ${folderPath}`);
      process.exit(1);
    }

    // Validate category
    if (category && !VALID_CATEGORIES.includes(category)) {
      console.error(`❌ Invalid category: ${category}`);
      console.error(`Valid categories: ${VALID_CATEGORIES.join(', ')}`);
      process.exit(1);
    }
  } else {
    // Interactive mode
    folderPath = await getFolderPath();
    category = null;
  }

  // Get category if not provided
  if (!category) {
    category = await getCategory();
  }

  console.log(`\n📁 Folder: ${folderPath}`);
  console.log(`📂 Category: ${CATEGORY_NAMES[category]} (${category})`);
  console.log(`📧 Photographer: ${DEFAULT_PHOTOGRAPHER_EMAIL}`);

  try {
    // Find all ZIP files
    const zipFiles = await findZipFiles(folderPath);
    
    if (zipFiles.length === 0) {
      console.log('\n❌ No ZIP files found in the specified folder.');
      process.exit(0);
    }

    console.log(`\n📦 Found ${zipFiles.length} ZIP file(s):`);
    zipFiles.forEach((file, index) => {
      console.log(`   ${index + 1}. ${path.basename(file)}`);
    });

    // Confirm before processing
    console.log(`\n⚠️  About to process ${zipFiles.length} ZIP file(s)...`);
    console.log('⚠️  ZIP files will be DELETED after successful processing!');
    const confirm = await askQuestion('\nContinue? (yes/no): ');
    if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
      console.log('❌ Cancelled by user.');
      process.exit(0);
    }

    // Process each ZIP file
    const summary = {
      total: zipFiles.length,
      successful: 0,
      failed: 0,
      totalImages: 0,
      totalSuccessfulImages: 0,
      totalFailedImages: 0,
      errors: []
    };

    const startTime = Date.now();

    for (let i = 0; i < zipFiles.length; i++) {
      const zipFile = zipFiles[i];
      console.log(`\n\n[${i + 1}/${zipFiles.length}] Processing ${path.basename(zipFile)}...`);
      
      const result = await processAndDeleteZip(zipFile, category, DEFAULT_PHOTOGRAPHER_EMAIL);
      
      if (result.success) {
        summary.successful++;
        if (result.results) {
          summary.totalImages += result.results.total;
          summary.totalSuccessfulImages += result.results.successful;
          summary.totalFailedImages += result.results.failed;
        }
      } else {
        summary.failed++;
        summary.errors.push({
          file: path.basename(zipFile),
          error: result.error || result.reason || 'Unknown error'
        });
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1); // in minutes

    // Print final summary
    console.log('\n\n' + '='.repeat(70));
    console.log('✅ Batch Processing Complete!');
    console.log('='.repeat(70));
    console.log(`Total ZIP Files:      ${summary.total}`);
    console.log(`Successfully Processed: ${summary.successful} ✅`);
    console.log(`Failed:                ${summary.failed} ${summary.failed > 0 ? '❌' : ''}`);
    console.log(`Total Images:          ${summary.totalImages}`);
    console.log(`Successful Images:     ${summary.totalSuccessfulImages} ✅`);
    console.log(`Failed Images:         ${summary.totalFailedImages} ${summary.totalFailedImages > 0 ? '❌' : ''}`);
    console.log(`Time Elapsed:          ${elapsed} minutes`);
    console.log('='.repeat(70));

    if (summary.errors.length > 0) {
      console.log('\n❌ Failed ZIP Files:');
      summary.errors.forEach((err, i) => {
        console.log(`   ${i + 1}. ${err.file}: ${err.error}`);
      });
    }

    // Exit with appropriate code
    process.exit(summary.failed === 0 ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    if (process.env.NODE_ENV === 'development') {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    rl.close();
    // Close database pool
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = { processAndDeleteZip };
