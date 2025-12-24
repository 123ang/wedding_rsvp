@echo off
REM Script to move photos 1-18.jpg from public/photos to uploads/photos/pre_wedding/
REM Run this from the project root directory on Windows

REM Create pre_wedding directory if it doesn't exist
if not exist "uploads\photos\pre_wedding" mkdir "uploads\photos\pre_wedding"

REM Copy photos 1-18.jpg to pre_wedding folder
for /L %%i in (1,1,18) do (
    if exist "website\public\photos\%%i.jpg" (
        copy "website\public\photos\%%i.jpg" "uploads\photos\pre_wedding\%%i.jpg"
        echo Copied %%i.jpg to uploads\photos\pre_wedding\
    ) else (
        echo Warning: %%i.jpg not found in website\public\photos\
    )
)

echo Done! Photos have been copied to uploads\photos\pre_wedding\

