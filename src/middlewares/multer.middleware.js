import multer from "multer";
import path from "path";
import { ApiError } from "../utils/ApiError.js";

// Allowed image MIME types for secure file uploads
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/heic",
  "image/heif"
];

// Disk storage configuration (temporary server storage before Cloudinary upload)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    // Generate unique filename to prevent collisions
    // Pattern: timestamp-randomNumber-originalName
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext);
    cb(null, `${uniqueSuffix}-${baseName}${ext}`);
  },
});

// File type filter — only allow image uploads
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else if (!file.mimetype || file.mimetype === "application/octet-stream" || file.mimetype === "") {
    const ext = path.extname(file.originalname).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".heic", ".heif"].includes(ext)) {
      cb(null, true);
      return;
    }
    cb(new ApiError(400, `Invalid file extension: ${ext}`), false);
  } else {
    cb(
      new ApiError(
        400,
        `Invalid file type: ${file.mimetype}. Only JPEG, PNG, GIF, WebP, SVG, and HEIC images are allowed.`
      ),
      false
    );
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // Increased to 20MB for high-res mobile photos
  },
});