#!/bin/bash
# Script to move photos 1-18.jpg from public/photos to uploads/photos/pre_wedding/
# Run this from the project root directory

# Create pre_wedding directory if it doesn't exist
mkdir -p uploads/photos/pre_wedding

# Move photos 1-18.jpg to pre_wedding folder
for i in {1..18}; do
  if [ -f "website/public/photos/${i}.jpg" ]; then
    cp "website/public/photos/${i}.jpg" "uploads/photos/pre_wedding/${i}.jpg"
    echo "Copied ${i}.jpg to uploads/photos/pre_wedding/"
  else
    echo "Warning: ${i}.jpg not found in website/public/photos/"
  fi
done

echo "Done! Photos have been copied to uploads/photos/pre_wedding/"

