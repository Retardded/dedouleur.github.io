#!/bin/bash

echo "🔍 Checking for onrender references..."
echo ""

echo "1. Checking backend code..."
grep -r "onrender\|render\.com" server/ 2>/dev/null && echo "❌ Found onrender in backend code!" || echo "✅ No onrender references in backend code"

echo ""
echo "2. Checking frontend source code..."
grep -r "onrender\|render\.com" src/ 2>/dev/null && echo "❌ Found onrender in frontend source!" || echo "✅ No onrender references in frontend source"

echo ""
echo "3. Checking .env file..."
grep -i "onrender\|render\.com" .env 2>/dev/null && echo "❌ Found onrender in .env!" || echo "✅ No onrender references in .env"

echo ""
echo "4. Current API_BASE_URL in src/lib/api.ts:"
grep "API_BASE_URL" src/lib/api.ts | head -1

echo ""
echo "📋 Next steps:"
echo "   - If running on VPS, check: cat ~/portfolio-backend/.env"
echo "   - Rebuild frontend: npm run build"
echo "   - Check VPS logs: pm2 logs portfolio-api"
