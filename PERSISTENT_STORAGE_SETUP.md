# 🗄️ Persistent Storage Setup for Render.com

## 🚨 The Problem

When you redeploy to Render.com, **all files are wiped** and rebuilt from your GitHub repo. This means:

❌ Uploaded images are deleted
❌ Project data (projects.json) is lost
❌ You have to re-upload everything after each deployment

## ✅ The Solution: Persistent Disk

Render.com offers **persistent disks** that survive deployments and store your data permanently.

---

## 📁 What Gets Saved

With persistent storage configured, these directories survive redeployments:

```
server/data/
  ├── projects.json       ← Your project data
  └── images/             ← All uploaded media files
```

---

## 🔧 Setup Instructions

### Method 1: Using render.yaml (Recommended)

I've created a `render.yaml` file in your project root. This automatically configures everything.

**Steps:**

1. **Commit the render.yaml file:**
   ```bash
   git add render.yaml
   git commit -m "Add persistent storage configuration"
   git push
   ```

2. **Render will detect the config** and ask you to apply it on next deploy

3. **Approve the disk creation** in Render dashboard

4. **Done!** Your data will now persist across deployments

### Method 2: Manual Setup in Render Dashboard

If you prefer to configure manually:

1. Go to https://dashboard.render.com
2. Select your service "dedouleur"
3. Go to **"Disks"** tab
4. Click **"Add Disk"**
5. Configure:
   - **Name**: `project-data`
   - **Mount Path**: `/opt/render/project/src/server/data`
   - **Size**: 1 GB (free tier allows up to 1GB)
6. Click **"Save"**
7. Redeploy your service

---

## 🔍 Verify It's Working

After setting up persistent storage:

1. **Upload some projects** in admin panel
2. **Push a new commit** to trigger redeploy
3. **Check if data persists** after deployment completes
4. ✅ Your projects should still be there!

---

## 📊 Storage Details

### Free Tier Limits
- **Size**: 1 GB included free
- **Backups**: Manual only (export your data regularly)
- **Speed**: SSD storage

### What 1GB Holds
- ~200-500 high-quality images (depending on compression)
- ~20-50 videos (depending on length/quality)
- Thousands of project entries

---

## 🔄 How It Works

```
┌─────────────────────────────────────────┐
│  GitHub Repo (Code)                     │
│  ├── src/                               │
│  ├── server/                            │
│  └── ...                                │
└────────────┬────────────────────────────┘
             │ Push/Deploy
             ▼
┌─────────────────────────────────────────┐
│  Render.com Server                      │
│  ├── Fresh code from GitHub             │
│  ├── server/data/ ← MOUNTED DISK        │ ← Persists!
│  │   ├── projects.json                  │
│  │   └── images/                        │
└─────────────────────────────────────────┘
```

When you deploy:
- ✅ Code is rebuilt from GitHub
- ✅ `server/data/` stays intact (mounted from persistent disk)
- ✅ Your uploads and data survive

---

## 🛡️ Backup Your Data

Even with persistent storage, **always backup your data**!

### Quick Backup Method

1. **Download via API:**
   ```bash
   curl https://dedouleur.onrender.com/api/projects > projects-backup.json
   ```

2. **Download images manually:**
   - Go to admin panel
   - Right-click → Save each important image

3. **Schedule regular backups** (recommended monthly)

### Automatic Backup (Advanced)

Add this to your server code to create daily backups:

```javascript
// In server/index.js
import cron from 'node-cron';

// Daily backup at 2 AM
cron.schedule('0 2 * * *', () => {
  const backup = {
    projects: getProjects(),
    timestamp: new Date().toISOString()
  };
  fs.writeFileSync(
    path.join(dataDir, `backup-${Date.now()}.json`),
    JSON.stringify(backup, null, 2)
  );
});
```

---

## ⚠️ Important Notes

### DO:
- ✅ Set up persistent storage BEFORE uploading production data
- ✅ Test with a few items first
- ✅ Keep local backups of important data
- ✅ Monitor disk usage in Render dashboard

### DON'T:
- ❌ Store secrets in projects.json (use environment variables)
- ❌ Upload extremely large files (keep videos under 100MB when possible)
- ❌ Rely solely on cloud storage without backups
- ❌ Delete the disk in Render dashboard (data will be lost!)

---

## 🔧 Troubleshooting

### Data Still Disappearing?

1. **Check disk is mounted:**
   - Go to Render dashboard → Your service → Disks
   - Verify mount path: `/opt/render/project/src/server/data`

2. **Check file permissions:**
   - Render should auto-configure, but verify in logs

3. **Verify data location:**
   - Ensure server code writes to correct path
   - Check `server/index.js` lines 15-23

### Disk Full?

1. **Check usage** in Render dashboard
2. **Clean old uploads** via admin panel
3. **Compress videos** before uploading
4. **Upgrade disk size** (paid plans only)

### Migration Issues?

If you already have data in the old (non-persistent) location:

1. **Before adding disk:** Download all data
2. **Add persistent disk** and redeploy
3. **Re-upload your data** through admin panel
4. **Verify persistence** by redeploying again

---

## 💰 Cost

**Free Tier:**
- 1 GB persistent disk: **FREE** ✅
- Additional storage: $0.25/GB/month (paid plans)

**Paid Plans:**
- Can add multiple disks
- Larger disk sizes available
- Automatic backups available

---

## 📝 Summary

**Before Persistent Storage:**
```
Deploy → Data wiped → Re-upload everything 😢
```

**After Persistent Storage:**
```
Deploy → Data persists → Everything stays! 🎉
```

---

## 🚀 Next Steps

1. **Commit render.yaml** to your repo
2. **Push to GitHub** to trigger deployment
3. **Approve disk creation** in Render dashboard
4. **Upload your projects** once
5. **Never worry about losing data again!** ✅

---

**Last Updated**: Persistent storage configuration added
**Status**: ✅ Ready to deploy
**Storage Type**: Render Persistent Disk (1GB Free)
**Data Safety**: High (with regular backups)

---

## 📞 Support

If you encounter issues:
1. Check Render dashboard logs
2. Verify disk mount path
3. Review server logs for data directory errors
4. Contact Render support for disk-specific issues

**Your data is now safe! 🎉**