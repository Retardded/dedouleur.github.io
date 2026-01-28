# 🚀 VPS Deployment Guide - Complete Setup

## 📋 Prerequisites

- VPS with Ubuntu 20.04+ (or similar Linux)
- Root or sudo access
- Domain name (optional but recommended)
- SSH access to VPS

---

## 🎯 Quick Overview

Your setup will be:
```
Domain/IP → Nginx (reverse proxy) → Node.js Server (port 3005)
                                      ↓
                              Neon PostgreSQL + Cloudinary
```

---

## 📦 Step 1: Prepare Your VPS

### 1.1 Connect to VPS
```bash
ssh root@your-vps-ip
# or
ssh your-user@your-vps-ip
```

### 1.2 Update System
```bash
sudo apt update
sudo apt upgrade -y
```

### 1.3 Install Node.js (v18+)
```bash
# Install Node.js using NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x or higher
npm --version
```

### 1.4 Install PM2 (Process Manager)
```bash
sudo npm install -g pm2

# Verify
pm2 --version
```

### 1.5 Install Nginx (Web Server)
```bash
sudo apt install -y nginx

# Start nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

### 1.6 Install Git
```bash
sudo apt install -y git
```

---

## 📁 Step 2: Deploy Your Application

### 2.1 Create Application Directory
```bash
cd /var/www
sudo mkdir -p portfolio
sudo chown -R $USER:$USER portfolio
cd portfolio
```

### 2.2 Clone Your Repository
```bash
# If using GitHub
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .

# Or upload files manually using SCP/SFTP
```

### 2.3 Install Dependencies
```bash
npm install --production
```

### 2.4 Build Frontend (if not already built)
```bash
npm run build
```

---

## 🔐 Step 3: Configure Environment Variables

### 3.1 Create .env File
```bash
nano .env
```

### 3.2 Add Your Configuration
```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=dodqmzv8c
CLOUDINARY_API_KEY=177678439452387
CLOUDINARY_API_SECRET=Y8T6e-oV4n1ImUpKQB8bfvuJJcU

# Neon PostgreSQL Database
DATABASE_URL=postgresql://neondb_owner:npg_8MX4cUdeBqAH@ep-plain-wind-aesquc2e.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require

# Server Configuration
PORT=3005
NODE_ENV=production
```

**Save:** Press `Ctrl+X`, then `Y`, then `Enter`

### 3.3 Secure the .env File
```bash
chmod 600 .env
```

---

## 🚀 Step 4: Start Application with PM2

### 4.1 Start the Server
```bash
pm2 start server/index.js --name "portfolio"
```

### 4.2 Save PM2 Configuration
```bash
pm2 save
```

### 4.3 Enable PM2 on System Boot
```bash
pm2 startup
# Copy and run the command it outputs
```

### 4.4 Check Status
```bash
pm2 status
pm2 logs portfolio
```

---

## 🌐 Step 5: Configure Nginx (Reverse Proxy)

### 5.1 Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/portfolio
```

