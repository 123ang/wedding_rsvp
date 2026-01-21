#!/usr/bin/env node

/**
 * Standalone ZIP Upload Script
 * Processes ZIP files containing photos and uploads them to the database
 * 
 * Usage:
 *   node scripts/upload-zip.js <zip-file-path> [category] [photographer-email]
 * 
 * Or run interactively:
 *   node scripts/upload-zip.js
 */

// Load environment variables
require('dotenv').config();

const path = require('path');
const fs = require('fs').promises;
const AdmZip = require('adm-zip');
const readline = require('readline');
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

// Get ZIP file path
async function getZipFilePath() {
  while (true) {
    const filePath = await askQuestion('Enter ZIP file path: ');
    const trimmed = filePath.trim().replace(/^["']|["']$/g, ''); // Remove quotes
    
    try {
      const stats = await fs.stat(trimmed);
      if (!stats.isFile()) {
        console.log('❌ Path is not a file. Please try again.');
        continue;
      }
      
      if (!trimmed.toLowerCase().endsWith('.zip')) {
        console.log('❌ File is not a ZIP archive. Please try again.');
        continue;
      }
      
      return trimmed;
    } catch (error) {
      console.log(`❌ File not found: ${error.message}. Please try again.`);
    }
  }
}

// Get photographer email
async function getPhotographerEmail() {
  const email = await askQuestion('Enter photographer email (optional, press Enter for "angjinsheng@gmail.com"): ');
  return email.trim() || 'angjinsheng@gmail.com';
}

// Process ZIP file
async function processZipFile(zipFilePath, category, photographerEmail, skipConfirm = false) {
  console.log('\n🚀 Starting ZIP processing...');
  console.log(`   File: ${zipFilePath}`);
  console.log(`   Category: ${CATEGORY_NAMES[category]} (${category})`);
  console.log(`   Photographer: ${photographerEmail}\n`);

  let zip;
  let zipEntries;

  try {
    // Read ZIP file - use file path directly for large files (>2GB)
    console.log('📦 Reading ZIP file...');
    // Check file size first
    const stats = await fs.stat(zipFilePath);
    const fileSizeGB = (stats.size / (1024 * 1024 * 1024)).toFixed(2);
    console.log(`   File size: ${fileSizeGB} GB`);
    
    // Use file path directly instead of reading into buffer for large files
    // This allows adm-zip to handle files >2GB
    zip = new AdmZip(zipFilePath);
    zipEntries = zip.getEntries();
    console.log(`   ✓ Found ${zipEntries.length} entries in ZIP\n`);
  } catch (error) {
    throw new Error(`Failed to read ZIP file: ${error.message}`);
  }

  // Filter image files
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const imageEntries = zipEntries.filter(entry => {
    if (entry.isDirectory) return false;
    const ext = path.extname(entry.entryName).toLowerCase();
    return imageExtensions.includes(ext);
  });

  console.log(`📸 Found ${imageEntries.length} image files\n`);

  if (imageEntries.length === 0) {
    throw new Error('No image files found in ZIP archive. Supported formats: JPG, PNG, GIF, WebP');
  }

  // Confirm before processing (only if not called from another script)
  if (!skipConfirm) {
    console.log(`⚠️  About to process ${imageEntries.length} images...`);
    const confirm = await askQuestion('Continue? (yes/no): ');
    if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
      console.log('❌ Cancelled by user.');
      process.exit(0);
    }
  }

  // Results tracking
  const results = {
    total: imageEntries.length,
    successful: 0,
    failed: 0,
    errors: []
  };

  // Setup photos directory
  const photosDir = path.join(__dirname, '../../uploads/photos');
  await fs.mkdir(photosDir, { recursive: true });

  // Process in batches of 100
  const BATCH_SIZE = 100;
  const totalBatches = Math.ceil(imageEntries.length / BATCH_SIZE);

  console.log(`\n🔄 Processing in ${totalBatches} batches of ${BATCH_SIZE}...\n`);

  const startTime = Date.now();

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const batchStart = batchIndex * BATCH_SIZE;
    const batchEnd = Math.min(batchStart + BATCH_SIZE, imageEntries.length);
    const batch = imageEntries.slice(batchStart, batchEnd);

    console.log(`📦 Batch ${batchIndex + 1}/${totalBatches} (images ${batchStart + 1}-${batchEnd} of ${imageEntries.length})`);

    // Process each image in the batch
    for (let i = 0; i < batch.length; i++) {
      const entry = batch[i];
      const globalIndex = batchStart + i;

      try {
        // Get file buffer from ZIP entry
        let fileBuffer;
        try {
          fileBuffer = zip.readFile(entry);
        } catch (readError) {
          throw new Error(`Failed to read file from ZIP: ${readError.message}`);
        }

        if (!fileBuffer) {
          throw new Error('Failed to read file from ZIP: file buffer is empty');
        }

        // Check file size (100MB max per image)
        if (fileBuffer.length > 100 * 1024 * 1024) {
          throw new Error(`File too large: ${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB (max 100MB per image)`);
        }

        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + globalIndex + '-' + Math.round(Math.random() * 1E9);
        const originalExt = path.extname(entry.entryName);
        const newFilename = 'photo-' + uniqueSuffix + originalExt;
        const destPath = path.join(photosDir, newFilename);

        // Write to photos directory
        await fs.writeFile(destPath, fileBuffer);

        // Generate image URL
        const imageUrl = `/uploads/photos/${newFilename}`;

        // Insert into photographer_photo table
        await pool.execute(
          'INSERT INTO photographer_photo (image_url, category, photographer_email) VALUES (?, ?, ?)',
          [imageUrl, category, photographerEmail]
        );

        results.successful++;

        // Progress indicator
        if ((globalIndex + 1) % 10 === 0 || i === batch.length - 1) {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          const rate = (results.successful / elapsed).toFixed(1);
          process.stdout.write(`   ✓ Processed ${globalIndex + 1}/${imageEntries.length} (${results.successful} successful, ${results.failed} failed) - ${rate} img/s\r`);
        }
      } catch (err) {
        results.failed++;
        results.errors.push({
          filename: entry.entryName,
          error: err.message
        });
        console.error(`\n   ❌ Error processing ${entry.entryName}: ${err.message}`);
      }
    }

    // Small delay between batches for memory cleanup
    if (batchIndex < totalBatches - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(); // New line after batch
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // Print final results
  console.log('\n' + '='.repeat(60));
  console.log('✅ Processing Complete!');
  console.log('='.repeat(60));
  console.log(`Total Images:     ${results.total}`);
  console.log(`Successful:       ${results.successful} ✅`);
  console.log(`Failed:           ${results.failed} ${results.failed > 0 ? '❌' : ''}`);
  console.log(`Time Elapsed:     ${elapsed}s`);
  console.log(`Average Rate:     ${(results.successful / elapsed).toFixed(1)} images/second`);
  console.log('='.repeat(60));

  if (results.failed > 0 && results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.slice(0, 10).forEach((err, i) => {
      console.log(`   ${i + 1}. ${err.filename}: ${err.error}`);
    });
    if (results.errors.length > 10) {
      console.log(`   ... and ${results.errors.length - 10} more errors`);
    }
  }

  return results;
}

// Main function
async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('📸 Wedding Photo ZIP Upload Script');
  console.log('='.repeat(60));

  let zipFilePath, category, photographerEmail;

  // Check command line arguments
  const args = process.argv.slice(2);

  if (args.length >= 1) {
    // Non-interactive mode
    zipFilePath = args[0];
    category = args[1] || null;
    photographerEmail = args[2] || 'angjinsheng@gmail.com';

    // Validate ZIP file exists
    try {
      const stats = await fs.stat(zipFilePath);
      if (!stats.isFile()) {
        console.error('❌ Path is not a file.');
        process.exit(1);
      }
    } catch (error) {
      console.error(`❌ File not found: ${zipFilePath}`);
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
    zipFilePath = await getZipFilePath();
    category = await getCategory();
    photographerEmail = await getPhotographerEmail();
  }

  try {
    // Process the ZIP file
    const results = await processZipFile(zipFilePath, category, photographerEmail);

    // Exit with appropriate code
    process.exit(results.failed === 0 ? 0 : 1);
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

// Export processZipFile for use in other scripts
module.exports = { processZipFile };
