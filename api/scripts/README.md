# ZIP Upload Scripts

## upload-zip.js (Node.js)

A standalone script to upload photos from a ZIP file to the wedding photo database.

## process-zip-folder.js (Node.js)

A batch processing script that processes all ZIP files in a folder, then deletes them after successful processing.

## process-zip-folder.py (Python) ⭐ **Recommended for Large Files**

A Python-based batch processing script that handles large ZIP files (>2GB) better than the Node.js version.

### Features

- ✅ **Handles ZIP files >2GB** (no 2GB limit like Node.js version)
- ✅ Processes all ZIP files in a specified folder automatically
- ✅ Deletes ZIP files after successful processing
- ✅ Keeps ZIP files if processing fails or has too many errors
- ✅ Uses `angjinsheng@gmail.com` as default photographer email
- ✅ Interactive or command-line modes
- ✅ Summary report after batch processing
- ✅ Better memory management for large files

### Installation

First, install the required Python package:

```bash
cd api/scripts
pip install -r requirements.txt
```

Or install directly:

```bash
pip install mysql-connector-python
```

### Usage

#### Interactive Mode (Recommended)

Run the script without arguments:

```bash
cd api
python scripts/process-zip-folder.py
```

The script will prompt you for:
1. ZIP folder path (defaults to `../uploads/zip` if you press Enter)
2. Category (pre-wedding, brides-dinner, morning-wedding, grooms-dinner)

#### Command-Line Mode

```bash
cd api
python scripts/process-zip-folder.py <folder-path> [category]
```

**Examples:**

```bash
# Process all ZIPs in uploads/zip folder with morning-wedding category
python scripts/process-zip-folder.py ../uploads/zip morning-wedding

# Process all ZIPs in a specific folder
python scripts/process-zip-folder.py "C:\path\to\zip\folder" pre-wedding

# Interactive mode (will prompt for folder and category)
python scripts/process-zip-folder.py
```

### How It Works

1. Scans the specified folder for all `.zip` files
2. Shows you the list of ZIP files found with file sizes
3. Asks for confirmation before processing
4. Processes each ZIP file one by one:
   - Uses Python's `zipfile` library (no 2GB limit)
   - Extracts and uploads images to database in batches of 100
   - Deletes ZIP file **only** if processing is successful
   - Keeps ZIP file if there are too many failures (>10% failed images)
5. Shows a summary of all processed files

### Notes

- ZIP files are **automatically deleted** after successful processing
- If a ZIP file has errors, it will be **kept** for manual review
- Default photographer email: `angjinsheng@gmail.com`
- All ZIP files in the folder will be processed with the **same category**
- Processed in batches of 100 images to prevent memory issues
- **Works with ZIP files larger than 2GB** (unlike Node.js version)

### Features

- ✅ Processes all ZIP files in a specified folder automatically
- ✅ Deletes ZIP files after successful processing
- ✅ Keeps ZIP files if processing fails or has too many errors
- ✅ Uses `angjinsheng@gmail.com` as default photographer email
- ✅ Interactive or command-line modes
- ✅ Summary report after batch processing

### Usage

#### Interactive Mode (Recommended)

Run the script without arguments:

```bash
cd api
node scripts/process-zip-folder.js
```

Or use npm:

```bash
cd api
npm run process-zip-folder
```

The script will prompt you for:
1. ZIP folder path (defaults to `../uploads/zip` if you press Enter)
2. Category (pre-wedding, brides-dinner, morning-wedding, grooms-dinner)

#### Command-Line Mode

```bash
cd api
node scripts/process-zip-folder.js <folder-path> [category]
```

**Examples:**

```bash
# Process all ZIPs in uploads/zip folder with morning-wedding category
node scripts/process-zip-folder.js ../uploads/zip morning-wedding

# Process all ZIPs in a specific folder
node scripts/process-zip-folder.js "C:\path\to\zip\folder" pre-wedding

# Interactive mode (will prompt for folder and category)
node scripts/process-zip-folder.js
```

### How It Works

1. Scans the specified folder for all `.zip` files
2. Shows you the list of ZIP files found
3. Asks for confirmation before processing
4. Processes each ZIP file one by one:
   - Extracts and uploads images to database
   - Deletes ZIP file **only** if processing is successful
   - Keeps ZIP file if there are too many failures (>10% failed images)
5. Shows a summary of all processed files

### Notes

- ZIP files are **automatically deleted** after successful processing
- If a ZIP file has errors, it will be **kept** for manual review
- Default photographer email: `angjinsheng@gmail.com`
- All ZIP files in the folder will be processed with the **same category**
- Processed in batches of 100 images to prevent memory issues

### Features

- ✅ Interactive category selection
- ✅ Batch processing (100 images at a time) to prevent memory issues
- ✅ Progress tracking with real-time statistics
- ✅ Error handling that continues processing even if individual images fail
- ✅ Supports both interactive and command-line modes

### Usage

#### Interactive Mode (Recommended)

Run the script without arguments to use interactive mode:

```bash
cd api
node scripts/upload-zip.js
```

The script will prompt you for:
1. ZIP file path
2. Category (pre-wedding, brides-dinner, morning-wedding, grooms-dinner)
3. Photographer email (optional, defaults to "angjinsheng@gmail.com")

#### Command-Line Mode

Run with arguments for non-interactive mode:

```bash
cd api
node scripts/upload-zip.js <zip-file-path> [category] [photographer-email]
```

**Examples:**

```bash
# Upload with all options
node scripts/upload-zip.js /path/to/photos.zip pre-wedding angjinsheng@gmail.com

# Upload with just file and category (uses default email)
node scripts/upload-zip.js /path/to/photos.zip morning-wedding

# Just specify the file (will prompt for category)
node scripts/upload-zip.js /path/to/photos.zip
```

### Categories

- `pre-wedding` - Pre-Wedding photos
- `brides-dinner` - Bride's Dinner photos
- `morning-wedding` - Morning Wedding photos
- `grooms-dinner` - Groom's Dinner photos

### Supported Image Formats

- JPG/JPEG
- PNG
- GIF
- WebP

### Requirements

- Node.js installed
- Database connection configured in `.env` or environment variables
- ZIP file containing image files

### Environment Variables

The script uses the same database configuration as the API:

- `DB_HOST` - Database host (default: localhost)
- `DB_USER` - Database user (default: root)
- `DB_PASSWORD` - Database password (default: empty)
- `DB_NAME` - Database name (default: wedding_rsvp)

### Notes

- The script processes images in batches of 100 to prevent memory issues
- Large ZIP files (5GB+) are supported
- Failed images are logged but don't stop the entire process
- Photos are saved to `uploads/photos/` directory
- Database records are created in the `photographer_photo` table

### Troubleshooting

**Error: Database connection failed**
- Check your `.env` file or environment variables
- Ensure MySQL is running
- Verify database credentials

**Error: File not found**
- Use absolute paths or paths relative to the `api/` directory
- On Windows, use forward slashes or double backslashes: `C:\\path\\to\\file.zip`

**Error: No image files found**
- Ensure your ZIP file contains image files with supported extensions
- Check that files are not in nested folders (the script will process them)

**Memory issues with very large ZIP files**
- The script already processes in batches, but if you still have issues:
  - Close other applications
  - Consider splitting the ZIP into smaller files
  - The batch size can be reduced in the script (change `BATCH_SIZE = 100` to a smaller number)
