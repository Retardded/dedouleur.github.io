import "dotenv/config";
import pg from "pg";
import { v2 as cloudinary } from "cloudinary";
import { resolve4 } from "node:dns/promises";
import { URL } from "node:url";

const { Pool } = pg;

const CLOUDINARY_FOLDER = process.env.CLOUDINARY_FOLDER || "portfolio";
const DATABASE_URL = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

requireEnv("CLOUDINARY_CLOUD_NAME");
requireEnv("CLOUDINARY_API_KEY");
requireEnv("CLOUDINARY_API_SECRET");

if (!DATABASE_URL) {
  throw new Error("Missing required env var: DATABASE_URL or NETLIFY_DATABASE_URL");
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function normalizeType(resource) {
  const format = String(resource.format || "").toLowerCase();
  if (["mp4", "webm", "mov", "ogg"].includes(format)) return "video";
  return "image";
}

function createEmptyProject(asset, index) {
  const type = normalizeType(asset);
  return {
    id: index + 1,
    title: String(index + 1),
    description: "",
    year: "2026",
    category: type,
    image: type === "image" ? asset.secure_url : null,
    video: type === "video" ? asset.secure_url : null,
    type,
  };
}

async function listResources(resourceType) {
  const resources = [];
  let nextCursor = undefined;

  do {
    const response = await cloudinary.api.resources({
      type: "upload",
      resource_type: resourceType,
      prefix: `${CLOUDINARY_FOLDER}/`,
      max_results: 500,
      next_cursor: nextCursor,
    });

    resources.push(...(response.resources || []));
    nextCursor = response.next_cursor;
  } while (nextCursor);

  return resources;
}

async function main() {
  const dbUrl = new URL(DATABASE_URL);
  const ipv4Hosts = await resolve4(dbUrl.hostname);
  if (!ipv4Hosts.length) {
    throw new Error(`No IPv4 address found for database host: ${dbUrl.hostname}`);
  }

  const pool = new Pool({
    host: ipv4Hosts[0],
    port: Number(dbUrl.port || 5432),
    user: decodeURIComponent(dbUrl.username),
    password: decodeURIComponent(dbUrl.password),
    database: dbUrl.pathname.replace(/^\//, ""),
    family: 4,
    ssl: { rejectUnauthorized: false },
  });

  const [imageAssets, videoAssets] = await Promise.all([
    listResources("image"),
    listResources("video"),
  ]);

  const assets = [...imageAssets, ...videoAssets]
    .filter((asset) => String(asset.public_id || "").startsWith(`${CLOUDINARY_FOLDER}/`))
    .sort((a, b) => {
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();
      if (aTime !== bTime) return aTime - bTime;
      return String(a.public_id || "").localeCompare(String(b.public_id || ""));
    });

  const projects = assets.map((asset, index) => createEmptyProject(asset, index));
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        year VARCHAR(50),
        category VARCHAR(100),
        image TEXT,
        video TEXT,
        type VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
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
    console.log(`Imported ${projects.length} projects from Cloudinary folder "${CLOUDINARY_FOLDER}"`);
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
