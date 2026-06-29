# SocialShop — Package 6 (v0.6.0)

## Tính năng mới trong Package 6

### ✅ Upload ảnh thật
- Upload avatar, ảnh bìa, ảnh bài đăng, ảnh story
- **Local mode**: lưu vào `/server/uploads/` — dùng ngay, không cần config
- **Cloudinary mode**: bật bằng cách điền `CLOUDINARY_*` vào `.env`
- `POST /api/upload/avatar` — đổi avatar + cập nhật User
- `POST /api/upload/cover`  — đổi ảnh bìa
- `POST /api/upload/image`  — upload ảnh bất kỳ (post, story, product)

### ✅ Tạo Story (giao diện đầy đủ)
- Trang `/pages/create-story.html` — 3 loại: Văn bản / Ảnh / Video
- Story văn bản: chọn màu chữ + nền gradient
- Story ảnh/video: upload file thật, preview ngay
- Publish lên API, hiển thị 24h rồi tự xóa

### ✅ Thanh toán VNPay + MoMo
- `POST /api/payment/vnpay/create` → trả về `payUrl`, redirect sang VNPay
- `GET  /api/payment/vnpay/return` → VNPay redirect về sau khi thanh toán
- `POST /api/payment/vnpay/ipn`   → VNPay server-to-server notify
- `POST /api/payment/momo/create` → trả về `payUrl`, `qrCodeUrl`, `deeplink`
- `POST /api/payment/momo/ipn`    → MoMo server notify
- Trang `/pages/payment-result.html` — hiển thị kết quả thanh toán
- Model `Payment` lưu lịch sử mọi giao dịch

### ✅ PWA (Progressive Web App)
- `manifest.json` — cài như app thật trên điện thoại
- `sw.js` — Service Worker: cache offline, network-first cho API
- Banner "Cài ứng dụng" tự động hiện khi trình duyệt hỗ trợ
- Trang `/pages/offline.html` — fallback khi mất mạng

### 🔧 Fix lỗi P5
- Tất cả routes (`message`, `story`, `search`) đã dùng `requireAuth` đúng cách
- `app.js` updated — server không còn crash khi khởi động

---

## Cài đặt

```bash
cd server
npm install
cp .env.example .env
# Điền MONGO_URI và JWT_SECRET (bắt buộc)
# Điền CLOUDINARY_* nếu muốn upload cloud
# Điền VNPAY_* và MOMO_* nếu muốn thanh toán thật
npm run dev
```

## Sơ đồ phương thức thanh toán

```
User chọn VNPay/MoMo → POST /api/payment/{provider}/create
                      → Nhận payUrl → redirect sang cổng
                      → User thanh toán xong
                      → Cổng redirect về /pages/payment-result.html
                      → Đồng thời cổng POST /api/payment/{provider}/ipn
                      → Server verify chữ ký, cập nhật Order.paymentStatus = 'paid'
```

## Cấu trúc mới trong P6

```
server/
  api/
    upload.controller.js    ← NEW
    payment.controller.js   ← NEW
  routes/
    upload.routes.js        ← NEW
    payment.routes.js       ← NEW
  models/
    Payment.js              ← NEW
  utils/
    upload.js               ← NEW (Multer + Cloudinary)
    vnpay.js                ← NEW
    momo.js                 ← NEW

client/
  manifest.json             ← NEW (PWA)
  sw.js                     ← NEW (Service Worker)
  css/
    style-additions.css     ← NEW (PWA banner, upload overlay)
  js/
    upload.js               ← NEW (client upload helper)
    pwa.js                  ← NEW (SW registration + install banner)
  pages/
    create-story.html       ← NEW (tạo story đầy đủ)
    payment-result.html     ← NEW (kết quả thanh toán)
    offline.html            ← NEW (PWA offline fallback)
    profile.html            ← UPDATED (upload avatar + cover thật)
    cart.html               ← UPDATED (VNPay + MoMo checkout)
  assets/
    icons/README.md         ← Hướng dẫn tạo icon PWA
```

## Roadmap Package 7

- [ ] Livestream (WebRTC / Agora.io)
- [ ] Đăng bài với ảnh thật (multi-image post)
- [ ] Đăng sản phẩm với ảnh thật
- [ ] Edit profile (bio, links, username)
- [ ] Push Notifications (Web Push API)
- [ ] Trang quản trị nâng cao (charts thật bằng Chart.js)
