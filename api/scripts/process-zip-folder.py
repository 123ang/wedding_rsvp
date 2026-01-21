#!/usr/bin/env python3
"""
Batch ZIP Processing Script (Python)
Processes all ZIP files in a folder, then deletes them after successful processing

Usage:
    python scripts/process-zip-folder.py [folder_path] [category]

Or run interactively:
    python scripts/process-zip-folder.py
"""

import os
import sys
import zipfile
import argparse
import mysql.connector
from pathlib import Path
from typing import List, Dict, Tuple
import time

# Valid categories
VALID_CATEGORIES = {
    '1': 'pre-wedding',
    '2': 'brides-dinner',
    '3': 'morning-wedding',
    '4': 'grooms-dinner',
    'pre-wedding': 'pre-wedding',
    'brides-dinner': 'brides-dinner',
    'morning-wedding': 'morning-wedding',
    'grooms-dinner': 'grooms-dinner'
}

CATEGORY_NAMES = {
    'pre-wedding': 'Pre-Wedding',
    'brides-dinner': "Bride's Dinner",
    'morning-wedding': 'Morning Wedding',
    'grooms-dinner': "Groom's Dinner"
}

# Default photographer email
DEFAULT_PHOTOGRAPHER_EMAIL = 'angjinsheng@gmail.com'

# Image extensions
IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp']

# Batch size for processing
BATCH_SIZE = 100


def load_env():
    """Load environment variables from .env file if it exists"""
    env_file = Path(__file__).parent.parent / '.env'
    if env_file.exists():
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()


def get_db_connection():
    """Create and return MySQL database connection"""
    config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'user': os.getenv('DB_USER', 'root'),
        'password': os.getenv('DB_PASSWORD', ''),
        'database': os.getenv('DB_NAME', 'wedding_rsvp'),
        'charset': 'utf8mb4',
        'collation': 'utf8mb4_unicode_ci'
    }
    
    try:
        conn = mysql.connector.connect(**config)
        print('✓ MySQL database connected successfully')
        return conn
    except mysql.connector.Error as err:
        print(f'✗ MySQL database connection failed: {err}')
        sys.exit(1)


def display_categories():
    """Display available categories"""
    print('\n📁 Available Categories:')
    print('   1. Pre-Wedding (pre-wedding)')
    print('   2. Bride\'s Dinner (brides-dinner)')
    print('   3. Morning Wedding (morning-wedding)')
    print('   4. Groom\'s Dinner (grooms-dinner)\n')


def get_category_interactive():
    """Get category from user interactively"""
    display_categories()
    while True:
        answer = input('Select category (1-4) or enter name: ').strip()
        if answer in VALID_CATEGORIES:
            return VALID_CATEGORIES[answer]
        print('❌ Invalid category. Please try again.')


def get_folder_path_interactive():
    """Get folder path from user interactively"""
    default_path = Path(__file__).parent.parent.parent / 'uploads' / 'zip'
    while True:
        folder_path = input(f'Enter ZIP folder path (or press Enter for "{default_path}"): ').strip().strip('"\'')
        
        if not folder_path:
            target_path = default_path
        else:
            target_path = Path(folder_path)
        
        if target_path.exists() and target_path.is_dir():
            return target_path
        print(f'❌ Folder not found: {target_path}. Please try again.')


def find_zip_files(folder_path: Path) -> List[Path]:
    """Find all ZIP files in the specified folder"""
    zip_files = [f for f in folder_path.glob('*.zip') if f.is_file()]
    return sorted(zip_files)


def is_image_file(filename: str) -> bool:
    """Check if file is an image based on extension"""
    ext = Path(filename).suffix.lower()
    return ext in IMAGE_EXTENSIONS


