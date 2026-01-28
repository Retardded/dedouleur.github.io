import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import cors from "cors";
import rateLimit from "express-rate-limit";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3005;

// Создаём папки для данных и изображений
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
  max: 50, // limit each IP to 50 uploads per hour
  message: "Too many upload requests, please try again later.",
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth attempts per 15 minutes
  message: "Too many authentication attempts, please try again later.",
});

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
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
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
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

const projectsFile = path.join(dataDir, "projects.json");

// Вспомогательная функция для чтения проектов
function getProjects() {
  try {
    if (fs.existsSync(projectsFile)) {
      const data = fs.readFileSync(projectsFile, "utf8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading projects:", error);
  }
  return [];
}

// Вспомогательная функция для сохранения проектов
function saveProjects(projects) {
  try {
    fs.writeFileSync(projectsFile, JSON.stringify(projects, null, 2));
    return true;
  } catch (error) {
    console.error("Error saving projects:", error);
    return false;
  }
}

// API Routes

// GET /api/projects - получить все проекты
app.get("/api/projects", apiLimiter, (req, res) => {
  try {
    const projects = getProjects();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// POST /api/projects - сохранить проекты
app.post("/api/projects", authLimiter, (req, res) => {
  try {
    const projects = req.body;
    if (!Array.isArray(projects)) {
      return res.status(400).json({ error: "Projects must be an array" });
    }

    if (saveProjects(projects)) {
      res.json({ success: true, message: "Projects saved successfully" });
    } else {
      res.status(500).json({ error: "Failed to save projects" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to save projects" });
  }
});

// POST /api/upload - загрузить файл (изображение или видео)
app.post("/api/upload", uploadLimiter, upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileUrl = `/images/${req.file.filename}`;
    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.filename,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

// DELETE /api/images/:filename - удалить изображение
app.delete("/api/images/:filename", authLimiter, (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(imagesDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ success: true, message: "Image deleted" });
    } else {
      res.status(404).json({ error: "Image not found" });
    }
  } catch (error) {
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
