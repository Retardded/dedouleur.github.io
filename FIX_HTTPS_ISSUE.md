# 🔒 Fix HTTPS/HTTP Mixed Content Issue

## Problem
Your Netlify frontend (HTTPS) cannot call your VPS backend (HTTP) due to browser security. This blocks:
- Fetching projects from database
- Saving projects after upload
- Any API calls from Netlify

## ✅ Solution: Use Cloudflare (Free SSL Proxy) - 5 Minutes

### Step 1: Sign up for Cloudflare (Free)
1. Go to https://cloudflare.com
2. Sign up (free account)
3. Add your domain (or use a subdomain like `api.yourdomain.com`)

### Step 2: Point Domain to VPS
1. In Cloudflare dashboard → DNS
2. Add A record:
   - **Type**: A
   - **Name**: `api` (or `@` for root)
   - **Content**: `138.124.70.82`
   - **Proxy**: ✅ Enabled (orange cloud)
   - **TTL**: Auto

### Step 3: Update Frontend API URL
Edit `src/lib/api.ts`:

```typescript
// Change from:
const API_BASE_URL = "http://138.124.70.82:3005";

// To:
const API_BASE_URL = "https://api.yourdomain.com";
// Or if using root domain:
// const API_BASE_URL = "https://yourdomain.com";
```

### Step 4: Update Backend CORS
Edit `server/index.js`:

```javascript
const corsOptions = {
  origin: [
    "https://dedouleur.netlify.app",
    "https://api.yourdomain.com",  // Add your domain
    "http://138.124.70.82:3005",   // Keep for direct VPS access
    "http://localhost:5173",
    "http://localhost:3000",
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};
```

### Step 5: Configure Cloudflare SSL
1. Cloudflare Dashboard → SSL/TLS
2. Set encryption mode to **"Full"** (not "Flexible")
3. This enables HTTPS → HTTP proxy

### Step 6: Rebuild & Deploy
```bash
npm run build
# Deploy dist/ to Netlify
```

---

## 🚀 Alternative: Let's Encrypt on VPS (More Complex)

If you want HTTPS directly on VPS:

```bash
# On VPS
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

Then update API_BASE_URL to `https://api.yourdomain.com`

---

## 🧪 Test After Fix

1. Open: https://dedouleur.netlify.app
2. Check browser console - should see:
   ```
   Fetching projects from: "https://api.yourdomain.com/api/projects"
   ```
3. Upload images from admin panel
4. Projects should save and appear on main site!

---

## 📝 Quick Checklist

- [ ] Cloudflare account created
- [ ] DNS A record pointing to VPS IP (proxy enabled)
- [ ] SSL mode set to "Full"
- [ ] Updated `src/lib/api.ts` with HTTPS URL
- [ ] Updated CORS in `server/index.js`
- [ ] Rebuilt frontend: `npm run build`
- [ ] Redeployed to Netlify
- [ ] Tested: Projects load and save work!

---

**Note**: Cloudflare proxy works immediately. SSL certificate is automatic and free!