def process_zip_file(zip_path: Path, category: str, photographer_email: str, conn) -> Dict:
    """Process a single ZIP file and return results"""
    print('\n' + '=' * 70)
    print(f'📦 Processing: {zip_path.name}')
    print('=' * 70)
    
    print('\n🚀 Starting ZIP processing...')
    print(f'   File: {zip_path}')
    print(f'   Category: {CATEGORY_NAMES[category]} ({category})')
    print(f'   Photographer: {photographer_email}\n')
    
    results = {
        'total': 0,
        'successful': 0,
        'failed': 0,
        'errors': []
    }
    
    try:
        # Open ZIP file
        print('📦 Reading ZIP file...')
        file_size_gb = zip_path.stat().st_size / (1024 * 1024 * 1024)
        print(f'   File size: {file_size_gb:.2f} GB')
        
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            # Get all entries
            all_entries = zip_ref.namelist()
            print(f'   ✓ Found {len(all_entries)} entries in ZIP\n')
            
            # Filter for image files
            image_entries = [e for e in all_entries if is_image_file(e) and not e.endswith('/')]
            results['total'] = len(image_entries)
            
            print(f'📸 Found {len(image_entries)} image files\n')
            
            if len(image_entries) == 0:
                raise ValueError('No image files found in ZIP archive. Supported formats: JPG, PNG, GIF, WebP')
            
            # Setup photos directory
            photos_dir = Path(__file__).parent.parent.parent / 'uploads' / 'photos'
            photos_dir.mkdir(parents=True, exist_ok=True)
            
            # Process in batches
            total_batches = (len(image_entries) + BATCH_SIZE - 1) // BATCH_SIZE
            print(f'🔄 Processing in {total_batches} batches of {BATCH_SIZE}...\n')
            
            start_time = time.time()
            cursor = conn.cursor()
            
            try:
                for batch_index in range(total_batches):
                    batch_start = batch_index * BATCH_SIZE
                    batch_end = min(batch_start + BATCH_SIZE, len(image_entries))
                    batch = image_entries[batch_start:batch_end]
                    
                    print(f'📦 Batch {batch_index + 1}/{total_batches} (images {batch_start + 1}-{batch_end} of {len(image_entries)})')
                    
                    for i, entry_name in enumerate(batch):
                        global_index = batch_start + i
                        
                        try:
                            # Extract file from ZIP
                            file_data = zip_ref.read(entry_name)
                            
                            # Check file size (100MB max per image)
                            if len(file_data) > 100 * 1024 * 1024:
                                raise ValueError(f'File too large: {len(file_data) / 1024 / 1024:.2f}MB (max 100MB per image)')
                            
                            # Generate unique filename
                            original_ext = Path(entry_name).suffix
                            unique_suffix = f"{int(time.time() * 1000)}-{global_index}-{hash(entry_name) % 1000000000}"
                            new_filename = f'photo-{unique_suffix}{original_ext}'
                            dest_path = photos_dir / new_filename
                            
                            # Write to photos directory
                            dest_path.write_bytes(file_data)
                            
                            # Generate image URL
                            image_url = f'/uploads/photos/{new_filename}'
                            
                            # Insert into database
                            cursor.execute(
                                'INSERT INTO photographer_photo (image_url, category, photographer_email) VALUES (%s, %s, %s)',
                                (image_url, category, photographer_email)
                            )
                            
                            results['successful'] += 1
                            
                            # Progress indicator
                            if (global_index + 1) % 10 == 0 or i == len(batch) - 1:
                                elapsed = time.time() - start_time
                                rate = results['successful'] / elapsed if elapsed > 0 else 0
                                print(f'   ✓ Processed {global_index + 1}/{len(image_entries)} ({results["successful"]} successful, {results["failed"]} failed) - {rate:.1f} img/s', end='\r')
                        
                        except Exception as err:
                            results['failed'] += 1
                            results['errors'].append({
                                'filename': entry_name,
                                'error': str(err)
                            })
                            print(f'\n   ❌ Error processing {entry_name}: {str(err)}')
                    
                    # Commit batch to database
                    conn.commit()
                    print()  # New line after batch
                    
                    # Small delay between batches
                    if batch_index < total_batches - 1:
                        time.sleep(0.1)
                
                elapsed = time.time() - start_time
                
                # Print results
                print('\n' + '=' * 60)
                print('✅ Processing Complete!')
                print('=' * 60)
                print(f'Total Images:     {results["total"]}')
                print(f'Successful:       {results["successful"]} ✅')
                print(f'Failed:           {results["failed"]} {"❌" if results["failed"] > 0 else ""}')
                print(f'Time Elapsed:     {elapsed:.1f}s')
                print(f'Average Rate:     {results["successful"] / elapsed:.1f} images/second' if elapsed > 0 else 'Average Rate:     0.0 images/second')
                print('=' * 60)
                
                if results['failed'] > 0 and results['errors']:
                    print('\n❌ Errors:')
                    for i, err in enumerate(results['errors'][:10], 1):
                        print(f'   {i}. {err["filename"]}: {err["error"]}')
                    if len(results['errors']) > 10:
                        print(f'   ... and {len(results["errors"]) - 10} more errors')
            
            finally:
                cursor.close()
        
        return results
        
    except Exception as error:
        print(f'\n❌ Error processing {zip_path.name}: {str(error)}')
        raise


