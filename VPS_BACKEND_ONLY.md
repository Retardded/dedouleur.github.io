# 🚀 VPS Backend Deployment (Netlify Frontend + VPS Backend)

## 🎯 Architecture

```
Netlify (Frontend)
https://dedouleur.netlify.app
        ↓ API calls
Your VPS (Backend Only)
http://your-vps-ip:3005 or https://api.yourdomain.com
        ↓
┌─────────────┬──────────────┐
│   Neon      │  Cloudinary  │
│ PostgreSQL  │     CDN      │
└─────────────┴──────────────┘
```

---

## 📋 What You Need

- Ubuntu VPS (20.04+)
- Root/sudo access
- Domain (optional, can use IP)
- SSH access

---

## 🚀 Part 1: Deploy Backend to VPS

### Step 1: Connect to VPS
```bash
ssh root@YOUR_VPS_IP
```

### Step 2: Update System & Install Node.js
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version  # Should be v18+
npm --version
```

### Step 3: Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### Step 4: Create Application Directory
```bash
mkdir -p ~/portfolio-backend
cd ~/portfolio-backend
```

### Step 5: Upload Your Backend Code

**Option A: Using Git**
```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .
```

**Option B: Using SCP (from your local machine)**
```bash
# On your local machine
cd chauzov_proj
scp -r server package.json package-lock.json root@YOUR_VPS_IP:~/portfolio-backend/
```

**Option C: Manual Upload**
- Use FileZilla or WinSCP
- Upload these folders/files:
  - `server/` folder
  - `package.json`
  - `package-lock.json`

### Step 6: Create Environment File
```bash
cd ~/portfolio-backend
nano .env
```

Paste this:
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

**Save:** `Ctrl+X`, then `Y`, then `Enter`

### Step 7: Install Dependencies
```bash
npm install --production
```

### Step 8: Start Backend with PM2
```bash
pm2 start server/index.js --name portfolio-api
pm2 save
pm2 startup
# Copy and run the command it outputs
```

### Step 9: Configure Firewall
```bash
# Allow SSH
sudo ufw allow 22

# Allow HTTP port 3005
sudo ufw allow 3005

# Enable firewall
sudo ufw enable
```

### Step 10: Test Backend
```bash
# Check if running
pm2 status

# Test API
curl http://localhost:3005/api/projects
curl http://localhost:3005/api/health
```

---

## 🌐 Part 2: Update Frontend to Use VPS Backend

### Step 1: Update API URL in Your Code

Open `src/lib/api.ts` and change:

**FROM:**
```typescript
const API_BASE_URL = "https://dedouleur.onrender.com";
```

**TO:**
```typescript
const API_BASE_URL = "http://YOUR_VPS_IP:3005";
// Or if you have a domain with SSL:
// const API_BASE_URL = "https://api.yourdomain.com";
```

### Step 2: Rebuild Frontend
```bash
npm run build
```

### Step 3: Deploy to Netlify

**Option A: Drag & Drop**
1. Go to https://app.netlify.com
2. Find your site "dedouleur"
3. Drag the `dist/` folder to deploy area

**Option B: Git Deploy**
```bash
git add .
git commit -m "Update API to use VPS backend"
git push
# Netlify auto-deploys
```

---

## 🔒 Part 3: Enable CORS (Important!)

Your backend needs to allow requests from Netlify.

On your VPS, edit `server/index.js`:

```bash
cd ~/portfolio-backend
nano server/index.js
```

Find the CORS section and update it:

```javascript
// Update CORS to allow Netlify
app.use(cors({
  origin: ['https://dedouleur.netlify.app', 'http://localhost:5173'],
  credentials: true
}));
```

Restart backend:
```bash
pm2 restart portfolio-api
```

---

## 🌐 Part 4: Setup Domain & SSL (Optional but Recommended)

### Option A: Use Cloudflare (Easiest, FREE SSL)

1. **Add Your Domain to Cloudflare**
   - Sign up at cloudflare.com
   - Add your domain
   - Update nameservers at your domain registrar

2. **Create DNS A Record**
   - Type: `A`
   - Name: `api` (or `@` for root domain)
   - Content: `YOUR_VPS_IP`
   - Proxy: Enable (Orange cloud)

3. **Update API URL in Frontend**
   ```typescript
   const API_BASE_URL = "https://api.yourdomain.com";
   ```

4. **Rebuild and Redeploy Frontend**

### Option B: Use Nginx + Let's Encrypt (Direct on VPS)

1. **Install Nginx**
```bash
sudo apt install -y nginx
```

2. **Create Nginx Config**
```bash
sudo nano /etc/nginx/sites-available/api
```

Paste:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    # Allow uploads (otherwise Nginx can return 413 Request Entity Too Large)
    # Adjust as needed (e.g. 50m, 200m)
    client_max_body_size 200m;

    location / {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

3. **Enable Site**
```bash
sudo ln -s /etc/nginx/sites-available/api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

4. **Install SSL**
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

5. **Update Firewall**
```bash
sudo ufw allow 80
sudo ufw allow 443
```

---

