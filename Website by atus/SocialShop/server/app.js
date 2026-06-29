/**
 * SocialShop API — entrypoint (stub)
 * ------------------------------------------------------------
 * Đây là phần khung (scaffold) cho backend. Logic thật (auth, feed,
 * marketplace, chat realtime...) sẽ được xây trong PACKAGE 2 trở đi.
 *
 * Cấu trúc đã chuẩn bị:
 *   server/api/         -> controllers (xử lý logic từng chức năng)
 *   server/routes/       -> định nghĩa endpoint REST
 *   server/models/        -> schema MongoDB (User, Post, Product, Order...)
 *   server/middleware/      -> auth (JWT), upload (multer), error handler
 *   server/uploads/          -> file ảnh/video người dùng tải lên
 *
 * Chạy thử (sau khi `npm install`):
 *   node app.js
 */

const express = require('express');
const app = express();

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    name: 'SocialShop API',
    status: 'ok',
    version: '0.1.0 (scaffold)',
    note: 'Auth, Feed, Marketplace, Chat sẽ được thêm ở các package tiếp theo.'
  });
});

// ---- Routes sẽ được mount ở đây khi có (Package 2+) ----
// app.use('/api/auth', require('./routes/auth.routes'));
// app.use('/api/posts', require('./routes/post.routes'));
// app.use('/api/products', require('./routes/product.routes'));
// app.use('/api/orders', require('./routes/order.routes'));
// app.use('/api/chat', require('./routes/chat.routes'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`SocialShop API scaffold running on http://localhost:${PORT}`);
});