def main():
    """Main function"""
    # Load environment variables
    load_env()
    
    print('\n' + '=' * 70)
    print('📸 Batch ZIP Processing Script (Python)')
    print('📁 Process all ZIP files in a folder and delete after processing')
    print('=' * 70)
    
    # Parse arguments
    parser = argparse.ArgumentParser(description='Process ZIP files containing photos')
    parser.add_argument('folder_path', nargs='?', help='Path to folder containing ZIP files')
    parser.add_argument('category', nargs='?', help='Photo category (pre-wedding, brides-dinner, morning-wedding, grooms-dinner)')
    
    args = parser.parse_args()
    
    # Get folder path
    if args.folder_path:
        folder_path = Path(args.folder_path)
        if not folder_path.exists() or not folder_path.is_dir():
            print(f'❌ Folder not found: {folder_path}')
            sys.exit(1)
    else:
        folder_path = get_folder_path_interactive()
    
    # Get category
    if args.category:
        if args.category not in VALID_CATEGORIES.values():
            print(f'❌ Invalid category: {args.category}')
            print(f'Valid categories: {", ".join(VALID_CATEGORIES.values())}')
            sys.exit(1)
        category = args.category
    else:
        category = get_category_interactive()
    
    print(f'\n📁 Folder: {folder_path}')
    print(f'📂 Category: {CATEGORY_NAMES[category]} ({category})')
    print(f'📧 Photographer: {DEFAULT_PHOTOGRAPHER_EMAIL}')
    
    # Find ZIP files
    zip_files = find_zip_files(folder_path)
    
    if len(zip_files) == 0:
        print('\n❌ No ZIP files found in the specified folder.')
        sys.exit(0)
    
    print(f'\n📦 Found {len(zip_files)} ZIP file(s):')
    for i, zip_file in enumerate(zip_files, 1):
        file_size_mb = zip_file.stat().st_size / (1024 * 1024)
        print(f'   {i}. {zip_file.name} ({file_size_mb:.1f} MB)')
    
    # Confirm before processing
    print(f'\n⚠️  About to process {len(zip_files)} ZIP file(s)...')
    print('⚠️  ZIP files will be DELETED after successful processing!')
    confirm = input('\nContinue? (yes/no): ').strip().lower()
    if confirm not in ['yes', 'y']:
        print('❌ Cancelled by user.')
        sys.exit(0)
    
    # Connect to database
    conn = get_db_connection()
    
    try:
        # Process each ZIP file
        summary = {
            'total': len(zip_files),
            'successful': 0,
            'failed': 0,
            'total_images': 0,
            'total_successful_images': 0,
            'total_failed_images': 0,
            'errors': []
        }
        
        start_time = time.time()
        
        for i, zip_file in enumerate(zip_files, 1):
            print(f'\n\n[{i}/{len(zip_files)}] Processing {zip_file.name}...')
            
            try:
                result = process_zip_file(zip_file, category, DEFAULT_PHOTOGRAPHER_EMAIL, conn)
                
                # Only delete if processing was successful
                if result['failed'] == 0 or (result['successful'] > 0 and result['failed'] < result['total'] * 0.1):
                    zip_file.unlink()
                    print(f'\n🗑️  Deleted: {zip_file.name}')
                    summary['successful'] += 1
                    summary['total_images'] += result['total']
                    summary['total_successful_images'] += result['successful']
                    summary['total_failed_images'] += result['failed']
                else:
                    print(f'\n⚠️  Keeping ZIP file due to many failures ({result["failed"]}/{result["total"]} failed)')
                    summary['failed'] += 1
                    summary['errors'].append({
                        'file': zip_file.name,
                        'reason': 'too_many_failures'
                    })
            
            except Exception as error:
                print(f'\n⚠️  Keeping ZIP file due to error')
                summary['failed'] += 1
                summary['errors'].append({
                    'file': zip_file.name,
                    'error': str(error)
                })
        
        elapsed = (time.time() - start_time) / 60  # in minutes
        
        # Print final summary
        print('\n\n' + '=' * 70)
        print('✅ Batch Processing Complete!')
        print('=' * 70)
        print(f'Total ZIP Files:      {summary["total"]}')
        print(f'Successfully Processed: {summary["successful"]} ✅')
        print(f'Failed:                {summary["failed"]} {"❌" if summary["failed"] > 0 else ""}')
        print(f'Total Images:          {summary["total_images"]}')
        print(f'Successful Images:     {summary["total_successful_images"]} ✅')
        print(f'Failed Images:         {summary["total_failed_images"]} {"❌" if summary["total_failed_images"] > 0 else ""}')
        print(f'Time Elapsed:          {elapsed:.1f} minutes')
        print('=' * 70)
        
        if summary['errors']:
            print('\n❌ Failed ZIP Files:')
            for i, err in enumerate(summary['errors'], 1):
                reason = err.get('reason') or err.get('error', 'Unknown error')
                print(f'   {i}. {err["file"]}: {reason}')
        
        sys.exit(0 if summary['failed'] == 0 else 1)
    
    finally:
        conn.close()


if __name__ == '__main__':
    main()
