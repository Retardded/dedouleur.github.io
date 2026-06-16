# Cloudinary to Supabase Import Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the portfolio projects table in a new Supabase/Postgres database from Cloudinary assets stored in the `portfolio` folder, then connect the app to that database.

**Architecture:** A single Node import script will read Cloudinary assets from the `portfolio` folder, classify each asset by file type, generate minimal project rows with predictable defaults, and write them into a Postgres database via `pg`. The existing app will continue using `DATABASE_URL`; no front-end model changes are needed because the restored rows will match the current project schema.

**Tech Stack:** Node.js, Cloudinary Admin API, `pg`, existing project schema in `server/database.js`.

---

### Task 1: Add a Cloudinary import script

**Files:**
- Create: `scripts/import-cloudinary-portfolio.js`
- Modify: `package.json`

- [ ] **Step 1: Write the import script**

```js
import "dotenv/config";
import pg from "pg";
import { v2 as cloudinary } from "cloudinary";

const { Pool } = pg;

const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || "portfolio";
const DATABASE_URL = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  throw new Error("Missing Cloudinary env vars: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET");
}

if (!DATABASE_URL) {
  throw new Error("Missing DATABASE_URL or NETLIFY_DATABASE_URL");
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function normalizeKind(resource) {
  const format = String(resource.format || "").toLowerCase();
  if (format === "mp4" || format === "webm" || format === "mov" || format === "ogg") return "video";
  return "image";
}

function pickTitle(index) {
  return String(index + 1);
}

async function listAllResources(resource_type) {
  const items = [];
  let nextCursor = undefined;

  do {
    const response = await cloudinary.api.resources({
      type: "upload",
      resource_type,
      prefix: `${CLOUDINARY_FOLDER}/`,
      max_results: 500,
      next_cursor: nextCursor,
    });

    items.push(...(response.resources || []));
    nextCursor = response.next_cursor;
  } while (nextCursor);

  return items;
}

async function main() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const images = await listAllResources("image");
  const videos = await listAllResources("video");

  const projects = [...images, ...videos]
    .filter((asset) => asset.public_id.startsWith(`${CLOUDINARY_FOLDER}/`))
    .sort((a, b) => {
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();
      if (aTime !== bTime) return aTime - bTime;
      return String(a.public_id).localeCompare(String(b.public_id));
    })
    .map((asset, index) => {
      const type = normalizeKind(asset);
      return {
        id: index + 1,
        title: pickTitle(index),
        description: "",
        year: "2026",
        category: type,
        image: type === "image" ? asset.secure_url : null,
        video: type === "video" ? asset.secure_url : null,
        type,
      };
    });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM projects");

    for (const project of projects) {
      await client.query(
        `INSERT INTO projects (id, title, description, year, category, image, video, type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          project.id,
          project.title,
          project.description,
          project.year,
          project.category,
          project.image,
          project.video,
          project.type,
        ],
      );
    }

    if (projects.length > 0) {
      await client.query(`SELECT setval('projects_id_seq', $1)`, [projects.length]);
    }

    await client.query("COMMIT");
    console.log(`Imported ${projects.length} projects from ${CLOUDINARY_FOLDER}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

- [ ] **Step 2: Add a runnable npm script**

```json
{
  "scripts": {
    "import:cloudinary": "node scripts/import-cloudinary-portfolio.js"
  }
}
```

- [ ] **Step 3: Verify the script is wired correctly**

Run:
```bash
npm run import:cloudinary
```
Expected: The script exits early with a clear env error if Cloudinary or database variables are missing.

- [ ] **Step 4: Commit the import script**

```bash
git add scripts/import-cloudinary-portfolio.js package.json
git commit -m "feat: add cloudinary portfolio import script"
```

### Task 2: Document the restore workflow

**Files:**
- Create: `docs/superpowers/specs/2026-06-16-cloudinary-to-supabase-restore.md`

- [ ] **Step 1: Write the restore notes**

```md
# Cloudinary Portfolio Restore Notes

Use the `portfolio` folder in Cloudinary as the source of truth.

Environment variables required:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `DATABASE_URL`

Import behavior:
- `jpg` and other image formats become `type=image`
- `mp4`, `webm`, `mov`, and `ogg` become `type=video`
- `year` is always `2026`
- `title` is sequential numbers starting at `1`
- `description` is empty
- `category` matches the type

Run:
```bash
npm run import:cloudinary
```
```

- [ ] **Step 2: Commit the restore notes**

```bash
git add docs/superpowers/specs/2026-06-16-cloudinary-to-supabase-restore.md
git commit -m "docs: add cloudinary restore notes"
```

### Task 3: Point the app to the new Supabase database

**Files:**
- Modify: VPS `.env` file, not tracked in git
- Modify: deployment environment for the API service, if needed

- [ ] **Step 1: Replace `DATABASE_URL` with the new Supabase connection string**

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME
```

- [ ] **Step 2: Keep the rest of the API env the same**

```env
PORT=3005
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
ADMIN_PIN_SALT=...
ADMIN_PIN_HASH=...
CORS_ORIGINS=https://dedouleur.art,https://www.dedouleur.art,https://api.dedouleur.art
```

- [ ] **Step 3: Restart the API service**

Run:
```bash
pm2 restart portfolio_api --update-env
pm2 save
```

- [ ] **Step 4: Verify the data is back**

Run:
```bash
curl https://api.dedouleur.art/api/projects
```
Expected: JSON array with the imported projects instead of `[]`.

- [ ] **Step 5: Commit the deployment note if you keep one**

```bash
git add docs/superpowers/specs/2026-06-16-cloudinary-to-supabase-restore.md
git commit -m "docs: record supabase connection workflow"
```
