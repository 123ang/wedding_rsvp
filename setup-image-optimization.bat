@echo off
REM Quick setup script for image optimization system (Windows)

echo ==================================================
echo   Image Optimization System Setup
echo ==================================================
echo.

REM Check if we're in the right directory
if not exist "api" (
    echo Error: Please run this script from the project root directory (wedding_rsvp)
    exit /b 1
)

REM Step 1: Install Python dependencies
echo Step 1: Installing Python dependencies...
cd api\scripts
pip3 install -r requirements.txt
if errorlevel 1 (
    echo Failed to install Python dependencies
    echo Try: python -m pip install -r requirements.txt
    cd ..\..
    exit /b 1
)
cd ..\..
echo Python dependencies installed
echo.

REM Step 2: Run database migration
echo Step 2: Running database migration...
echo Please enter your MySQL root password when prompted
mysql -u root -p wedding_rsvp < database\migration_add_thumbnails.sql
if errorlevel 1 (
    echo Database migration may have failed
    echo You can run it manually: mysql -u root -p wedding_rsvp ^< database\migration_add_thumbnails.sql
) else (
    echo Database migration complete
)
echo.

REM Step 3: Create thumbnails directory
echo Step 3: Creating thumbnails directory...
if not exist "uploads\photos\thumbnails" mkdir uploads\photos\thumbnails
echo Thumbnails directory ready
echo.

REM Step 4: Optimize existing images
echo Step 4: Would you like to optimize existing images now?
echo This may take a while if you have many images.
set /p optimize="Optimize now? (y/n): "
if /i "%optimize%"=="y" (
    cd api
    python scripts\optimize-images.py --all
    cd ..
    echo Image optimization complete!
) else (
    echo Skipped image optimization
    echo You can run it later with: cd api ^&^& python scripts\optimize-images.py --all
)
echo.

REM Step 5: Setup complete
echo ==================================================
echo   Setup Complete!
echo ==================================================
echo.
echo Next steps:
echo.
echo 1. Start your development server:
echo    cd website ^&^& npm run dev
echo.
echo 2. Test the gallery at:
echo    http://localhost:5173/gallery/pre-wedding
echo.
echo 3. Upload new photos via photographer portal:
echo    http://localhost:5173/photographer/upload
echo.
echo 4. After uploading, optimize new images:
echo    cd api ^&^& python scripts\optimize-images.py --new
echo.
echo 5. Or set up a scheduled task for automatic optimization
echo    (Use Windows Task Scheduler)
echo.
echo For more information, see:
echo    api\scripts\IMAGE_OPTIMIZATION_GUIDE.md
echo.
pause
