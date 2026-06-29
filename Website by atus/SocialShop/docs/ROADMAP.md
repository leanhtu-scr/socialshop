# SocialShop — Lộ trình xây dựng theo từng gói ZIP

Dự án được chia nhỏ thành nhiều **Package**, mỗi package là 1 file ZIP.
Mỗi package sau sẽ **ghi đè / bổ sung** vào package trước — bạn chỉ cần
giải nén đè lên thư mục `SocialShop/` hiện có.

## ✅ Package 1 — Khung dự án + Giao diện tĩnh (đang giao)
- Cấu trúc thư mục chuẩn (`client/`, `server/`, `database/`, `docs/`)
- Trang **Feed** (`client/index.html`): top bar, search, story bar,
  skeleton loading, bài viết (like / comment / share / save), sản phẩm
  chèn trong feed (kiểu TikTok Shop).
- Trang **Marketplace** (`client/pages/marketplace.html`): danh mục,
  lưới sản phẩm, giỏ hàng (lưu tạm ở localStorage), toast khi thêm
  giỏ hàng.
- Hệ thống thiết kế (`client/css/style.css`): dark/light mode, glass
  card, gradient tím→cam làm điểm nhấn, bo góc, animation.
- `client/js/app.js`: toggle theme, toast, skeleton→content, like
  animation, giỏ hàng tạm thời.
- Backend **scaffold** (`server/app.js` + `package.json`): chạy được
  ngay (`node app.js`) nhưng chưa có logic — chỉ trả JSON xác nhận
  server sống.
- Đây là **giao diện demo tĩnh**, dữ liệu là mẫu cứng (hard-coded),
  chưa kết nối database.

## 🔜 Package 2 — Backend thật: Auth + Database
- Kết nối MongoDB (Mongoose), models: `User`, `Post`, `Product`.
- API đăng ký / đăng nhập với JWT, mã hoá mật khẩu (bcrypt).
- Middleware xác thực, xử lý lỗi.
- Kết nối form đăng ký/đăng nhập phía client vào API thật.

## 🔜 Package 3 — Feed thật + Tương tác
- API tạo bài viết, lấy feed theo thời gian thực.
- Like / Comment / Share lưu vào DB.
- Trang **Hồ sơ cá nhân** (Profile).
- Story (lưu trong DB, tự hết hạn sau 24h).

## 🔜 Package 4 — Marketplace thật
- API đăng sản phẩm, danh mục, giỏ hàng, đơn hàng.
- Trang quản lý đơn hàng cho người mua/người bán.
- Tích hợp thanh toán (giả lập trước, cổng thanh toán thật sau).
- Đánh giá sản phẩm.

## 🔜 Package 5 — Chat thời gian thực
- Socket.io: chat 1-1, trạng thái online, tin nhắn đã xem.
- Thông báo realtime (like, comment, follow, tin nhắn mới).

## 🔜 Package 6 — Livestream + Trang quản trị (Admin)
- Dashboard: thống kê người dùng, bài viết, sản phẩm, doanh thu.
- Quản lý User / Bài viết / Sản phẩm (duyệt, khoá, xoá).
- Livestream cơ bản (WebRTC hoặc nhúng dịch vụ stream).

## 🔜 Package 7 — Hoàn thiện & Triển khai (Deploy)
- Tối ưu hiệu năng, responsive toàn diện, kiểm thử.
- Hướng dẫn deploy: front-end (Vercel/Netlify), back-end (Render/
  Railway), MongoDB Atlas.
- Biến `client/` sang React (tuỳ chọn, nếu cần mở rộng).

---
**Quy tắc:** mỗi package giữ nguyên cấu trúc thư mục, chỉ thêm/sửa
file cần thiết — không phá vỡ phần đã chạy được ở package trước.
