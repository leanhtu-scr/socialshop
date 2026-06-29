/**
 * SocialShop — Upload Utility (Package 6)
 * -------------------------------------------------------
 * Hỗ trợ 2 chế độ:
 *   1. Local (mặc định): lưu file vào /uploads/ — dùng khi chưa có Cloudinary
 *   2. Cloudinary: upload lên cloud — bật bằng cách điền CLOUDINARY_* trong .env
 *
 * Dùng trong route:
 *   const { upload, handleUpload } = require('../utils/upload');
 *   router.post('/avatar', requireAuth, upload.single('image'), handleUpload, controller);
 *   // req.fileUrl sẽ chứa URL ảnh sau khi upload
 */

const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// ── Cấu hình Local storage ──────────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const localStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const ok = allowed.test(path.extname(file.originalname).toLowerCase()) &&
             allowed.test(file.mimetype);
  ok ? cb(null, true) : cb(new Error('Chỉ hỗ trợ file ảnh (jpg, png, gif, webp)'));
};

// Multer instance — dùng memoryStorage nếu có Cloudinary, diskStorage nếu local
const useCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

const upload = multer({
  storage: useCloudinary ? multer.memoryStorage() : localStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// ── Middleware xử lý sau khi multer nhận file ───────────────────────────────
async function handleUpload(req, res, next) {
  if (!req.file) return next(); // không có file → bỏ qua

  try {
    if (useCloudinary) {
      // Lazy-load cloudinary chỉ khi cần
      const cloudinary = require('cloudinary').v2;
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key:    process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });

      // Upload buffer lên Cloudinary
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'socialshop', resource_type: 'image' },
          (err, result) => err ? reject(err) : resolve(result)
        );
        stream.end(req.file.buffer);
      });

      req.fileUrl = result.secure_url;
    } else {
      // Local: build URL từ server hostname
      const host = `${req.protocol}://${req.get('host')}`;
      req.fileUrl = `${host}/uploads/${req.file.filename}`;
    }

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { upload, handleUpload };
