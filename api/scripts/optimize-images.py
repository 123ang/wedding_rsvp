#!/usr/bin/env python3
"""
Image Optimization Script
Optimizes images for faster gallery loading by creating thumbnails and optimized versions

Features:
- Creates thumbnails (1200x800) at 90% quality for gallery display
- Keeps original images for full-size viewing
- Processes existing images in database
- Updates database with thumbnail paths
- Can be run as batch job or on-demand

Usage:
    python scripts/optimize-images.py [options]

Options:
    --all                Process all images in database
    --new                Process only images without thumbnails
    --category CATEGORY  Process specific category only
    --dry-run           Preview what would be processed without making changes
"""

import os
import sys
import argparse
import mysql.connector
from pathlib import Path
from PIL import Image
import time

# Configuration
THUMBNAIL_WIDTH = 1200
THUMBNAIL_HEIGHT = 800
QUALITY = 90
SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.webp']

# Paths
SCRIPT_DIR = Path(__file__).parent
API_DIR = SCRIPT_DIR.parent
ROOT_DIR = API_DIR.parent
UPLOADS_DIR = ROOT_DIR / 'uploads' / 'photos'
THUMBNAILS_DIR = ROOT_DIR / 'uploads' / 'photos' / 'thumbnails'


def load_env():
    """Load environment variables from .env file"""
    env_file = API_DIR / '.env'
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


def ensure_thumbnails_dir():
    """Ensure thumbnails directory exists"""
    THUMBNAILS_DIR.mkdir(parents=True, exist_ok=True)
    print(f'✓ Thumbnails directory ready: {THUMBNAILS_DIR}')


def optimize_image(source_path: Path, thumbnail_path: Path) -> dict:
    """
    Optimize an image by creating a thumbnail version
    
    Args:
        source_path: Path to original image
        thumbnail_path: Path where thumbnail should be saved
    
    Returns:
        dict with status and details
    """
    try:
        # Check if source exists
        if not source_path.exists():
            return {
                'success': False,
                'error': 'Source file not found',
                'original_size': 0,
                'thumbnail_size': 0
            }
        
        original_size = source_path.stat().st_size
        
        # Open image
        with Image.open(source_path) as img:
            # Convert RGBA to RGB if necessary (for JPEG)
            if img.mode in ('RGBA', 'LA', 'P'):
                # Create a white background
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Calculate thumbnail size (maintain aspect ratio)
            img.thumbnail((THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT), Image.Resampling.LANCZOS)
            
            # Save thumbnail with optimization
            img.save(
                thumbnail_path,
                format='JPEG',
                quality=QUALITY,
                optimize=True,
                progressive=True
            )
        
        thumbnail_size = thumbnail_path.stat().st_size
        reduction = ((original_size - thumbnail_size) / original_size * 100) if original_size > 0 else 0
        
        return {
            'success': True,
            'original_size': original_size,
            'thumbnail_size': thumbnail_size,
            'reduction_percent': reduction
        }
    
    except Exception as e:
        return {
            'success': False,
            'error': str(e),
            'original_size': 0,
            'thumbnail_size': 0
        }


def process_photographer_photos(conn, category=None, only_new=False, dry_run=False):
    """Process photos from photographer_photo table"""
    cursor = conn.cursor(dictionary=True)
    
    # Build query
    query = 'SELECT id, image_url, thumbnail_url, category FROM photographer_photo'
    params = []
    
    conditions = []
    if category:
        conditions.append('category = %s')
        params.append(category)
    
    if only_new:
        conditions.append('thumbnail_url IS NULL OR thumbnail_url = ""')
    
    if conditions:
        query += ' WHERE ' + ' AND '.join(conditions)
    
    query += ' ORDER BY id ASC'
    
    cursor.execute(query, params)
    photos = cursor.fetchall()
    
    print(f'\n📸 Found {len(photos)} photos to process in photographer_photo table')
    
    if len(photos) == 0:
        cursor.close()
        return {
            'processed': 0,
            'successful': 0,
            'failed': 0,
            'skipped': 0,
            'total_original_size': 0,
            'total_thumbnail_size': 0,
            'errors': []
        }
    
    stats = {
        'processed': 0,
        'successful': 0,
        'failed': 0,
        'skipped': 0,
        'total_original_size': 0,
        'total_thumbnail_size': 0,
        'errors': []
    }
    
    start_time = time.time()
    
    for i, photo in enumerate(photos, 1):
        photo_id = photo['id']
        image_url = photo['image_url']
        existing_thumbnail = photo['thumbnail_url']
        
        # Skip if already has thumbnail (unless processing all)
        if existing_thumbnail and not dry_run and only_new:
            stats['skipped'] += 1
            continue
        
        # Get source file path
        # image_url is like: /uploads/photos/photo-12345.jpg
        if image_url.startswith('/uploads/photos/'):
            filename = image_url.replace('/uploads/photos/', '')
            source_path = UPLOADS_DIR / filename
        else:
            print(f'   ⚠️  Skipping photo {photo_id}: Invalid image_url format')
            stats['skipped'] += 1
            continue
        
        # Generate thumbnail filename
        thumbnail_filename = f'thumb_{source_path.name}'
        thumbnail_path = THUMBNAILS_DIR / thumbnail_filename
        thumbnail_url = f'/uploads/photos/thumbnails/{thumbnail_filename}'
        
        # Check if source exists
        if not source_path.exists():
            stats['failed'] += 1
            stats['errors'].append({
                'id': photo_id,
                'error': 'Source file not found',
                'path': str(source_path)
            })
            continue
        
        if dry_run:
            print(f'   [{i}/{len(photos)}] Would process: {source_path.name}')
            stats['processed'] += 1
            continue
        
        # Process image
        result = optimize_image(source_path, thumbnail_path)
        
        if result['success']:
            # Update database
            try:
                update_cursor = conn.cursor()
                update_cursor.execute(
                    'UPDATE photographer_photo SET thumbnail_url = %s WHERE id = %s',
                    (thumbnail_url, photo_id)
                )
                conn.commit()
                update_cursor.close()
                
                stats['successful'] += 1
                stats['total_original_size'] += result['original_size']
                stats['total_thumbnail_size'] += result['thumbnail_size']
                
                if (i % 10 == 0) or (i == len(photos)):
                    elapsed = time.time() - start_time
                    rate = stats['successful'] / elapsed if elapsed > 0 else 0
                    print(f'   ✓ [{i}/{len(photos)}] Processed {source_path.name} - '
                          f'{result["original_size"] / 1024 / 1024:.2f}MB → '
                          f'{result["thumbnail_size"] / 1024 / 1024:.2f}MB '
                          f'({result["reduction_percent"]:.1f}% reduction) - '
                          f'{rate:.1f} img/s')
            
            except Exception as e:
                stats['failed'] += 1
                stats['errors'].append({
                    'id': photo_id,
                    'error': f'Database update failed: {str(e)}',
                    'path': str(source_path)
                })
        else:
            stats['failed'] += 1
            stats['errors'].append({
                'id': photo_id,
                'error': result.get('error', 'Unknown error'),
                'path': str(source_path)
            })
        
        stats['processed'] += 1
    
    cursor.close()
    return stats


