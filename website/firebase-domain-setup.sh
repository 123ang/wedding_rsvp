#!/bin/bash

# Firebase Custom Domain Setup Script
# This script helps diagnose and setup custom domain for Firebase Hosting

echo "=== Firebase Custom Domain Diagnostic ==="
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed"
    echo "Install it with: npm install -g firebase-tools"
    exit 1
fi

echo "✅ Firebase CLI installed"
echo ""

# Check Firebase login status
echo "Checking Firebase login status..."
firebase projects:list > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Not logged in to Firebase"
    echo "Run: firebase login"
    exit 1
fi

echo "✅ Logged in to Firebase"
echo ""

# List hosting sites
echo "=== Firebase Hosting Sites ==="
firebase hosting:sites:list

echo ""
echo "=== Firebase Custom Domains ==="
firebase hosting:domains:list

echo ""
echo "=== Next Steps ==="
echo "1. Add your domain in Firebase Console: https://console.firebase.google.com/"
echo "2. Go to Hosting → Custom domains → Add custom domain"
echo "3. Enter: jsang-psong-wedding.com"
echo "4. Add DNS records as shown in Firebase Console"
echo "5. Wait for SSL certificate provisioning (24-72 hours)"
echo "6. Redeploy: npm run build && firebase deploy --only hosting"
echo ""
echo "=== Verify DNS Records ==="
echo "Check DNS propagation: https://dnschecker.org"
echo "Enter: jsang-psong-wedding.com"
echo ""
echo "=== Check Domain Status ==="
echo "firebase hosting:domains:list"