## 🔄 Updating Your Backend

### Quick Update Script

Create `update.sh` on VPS:
```bash
cd ~/portfolio-backend
nano update.sh
```

Paste:
```bash
#!/bin/bash
cd ~/portfolio-backend
echo "📥 Pulling changes..."
git pull origin main
echo "📦 Installing dependencies..."
npm install --production
echo "🔄 Restarting backend..."
pm2 restart portfolio-api
echo "✅ Update complete!"
pm2 status
```

Make executable:
```bash
chmod +x update.sh
```

Use it:
```bash
./update.sh
```

---

## 🛠️ Useful Commands

### PM2 Commands
```bash
# View logs
pm2 logs portfolio-api

# Restart
pm2 restart portfolio-api

# Stop
pm2 stop portfolio-api

# Status
pm2 status

# Monitor
pm2 monit
```

### Check Backend Status
```bash
# Test health
curl http://localhost:3005/api/health

# Test projects
curl http://localhost:3005/api/projects

# Check if port is in use
sudo lsof -i :3005

# Check process
ps aux | grep node
```

---

## 🆘 Troubleshooting

### CORS Errors on Frontend
**Problem:** "CORS policy blocked"
**Solution:** 
```bash
cd ~/portfolio-backend
nano server/index.js
# Update CORS to include Netlify URL
# Restart: pm2 restart portfolio-api
```

### Backend Not Starting
```bash
# Check logs
pm2 logs portfolio-api

# Check port 3005
sudo lsof -i :3005

# Kill if needed
sudo kill -9 $(sudo lsof -t -i:3005)

# Restart
pm2 restart portfolio-api
```

### Can't Connect from Frontend
1. Check VPS firewall: `sudo ufw status`
2. Check if port 3005 is open
3. Test from outside: `curl http://YOUR_VPS_IP:3005/api/health`
4. Check CORS configuration

### Database Connection Issues
```bash
# Test database
curl http://localhost:3005/api/projects

# Check logs for database errors
pm2 logs portfolio-api --lines 50
```

---

## 📊 Current Setup Summary

### Frontend (Netlify)
- **URL:** https://dedouleur.netlify.app
- **Files:** Static HTML/CSS/JS from `dist/`
- **Deployment:** Drag & drop or Git
- **Cost:** FREE

### Backend (Your VPS)
- **URL:** http://YOUR_VPS_IP:3005
- **Files:** `server/` folder + dependencies
- **Process Manager:** PM2
- **Cost:** Your VPS cost

### Database (Neon PostgreSQL)
- **URL:** ep-plain-wind-aesquc2e.c-2.us-east-2.aws.neon.tech
- **Storage:** Project metadata
- **Cost:** FREE (included with Netlify)

### Storage (Cloudinary)
- **Cloud:** dodqmzv8c
- **Storage:** 25GB images/videos
- **Cost:** FREE

---

## ✅ Deployment Checklist

### Backend (VPS)
- [ ] Node.js v18+ installed
- [ ] PM2 installed
- [ ] Backend code uploaded
- [ ] `.env` file created with credentials
- [ ] Dependencies installed
- [ ] Backend running with PM2
- [ ] Port 3005 open in firewall
- [ ] Can access: `curl http://localhost:3005/api/health`

### Frontend (Netlify)
- [ ] API URL updated to VPS IP/domain
- [ ] Frontend rebuilt: `npm run build`
- [ ] Deployed to Netlify
- [ ] Can access: https://dedouleur.netlify.app
- [ ] Admin panel works: /x9k2m8p7q4n6

### Integration
- [ ] Frontend can fetch projects from VPS
- [ ] Admin can upload images (to Cloudinary)
- [ ] Admin can save projects (to Neon)
- [ ] Data persists after backend restart
- [ ] CORS configured correctly

---

## 🎯 Quick Start Commands

### On Your VPS:
```bash
# SSH into VPS
ssh root@YOUR_VPS_IP

# Navigate to backend
cd ~/portfolio-backend

# Check status
pm2 status

# View logs
pm2 logs portfolio-api

# Restart if needed
pm2 restart portfolio-api
```

### On Your Local Machine:
```bash
# Update API URL
# Edit src/lib/api.ts
# Change API_BASE_URL to your VPS IP

# Rebuild frontend
npm run build

# Deploy to Netlify
# Drag dist/ folder to Netlify dashboard
```

---

## 🎉 You're All Set!

**Your Portfolio Architecture:**
- ✅ Frontend on Netlify (always on, fast CDN)
- ✅ Backend on Your VPS (no sleep, full control!)
- ✅ Data in Neon PostgreSQL (permanent)
- ✅ Files on Cloudinary (permanent, CDN)

**Access:**
- **Website:** https://dedouleur.netlify.app
- **Admin:** https://dedouleur.netlify.app/x9k2m8p7q4n6
- **Password:** KJr5iCm9iwsMsl50ojXSHpTe
- **Backend API:** http://YOUR_VPS_IP:3005

**Total Cost:** VPS cost only (everything else is FREE!)

🚀 **No more sleep, no more data loss, full control!**