def main():
    """Main function"""
    load_env()
    
    parser = argparse.ArgumentParser(description='Optimize wedding gallery images')
    parser.add_argument('--all', action='store_true', help='Process all images (including those with thumbnails)')
    parser.add_argument('--new', action='store_true', help='Process only new images without thumbnails (default)')
    parser.add_argument('--category', choices=['pre-wedding', 'brides-dinner', 'morning-wedding', 'grooms-dinner'], 
                        help='Process specific category only')
    parser.add_argument('--dry-run', action='store_true', help='Preview without making changes')
    
    args = parser.parse_args()
    
    # Default to --new if no option specified
    only_new = args.new or not args.all
    
    print('\n' + '=' * 70)
    print('🖼️  Wedding Gallery Image Optimization')
    print('=' * 70)
    print(f'Target size: {THUMBNAIL_WIDTH}x{THUMBNAIL_HEIGHT}')
    print(f'Quality: {QUALITY}%')
    print(f'Mode: {"DRY RUN - No changes will be made" if args.dry_run else "LIVE - Will process and update database"}')
    print(f'Filter: {"Only new images" if only_new else "All images"}')
    if args.category:
        print(f'Category: {args.category}')
    print('=' * 70)
    
    # Ensure thumbnails directory exists
    if not args.dry_run:
        ensure_thumbnails_dir()
    
    # Connect to database
    conn = get_db_connection()
    
    try:
        # Process photographer_photo table
        print('\n📸 Processing photographer_photo table...')
        stats = process_photographer_photos(conn, category=args.category, only_new=only_new, dry_run=args.dry_run)
        
        elapsed = time.time()
        
        # Print summary
        print('\n' + '=' * 70)
        print('✅ Processing Complete!')
        print('=' * 70)
        print(f'Total Processed:      {stats["processed"]}')
        print(f'Successful:           {stats["successful"]} ✅')
        print(f'Failed:               {stats["failed"]} {"❌" if stats["failed"] > 0 else ""}')
        print(f'Skipped:              {stats["skipped"]}')
        
        if not args.dry_run and stats['successful'] > 0:
            total_saved = stats['total_original_size'] - stats['total_thumbnail_size']
            reduction_percent = (total_saved / stats['total_original_size'] * 100) if stats['total_original_size'] > 0 else 0
            
            print(f'\nOriginal Total Size:  {stats["total_original_size"] / 1024 / 1024:.2f} MB')
            print(f'Thumbnail Total Size: {stats["total_thumbnail_size"] / 1024 / 1024:.2f} MB')
            print(f'Space Saved:          {total_saved / 1024 / 1024:.2f} MB ({reduction_percent:.1f}% reduction)')
        
        print('=' * 70)
        
        if stats['errors']:
            print(f'\n❌ Errors ({len(stats["errors"])}):')
            for i, err in enumerate(stats['errors'][:10], 1):
                print(f'   {i}. ID {err["id"]}: {err["error"]}')
            if len(stats['errors']) > 10:
                print(f'   ... and {len(stats["errors"]) - 10} more errors')
        
        if args.dry_run:
            print('\n💡 This was a dry run. Run without --dry-run to actually process images.')
        
        sys.exit(0 if stats['failed'] == 0 else 1)
    
    finally:
        conn.close()


if __name__ == '__main__':
    main()
