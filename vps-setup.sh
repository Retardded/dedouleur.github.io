#!/bin/bash

# VPS Setup Script for Portfolio Backend
# This script automates the deployment process

set -e  # Exit on any error

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║         🚀 VPS Deployment Setup Script                        ║"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/portfolio"
APP_NAME="portfolio"
PORT=3005

# Functions
print_step() {
    echo -e "\n${YELLOW}===> $1${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if running with sudo
if [ "$EUID" -ne 0 ] && ! sudo -n true 2>/dev/null; then
    print_error "This script needs sudo privileges. Please run with sudo or as root."
    exit 1
fi

# Step 1: Update System
print_step "Step 1: Updating system packages"
sudo apt update
sudo apt upgrade -y
print_success "System updated"

# Step 2: Install Node.js
print_step "Step 2: Installing Node.js 18.x"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
    print_success "Node.js installed: $(node --version)"
else
    print_success "Node.js already installed: $(node --version)"
fi

# Step 3: Install PM2
print_step "Step 3: Installing PM2 process manager"
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    print_success "PM2 installed"
else
    print_success "PM2 already installed"
fi

# Step 4: Install Nginx
print_step "Step 4: Installing Nginx web server"
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
    print_success "Nginx installed and started"
else
    print_success "Nginx already installed"
fi

# Step 5: Install Git
print_step "Step 5: Installing Git"
if ! command -v git &> /dev/null; then
    sudo apt install -y git
    print_success "Git installed"
else
    print_success "Git already installed"
fi

# Step 6: Create Application Directory
print_step "Step 6: Setting up application directory"
if [ ! -d "$APP_DIR" ]; then
    sudo mkdir -p "$APP_DIR"
    sudo chown -R $USER:$USER "$APP_DIR"
    print_success "Directory created: $APP_DIR"
else
    print_success "Directory already exists: $APP_DIR"
fi

# Step 7: Setup Firewall
print_step "Step 7: Configuring firewall"
sudo ufw allow 22/tcp  # SSH
sudo ufw allow 80/tcp  # HTTP
sudo ufw allow 443/tcp # HTTPS
echo "y" | sudo ufw enable || true
print_success "Firewall configured"

# Step 8: Create Environment File Template
print_step "Step 8: Creating environment file template"
cat > "$APP_DIR/.env.example" << 'EOF'
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=dodqmzv8c
CLOUDINARY_API_KEY=177678439452387
CLOUDINARY_API_SECRET=Y8T6e-oV4n1ImUpKQB8bfvuJJcU

# Neon PostgreSQL Database
DATABASE_URL=postgresql://neondb_owner:npg_8MX4cUdeBqAH@ep-plain-wind-aesquc2e.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require

# Server Configuration
PORT=3005
NODE_ENV=production
EOF
print_success "Environment template created"

# Step 9: Create Nginx Configuration
print_step "Step 9: Configuring Nginx"

# Get server IP or domain
read -p "Enter your domain name (or press Enter to use IP address): " DOMAIN
if [ -z "$DOMAIN" ]; then
    DOMAIN=$(hostname -I | awk '{print $1}')
    print_success "Using IP address: $DOMAIN"
else
    print_success "Using domain: $DOMAIN"
fi

sudo tee /etc/nginx/sites-available/$APP_NAME > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Allow large uploads (otherwise Nginx can return 413 Request Entity Too Large)
    # Adjust as needed (e.g. 50m, 200m)
    client_max_body_size 200m;

    # Serve frontend static files
    root $APP_DIR/dist;
    index index.html;

    # Frontend - serve static files
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API - proxy to Node.js
    location /api {
        # Also apply here for clarity (server-level directive above is sufficient)
        client_max_body_size 200m;

        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Admin panel route
    location /x9k2m8p7q4n6 {
        try_files \$uri \$uri/ /index.html;
    }

    # Images proxy
    location /images {
        proxy_pass http://localhost:$PORT;
    }

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/$APP_NAME /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
print_success "Nginx configured and restarted"

# Step 10: Create Deployment Script
print_step "Step 10: Creating deployment script"
cat > "$APP_DIR/deploy.sh" << 'DEPLOY_EOF'
#!/bin/bash
set -e

APP_DIR="/var/www/portfolio"
APP_NAME="portfolio"

cd $APP_DIR

echo "📥 Pulling latest changes..."
git pull origin main

echo "📦 Installing dependencies..."
npm install --production

echo "🔨 Building frontend..."
npm run build

echo "🔄 Restarting backend..."
pm2 restart $APP_NAME 2>/dev/null || pm2 start server/index.js --name $APP_NAME

echo "✅ Deployment complete!"
pm2 status
DEPLOY_EOF

chmod +x "$APP_DIR/deploy.sh"
print_success "Deployment script created"

# Summary
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║         ✅ VPS Setup Complete!                                ║"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo ""
echo "1. Clone your repository to $APP_DIR:"
echo "   cd $APP_DIR"
echo "   git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git ."
echo ""
echo "2. Copy and configure environment variables:"
echo "   cp .env.example .env"
echo "   nano .env"
echo ""
echo "3. Install dependencies and build:"
echo "   npm install --production"
echo "   npm run build"
echo ""
echo "4. Start the application:"
echo "   pm2 start server/index.js --name $APP_NAME"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "5. Access your website:"
echo "   Website: http://$DOMAIN"
echo "   Admin:   http://$DOMAIN/x9k2m8p7q4n6"
echo "   Password: KJr5iCm9iwsMsl50ojXSHpTe"
echo ""
echo -e "${YELLOW}Optional: Setup SSL (HTTPS)${NC}"
echo "   sudo apt install certbot python3-certbot-nginx"
echo "   sudo certbot --nginx -d $DOMAIN"
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║         🎉 Your VPS is ready for deployment!                  ║"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo ""
