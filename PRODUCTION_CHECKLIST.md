# 🚀 Production Deployment Checklist

## Pre-Deployment Security Audit

### ✅ Completed Security Measures

- [x] **Admin panel URL changed** from `/secure-admin-panel` to `/x9k2m8p7q4n6`
- [x] **Password set** to `KJr5iCm9iwsMsl50ojXSHpTe`
- [x] **PIN hints removed** from login screen
- [x] **Password input type** changed to hidden
- [x] **Rate limiting implemented**:
  - API endpoints: 100 requests/15min
  - Upload endpoints: 50 uploads/hour
  - Auth endpoints: 5 attempts/15min
- [x] **Security headers added**:
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: enabled
  - Referrer-Policy: strict-origin-when-cross-origin
- [x] **Sensitive files added to .gitignore**:
  - DEPLOYMENT.md
  - CREDENTIALS.txt
  - .env files

---

## 📋 Deployment Steps

### 1. Final Build
```bash
npm install
npm run build
```
- [ ] Build completed without errors
- [ ] `dist/` folder created successfully

### 2. Test Locally
```bash
npm start
```
- [ ] Server starts on port 3005
- [ ] Main website loads at `http://localhost:3005`
- [ ] Admin panel accessible at `http://localhost:3005/x9k2m8p7q4n6`
- [ ] Password `KJr5iCm9iwsMsl50ojXSHpTe` works
- [ ] Can upload images
- [ ] Can save projects
- [ ] Changes persist after page reload

### 3. Prepare Deployment Package

**Option A: Manual Preparation**
- [ ] Copy `dist/` folder
- [ ] Copy `server/` folder
- [ ] Copy `package.json`
- [ ] Copy `package-lock.json`

**Option B: Automated (Recommended)**
```bash
./prepare-deploy.sh
```
- [ ] Script completes successfully
- [ ] `.tar.gz` archive created

### 4. Server Setup
- [ ] Upload files to server
- [ ] Install Node.js (v14 or higher) on server
- [ ] Run `npm install --production` on server
- [ ] Set up environment variables (if needed)
- [ ] Configure firewall (allow port 3005 or your chosen port)

### 5. Start Production Server

**Option A: Direct Start**
```bash
npm start
```

**Option B: PM2 (Recommended)**
```bash
npm install -g pm2
pm2 start server/index.js --name "portfolio"
pm2 save
pm2 startup
```
- [ ] Server running
- [ ] PM2 auto-restart configured (if using PM2)

### 6. Domain & SSL Setup
- [ ] Domain DNS configured
- [ ] SSL certificate installed (Let's Encrypt recommended)
- [ ] HTTPS working
- [ ] HTTP redirects to HTTPS
- [ ] Reverse proxy configured (nginx/apache)

### 7. Post-Deployment Verification
- [ ] Website loads at production URL
- [ ] All pages work correctly
- [ ] Images load properly
- [ ] Contact form works
- [ ] Admin panel accessible at `/x9k2m8p7q4n6`
- [ ] Can login with password
- [ ] Can upload images in admin
- [ ] Can edit projects
- [ ] Changes save correctly

### 8. Security Verification
- [ ] Admin URL not guessable
- [ ] Password required for admin access
- [ ] Rate limiting working (test multiple failed logins)
- [ ] No sensitive info in browser console
- [ ] HTTPS enforced
- [ ] Security headers present (check browser DevTools)

### 9. Performance Check
- [ ] Page load time acceptable
- [ ] Images optimized
- [ ] Lighthouse score acceptable
- [ ] Mobile responsive

### 10. Backup Setup
- [ ] `server/data/` backup configured
- [ ] `server/data/images/` backup configured
- [ ] Database backup schedule (if applicable)
- [ ] Backup restoration tested

---

## 🔒 Security Best Practices

### Immediate Actions
1. **Save credentials securely** - Store `CREDENTIALS.txt` in password manager
2. **Delete sensitive files** from server after noting credentials:
   - `DEPLOYMENT.md`
   - `CREDENTIALS.txt`
3. **Change default password** if you haven't already
4. **Don't commit credentials** to git repository

### Ongoing Security
1. **Regular updates**: Update npm packages monthly
2. **Monitor logs**: Check server logs weekly
3. **Backup data**: Daily backups of `server/data/`
4. **SSL renewal**: Monitor certificate expiration
5. **Security patches**: Apply Node.js security updates

---

## 📝 Important URLs & Credentials

**Website URL**: `https://yourdomain.com`
**Admin Panel**: `https://yourdomain.com/x9k2m8p7q4n6`
**Password**: `KJr5iCm9iwsMsl50ojXSHpTe`

⚠️ **Store this information securely and delete this file after deployment!**

---

## 🆘 Troubleshooting

### Server Won't Start
- Check port availability: `lsof -i :3005`
- Check Node.js version: `node --version` (needs 14+)
- Check logs: `pm2 logs portfolio` (if using PM2)
- Verify dependencies installed: `npm list --depth=0`

### Images Not Loading
- Check directory exists: `ls -la server/data/images/`
- Check permissions: `chmod 755 server/data/images/`
- Check disk space: `df -h`

### Admin Panel Issues
- Clear browser cache and localStorage
- Check URL is exactly `/x9k2m8p7q4n6`
- Verify password is typed correctly (case-sensitive)
- Check rate limiting hasn't blocked you (wait 15 min)

### Database/Projects Not Saving
- Check file permissions: `ls -la server/data/`
- Check `projects.json` exists and is writable
- Check server logs for errors

---

## 📦 Files Included in Deployment

### Required Files
```
dist/                    # Built frontend
server/                  # Backend server
  ├── index.js          # Main server file
  └── data/             # Created automatically
package.json            # Dependencies
package-lock.json       # Locked versions
```

### NOT Needed (Development Only)
```
src/                    # Source code (already compiled)
node_modules/           # Install fresh on server
.eslintrc.cjs          # Linting config
tsconfig.json          # TypeScript config
vite.config.ts         # Build config
```

---

## 🎉 Deployment Complete!

Once all items are checked:
1. ✅ Delete sensitive documentation files
2. ✅ Save credentials in password manager
3. ✅ Monitor server for first 24 hours
4. ✅ Set up monitoring/alerting (optional)

**Your portfolio is now live and secure! 🚀**

---

**Last Updated**: Ready for Production
**Server Port**: 3005 (default)
**Node.js Version Required**: 14+