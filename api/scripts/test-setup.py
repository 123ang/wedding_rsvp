#!/usr/bin/env python3
"""
Test Image Optimization Setup
Quick verification that everything is configured correctly
"""

import sys
import os
from pathlib import Path

print("\n" + "=" * 60)
print("  Image Optimization Setup Test")
print("=" * 60 + "\n")

all_checks_passed = True

# Check 1: Pillow installed
print("1. Checking Pillow (PIL) installation...")
try:
    from PIL import Image
    print("   ✅ Pillow is installed")
except ImportError:
    print("   ❌ Pillow is NOT installed")
    print("      Run: pip3 install Pillow")
    all_checks_passed = False

# Check 2: MySQL connector installed
print("\n2. Checking MySQL connector...")
try:
    import mysql.connector
    print("   ✅ mysql-connector-python is installed")
except ImportError:
    print("   ❌ mysql-connector-python is NOT installed")
    print("      Run: pip3 install mysql-connector-python")
    all_checks_passed = False

# Check 3: Uploads directory exists
print("\n3. Checking uploads directory...")
uploads_dir = Path(__file__).parent.parent.parent / 'uploads' / 'photos'
if uploads_dir.exists():
    print(f"   ✅ Uploads directory exists: {uploads_dir}")
else:
    print(f"   ⚠️  Uploads directory not found: {uploads_dir}")
    print("      This is okay if you haven't uploaded any photos yet")

# Check 4: Thumbnails directory
print("\n4. Checking thumbnails directory...")
thumbnails_dir = uploads_dir / 'thumbnails'
if thumbnails_dir.exists():
    print(f"   ✅ Thumbnails directory exists: {thumbnails_dir}")
else:
    print(f"   ⚠️  Thumbnails directory not found: {thumbnails_dir}")
    print("      Creating it now...")
    try:
        thumbnails_dir.mkdir(parents=True, exist_ok=True)
        print("      ✅ Created thumbnails directory")
    except Exception as e:
        print(f"      ❌ Failed to create directory: {e}")
        all_checks_passed = False

# Check 5: Database connection
print("\n5. Checking database connection...")
try:
    # Try to load .env
    env_file = Path(__file__).parent.parent / '.env'
    if env_file.exists():
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()
    
    import mysql.connector
    config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'user': os.getenv('DB_USER', 'root'),
        'password': os.getenv('DB_PASSWORD', ''),
        'database': os.getenv('DB_NAME', 'wedding_rsvp')
    }
    
    conn = mysql.connector.connect(**config)
    print("   ✅ Database connection successful")
    
    # Check if thumbnail_url column exists
    cursor = conn.cursor()
    cursor.execute("SHOW COLUMNS FROM photographer_photo LIKE 'thumbnail_url'")
    result = cursor.fetchone()
    
    if result:
        print("   ✅ thumbnail_url column exists in database")
    else:
        print("   ❌ thumbnail_url column NOT found in database")
        print("      Run: mysql -u root -p wedding_rsvp < database/migration_add_thumbnails.sql")
        all_checks_passed = False
    
    # Check how many photos need optimization
    cursor.execute("""
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN thumbnail_url IS NOT NULL AND thumbnail_url != '' THEN 1 ELSE 0 END) as optimized
        FROM photographer_photo
    """)
    result = cursor.fetchone()
    if result:
        total, optimized = result
        pending = total - optimized if optimized else total
        print(f"\n   📊 Database Status:")
        print(f"      Total photos: {total}")
        print(f"      Optimized: {optimized}")
        print(f"      Pending: {pending}")
    
    cursor.close()
    conn.close()
    
except mysql.connector.Error as err:
    print(f"   ❌ Database connection failed: {err}")
    print("      Check your .env file or database credentials")
    all_checks_passed = False
except Exception as e:
    print(f"   ❌ Error checking database: {e}")
    all_checks_passed = False

# Check 6: Optimization script exists
print("\n6. Checking optimization script...")
script_path = Path(__file__).parent / 'optimize-images.py'
if script_path.exists():
    print(f"   ✅ Optimization script found: {script_path}")
else:
    print(f"   ❌ Optimization script NOT found: {script_path}")
    all_checks_passed = False

# Summary
print("\n" + "=" * 60)
if all_checks_passed:
    print("  ✅ All checks passed! Setup is complete.")
    print("=" * 60)
    print("\n📋 Next steps:")
    print("   1. Upload photos via photographer portal")
    print("   2. Run: python3 scripts/optimize-images.py --new")
    print("   3. View gallery at: http://localhost:5173/gallery/pre-wedding")
else:
    print("  ⚠️  Some checks failed. Please fix the issues above.")
    print("=" * 60)
    print("\n📚 For help, see:")
    print("   - IMAGE_OPTIMIZATION_SUMMARY.md")
    print("   - api/scripts/IMAGE_OPTIMIZATION_GUIDE.md")

print()
sys.exit(0 if all_checks_passed else 1)
