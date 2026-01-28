import "dotenv/config";
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { v2 as cloudinary } from "cloudinary";
import {
  initDatabase,
  createProjectsTable,
  getAllProjects,
  saveAllProjects,
} from "./database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3005;

// ---------------------------------------------------------------------------
// Admin auth (PIN) — server-side, env-based, hashed (no secrets in frontend)
// ---------------------------------------------------------------------------
const ADMIN_PIN_SALT = process.env.ADMIN_PIN_SALT;
const ADMIN_PIN_HASH = process.env.ADMIN_PIN_HASH; // base64(scrypt(pin, salt))

if (!ADMIN_PIN_SALT || !ADMIN_PIN_HASH) {
  console.warn(
    "⚠️  Admin PIN is NOT configured. Set ADMIN_PIN_SALT and ADMIN_PIN_HASH to enable admin-only endpoints.",
  );
}

function getAdminPinFromRequest(req) {
  const auth = req.headers.authorization;
  if (typeof auth === "string" && auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice("bearer ".length).trim();
  }

  const headerPin = req.headers["x-admin-pin"];
  if (typeof headerPin === "string") return headerPin.trim();
  return null;
}

function verifyAdminPin(pin) {
  if (!ADMIN_PIN_SALT || !ADMIN_PIN_HASH) return false;
  if (typeof pin !== "string" || pin.length === 0) return false;

  let expected;
  try {
    expected = Buffer.from(ADMIN_PIN_HASH, "base64");
  } catch {
    return false;
  }
  if (expected.length === 0) return false;

  const actual = crypto.scryptSync(pin, ADMIN_PIN_SALT, expected.length);
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}

function requireAdmin(req, res, next) {
  if (!ADMIN_PIN_SALT || !ADMIN_PIN_HASH) {
    return res.status(503).json({
      error:
        "Admin PIN is not configured on the server (missing ADMIN_PIN_SALT / ADMIN_PIN_HASH).",
    });
  }

  const pin = getAdminPinFromRequest(req);
  if (!pin) return res.status(401).json({ error: "Missing admin credentials" });

  if (!verifyAdminPin(pin)) {
    return res.status(401).json({ error: "Invalid admin credentials" });
  }

  return next();
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  console.warn(
    "⚠️  Cloudinary env vars missing. Uploads to /api/upload will fail until CLOUDINARY_* are set.",
  );
}

// Initialize database
initDatabase();
await createProjectsTable();

// Создаём папки для временных файлов (для multer)
const dataDir = path.join(__dirname, "data");
const imagesDir = path.join(__dirname, "data", "images");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 500, // limit each IP to 500 uploads per hour (supports bulk uploads)
  message: "Too many upload requests, please try again later.",
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth attempts per 15 minutes
  message: "Too many authentication attempts, please try again later.",
});

// Middleware - CORS configuration for Netlify frontend and VPS
const defaultCorsOrigins = [
  "https://dedouleur.netlify.app",
  "https://dedouleur.mooo.com",
  // Common GitHub Pages origins (add your exact repo origin here if different)
  "https://retardded.github.io",
  // Local dev
  "http://localhost:5173",
  "http://localhost:3000",
];

const envCorsOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const allowedOrigins = new Set([...defaultCorsOrigins, ...envCorsOrigins]);

const corsOptions = {
  // Explicitly reflect allowed origins (required for credentialed requests).
  // If you want to allow everything temporarily, set CORS_ORIGINS="*".
  origin(origin, cb) {
    // Non-browser clients (curl/postman) may omit Origin.
    if (!origin) return cb(null, true);
    if (envCorsOrigins.includes("*")) return cb(null, origin);
    if (allowedOrigins.has(origin)) return cb(null, origin);
    return cb(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  // Browser preflight commonly asks for Content-Type; be explicit.
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Extra safety: ensure Access-Control-Allow-Origin is always set for allowed origins.
// Some proxy setups can behave oddly; this guarantees the browser gets the header.
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin) return next();

  if (envCorsOrigins.includes("*") || allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  return next();
});

app.use(express.json({ limit: "200mb" }));
app.use(express.static(path.join(__dirname, "..", "dist")));
app.use("/images", express.static(imagesDir));

// Настройка multer для загрузки изображений
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imagesDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB (supports larger video files)
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|webm|ogg|mov/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = /image|video/.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed!"));
    }
  },
});
// Database functions now imported from database.js
// getProjects and saveProjects are now async and use PostgreSQL

// API Routes

// Admin: verify PIN (used by frontend to "log in")
app.get("/api/admin/verify", authLimiter, requireAdmin, (req, res) => {
  res.json({ ok: true });
});

// GET /api/projects - получить все проекты
app.get("/api/projects", apiLimiter, async (req, res) => {
  try {
    const projects = await getAllProjects();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// POST /api/projects - сохранить проекты
app.post("/api/projects", apiLimiter, requireAdmin, async (req, res) => {
  try {
    const projects = req.body;
    if (!Array.isArray(projects)) {
      return res.status(400).json({ error: "Projects must be an array" });
    }

    const success = await saveAllProjects(projects);
    if (success) {
      res.json({ success: true, message: "Projects saved successfully" });
    } else {
      res.status(500).json({ error: "Failed to save projects" });
    }
  } catch (error) {
    console.error("Save error:", error);
    res.status(500).json({ error: "Failed to save projects" });
  }
});

// POST /api/upload - загрузить файл (изображение или видео)
app.post(
  "/api/upload",
  uploadLimiter,
  requireAdmin,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Upload to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "portfolio",
        resource_type: "auto", // Automatically detects image or video
      });

      // Delete temporary file
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.warn("⚠️  Failed to delete temp upload file:", req.file.path, e);
      }

      // Return Cloudinary URL
      res.json({
        success: true,
        url: uploadResult.secure_url,
        filename: uploadResult.public_id,
      });
    } catch (error) {
      console.error("Upload error:", error);
      const message =
        error?.message ||
        error?.error?.message ||
        "Failed to upload file (unknown error)";
      res.status(500).json({ error: message });
    }
  },
);

// DELETE /api/images/:filename - удалить изображение
app.delete("/api/images/:filename", authLimiter, requireAdmin, async (req, res) => {
  try {
    const filename = req.params.filename;

    // Delete from Cloudinary (filename is the public_id)
    await cloudinary.uploader.destroy(filename);

    res.json({ success: true, message: "Image deleted" });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Failed to delete image" });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Fallback для SPA - отдаём index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📁 Data directory: ${dataDir}`);
  console.log(`🖼️  Images directory: ${imagesDir}`);
});
