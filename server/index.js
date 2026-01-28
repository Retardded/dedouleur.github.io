import "dotenv/config";
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
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
const corsOptions = {
  origin: [
    "https://dedouleur.netlify.app",
    "http://138.124.70.82:3005",
    "http://localhost:5173",
    "http://localhost:3000",
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
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
app.post("/api/projects", apiLimiter, async (req, res) => {
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
app.delete("/api/images/:filename", authLimiter, async (req, res) => {
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
