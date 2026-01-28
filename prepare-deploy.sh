#!/bin/bash

# Production Deployment Preparation Script
# This script prepares the project for deployment by cleaning up and building

set -e  # Exit on any error

echo "🚀 Starting production deployment preparation..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Clean previous builds
echo -e "\n${YELLOW}Step 1: Cleaning previous builds...${NC}"
if [ -d "dist" ]; then
    rm -rf dist
    echo "✓ Removed old dist folder"
fi

# Step 2: Install dependencies
echo -e "\n${YELLOW}Step 2: Installing dependencies...${NC}"
npm install
echo "✓ Dependencies installed"

# Step 3: Build the project
echo -e "\n${YELLOW}Step 3: Building production bundle...${NC}"
npm run build
echo "✓ Production build complete"

# Step 4: Create deployment package
echo -e "\n${YELLOW}Step 4: Creating deployment package...${NC}"

# Create deployment directory
DEPLOY_DIR="deploy_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$DEPLOY_DIR"

# Copy necessary files
cp -r dist "$DEPLOY_DIR/"
cp -r server "$DEPLOY_DIR/"
cp package.json "$DEPLOY_DIR/"
cp package-lock.json "$DEPLOY_DIR/"

# Create minimal .gitignore for deployment
cat > "$DEPLOY_DIR/.gitignore" << EOF
node_modules
server/data
.env
.env.local
EOF

# Create README for deployment package
cat > "$DEPLOY_DIR/README.md" << EOF
# Production Deployment Package

## Quick Start

1. Install dependencies:
   \`\`\`bash
   npm install --production
   \`\`\`

2. Start the server:
   \`\`\`bash
   npm start
   \`\`\`

3. Access your website at http://localhost:3005

## Admin Panel

- Access at: /x9k2m8p7q4n6
- Password: KJr5iCm9iwsMsl50ojXSHpTe

⚠️ Keep this information secure!

## Using PM2 (Recommended for Production)

\`\`\`bash
npm install -g pm2
pm2 start server/index.js --name "portfolio"
pm2 save
pm2 startup
\`\`\`

## Environment Variables

Set custom port (optional):
\`\`\`bash
export PORT=3005
\`\`\`
EOF

echo "✓ Deployment package created: $DEPLOY_DIR"

# Step 5: Create archive
echo -e "\n${YELLOW}Step 5: Creating archive...${NC}"
tar -czf "${DEPLOY_DIR}.tar.gz" "$DEPLOY_DIR"
echo "✓ Archive created: ${DEPLOY_DIR}.tar.gz"

# Step 6: Display summary
echo -e "\n${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Deployment preparation complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "\n📦 Deployment package: ${YELLOW}${DEPLOY_DIR}.tar.gz${NC}"
echo -e "\n📋 Next steps:"
echo -e "   1. Upload ${YELLOW}${DEPLOY_DIR}.tar.gz${NC} to your server"
echo -e "   2. Extract: ${YELLOW}tar -xzf ${DEPLOY_DIR}.tar.gz${NC}"
echo -e "   3. Navigate: ${YELLOW}cd ${DEPLOY_DIR}${NC}"
echo -e "   4. Install: ${YELLOW}npm install --production${NC}"
echo -e "   5. Start: ${YELLOW}npm start${NC}"
echo -e "\n🔐 Security info:"
echo -e "   Admin URL: ${YELLOW}/x9k2m8p7q4n6${NC}"
echo -e "   Password: ${YELLOW}KJr5iCm9iwsMsl50ojXSHpTe${NC}"
echo -e "\n⚠️  ${RED}Keep credentials secure and don't commit to git!${NC}\n"

# Optional: Remove deployment directory (keep archive only)
read -p "Remove deployment directory (keep archive)? [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -rf "$DEPLOY_DIR"
    echo "✓ Deployment directory removed"
fi

echo -e "\n${GREEN}Done! 🎉${NC}\n"