### 5.2 Add Configuration (Option A - With Domain)
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Serve frontend static files
    root /var/www/portfolio/dist;
    index index.html;

    # Frontend - serve static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API - proxy to Node.js
    location /api {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Admin panel route
    location /x9k2m8p7q4n6 {
        try_files $uri $uri/ /index.html;
    }

    # Images from Cloudinary (just in case)
    location /images {
        proxy_pass http://localhost:3005;
    }

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### 5.3 Alternative Configuration (Option B - IP Only, No Domain)
```nginx
server {
    listen 80;
    server_name your-vps-ip;

    root /var/www/portfolio/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /x9k2m8p7q4n6 {
        try_files $uri $uri/ /index.html;
    }

    location /images {
        proxy_pass http://localhost:3005;
    }
}
```

**Save:** Press `Ctrl+X`, then `Y`, then `Enter`

### 5.4 Enable the Site
```bash
sudo ln -s /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/
```

### 5.5 Test Nginx Configuration
```bash
sudo nginx -t
```

### 5.6 Restart Nginx
```bash
sudo systemctl restart nginx
```

---

## 🔒 Step 6: Setup SSL (HTTPS) - OPTIONAL BUT RECOMMENDED

### 6.1 Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 6.2 Get SSL Certificate
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Follow the prompts:
- Enter your email
- Agree to terms
- Choose to redirect HTTP to HTTPS (recommended)

### 6.3 Auto-Renewal Test
```bash
sudo certbot renew --dry-run
```

---

## 🔥 Step 7: Configure Firewall

### 7.1 Setup UFW Firewall
```bash
# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## 📊 Step 8: Verify Everything Works

### 8.1 Check PM2 Status
```bash
pm2 status
pm2 logs portfolio
```

### 8.2 Check Nginx Status
```bash
sudo systemctl status nginx
```

### 8.3 Test Your Website
```bash
# If using domain
curl http://your-domain.com
curl http://your-domain.com/api/projects

# If using IP
curl http://your-vps-ip
curl http://your-vps-ip/api/projects
```

### 8.4 Access in Browser
- **Main Site**: `http://your-domain.com` or `http://your-vps-ip`
- **Admin Panel**: `http://your-domain.com/x9k2m8p7q4n6`
- **Password**: `KJr5iCm9iwsMsl50ojXSHpTe`

---

## 🔄 Step 9: Update/Redeploy Your Application

### 9.1 Pull Latest Changes
```bash
cd /var/www/portfolio
git pull origin main
```

### 9.2 Install New Dependencies (if any)
```bash
npm install --production
```

### 9.3 Rebuild Frontend
```bash
npm run build
```

### 9.4 Restart Backend
```bash
pm2 restart portfolio
```

### 9.5 Reload Nginx (if config changed)
```bash
sudo systemctl reload nginx
```

---

## 🛠️ Useful PM2 Commands

```bash
# View logs
pm2 logs portfolio

# Restart app
pm2 restart portfolio

# Stop app
pm2 stop portfolio

# Delete app from PM2
pm2 delete portfolio

# Monitor resources
pm2 monit

# Show app info
pm2 show portfolio

# List all apps
pm2 list
```

---

## 🆘 Troubleshooting

### Backend Won't Start
```bash
# Check logs
pm2 logs portfolio

# Check if port 3005 is in use
sudo lsof -i :3005

# Kill process on port 3005
sudo kill -9 $(sudo lsof -t -i:3005)

# Restart
pm2 restart portfolio
```

### Nginx Errors
```bash
# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check nginx config
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
```

### Database Connection Issues
```bash
# Test database connection
node -e "import('pg').then(({default: pg}) => { const client = new pg.Client({connectionString: 'YOUR_DATABASE_URL', ssl: {rejectUnauthorized: false}}); client.connect().then(() => console.log('✓ Connected')).catch(e => console.error('✗', e)); });"
```

### Can't Access Website
```bash
# Check if nginx is running
sudo systemctl status nginx

# Check if port 80 is open
sudo ufw status

# Check if domain points to your IP
dig your-domain.com
```

---

## 📝 Environment Variables Summary

Add these to your `/var/www/portfolio/.env`:

```env
CLOUDINARY_CLOUD_NAME=dodqmzv8c
CLOUDINARY_API_KEY=177678439452387
CLOUDINARY_API_SECRET=Y8T6e-oV4n1ImUpKQB8bfvuJJcU
DATABASE_URL=postgresql://neondb_owner:npg_8MX4cUdeBqAH@ep-plain-wind-aesquc2e.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require
PORT=3005
NODE_ENV=production
```

---

## 🎯 Quick Deployment Script

Create `deploy.sh` on your VPS:

```bash
#!/bin/bash
cd /var/www/portfolio
echo "📥 Pulling latest changes..."
git pull origin main
echo "📦 Installing dependencies..."
npm install --production
echo "🔨 Building frontend..."
npm run build
echo "🔄 Restarting backend..."
pm2 restart portfolio
echo "✅ Deployment complete!"
pm2 status
```

Make it executable:
```bash
chmod +x deploy.sh
```

Use it:
```bash
./deploy.sh
```

---

## 🔐 Security Checklist

- [x] Firewall configured (UFW)
- [x] SSH key authentication (recommended over password)
- [x] SSL/HTTPS enabled
- [x] .env file secured (chmod 600)
- [x] Admin panel URL obscured
- [x] Strong password set
- [x] Rate limiting enabled
- [x] Regular security updates

---

## 📊 Architecture on VPS

```
Internet
   ↓
Nginx (Port 80/443)
   ↓
Node.js Server (Port 3005)
   ↓
┌─────────────┬──────────────┐
│   Neon      │  Cloudinary  │
│ PostgreSQL  │     CDN      │
└─────────────┴──────────────┘
```

---

## ✅ Final Checklist

- [ ] VPS updated and secured
- [ ] Node.js v18+ installed
- [ ] PM2 installed and configured
- [ ] Nginx installed and configured
- [ ] Code deployed to `/var/www/portfolio`
- [ ] .env file created with credentials
- [ ] Dependencies installed
- [ ] Frontend built
- [ ] Backend running with PM2
- [ ] Nginx reverse proxy configured
- [ ] Firewall configured
- [ ] SSL certificate installed (optional)
- [ ] Website accessible
- [ ] Admin panel working
- [ ] Data persisting in database

---

## 🎉 You're Done!

Your portfolio is now:
- ✅ Hosted on your VPS (no sleep!)
- ✅ Fast and always available
- ✅ Data stored permanently (Neon + Cloudinary)
- ✅ Secured with HTTPS
- ✅ Auto-restart on crash
- ✅ Easy to update

**Access Your Portfolio:**
- Website: `http://your-domain.com` or `http://your-vps-ip`
- Admin: `http://your-domain.com/x9k2m8p7q4n6`
- Password: `KJr5iCm9iwsMsl50ojXSHpTe`

**Cost:** $0 for database/storage + your VPS cost = Total control! 🚀