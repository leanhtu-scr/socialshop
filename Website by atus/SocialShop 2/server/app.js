/**
 * SocialShop API — entrypoint
 * ------------------------------------------------------------
 * Package 2: đã kết nối MongoDB thật + Auth (đăng ký/đăng nhập bằng JWT).
 *
 * Cấu trúc:
 *   server/config/        -> kết nối database
 *   server/api/            -> controllers (xử lý logic)
 *   server/routes/          -> định nghĩa endpoint REST
 *   server/models/            -> schema MongoDB (User, Post, Product...)
 *   server/middleware/          -> auth (JWT), error handler, upload
 *   server/uploads/                -> file ảnh/video người dùng tải lên
 *
 * Chạy:
 *   cd server
 *   npm install
 *   cp .env.example .env   (rồi điền MONGO_URI + JWT_SECRET của bạn)
 *   npm run dev            (hoặc: node app.js)
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/error.middleware');

const app = express();

// ---- Middleware cơ bản ----
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// ---- Kết nối database ----
connectDB();

// ---- Health check ----
app.get('/', (req, res) => {
  res.json({
    name: 'SocialShop API',
    status: 'ok',
    version: '0.2.0',
    note: 'Auth (JWT) đã sẵn sàng. Feed/Marketplace/Chat sẽ thêm ở package tiếp theo.',
  });
});

// ---- Routes ----
app.use('/api/auth', require('./routes/auth.routes'));
// app.use('/api/posts', require('./routes/post.routes'));       // Package 3
// app.use('/api/products', require('./routes/product.routes')); // Package 4
// app.use('/api/orders', require('./routes/order.routes'));      // Package 4
// app.use('/api/chat', require('./routes/chat.routes'));         // Package 5

// ---- Lỗi ----
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 SocialShop API running on http://localhost:${PORT}`);
});
