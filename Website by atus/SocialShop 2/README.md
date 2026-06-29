# SocialShop

Nền tảng kết hợp **mạng xã hội + marketplace** (Facebook + Marketplace +
TikTok Shop + Instagram), xây dựng từng bước theo các gói ZIP.

## Trạng thái: Package 2 / 7 — Auth thật (MongoDB + JWT)

Xem chi tiết lộ trình đầy đủ tại [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Bước 1 — Chạy backend (bắt buộc để đăng ký/đăng nhập hoạt động)

1. Tạo cluster MongoDB miễn phí tại https://www.mongodb.com/atlas (nếu chưa có).
2. Vào thư mục `server/`:
   ```
   cd server
   npm install
   cp .env.example .env
   ```
3. Mở file `.env`, dán connection string MongoDB vào `MONGO_URI`, đổi
   `JWT_SECRET` thành một chuỗi bí mật bất kỳ.
4. Chạy server:
   ```
   npm run dev
   ```
   (hoặc `node app.js` nếu không có nodemon)
5. Mở `http://localhost:5000` — thấy JSON `"status": "ok"` là server đã sống.

> Không có máy tính / không cài Node được trên điện thoại? Bạn vẫn xem
> được giao diện tĩnh (Package 1), nhưng đăng ký/đăng nhập cần server
> chạy thật — có thể deploy server lên Render/Railway miễn phí ở Package 7.

## Bước 2 — Mở giao diện

1. Mở `client/index.html` bằng trình duyệt.
2. Bấm icon 👤 ở top bar → vào trang Đăng ký → tạo tài khoản thật.
3. Sau khi đăng ký thành công, bạn được tự động đăng nhập và quay về Feed.
   Icon 👤 sẽ đổi thành 🟢 — bấm vào để đăng xuất.
4. Thử các tương tác khác: like ❤️, thêm vào giỏ 🛒, đổi dark/light 🌙.

> Nếu thấy toast lỗi mạng khi đăng ký/đăng nhập → server ở Bước 1 chưa
> chạy, hoặc `API_BASE_URL` trong `client/js/config.js` chưa đúng.

## Cấu trúc thư mục

```
SocialShop/
├── client/
│   ├── assets/
│   ├── css/style.css
│   ├── js/
│   │   ├── config.js     (API_BASE_URL)
│   │   ├── app.js         (toast, theme, skeleton, like, cart)
│   │   └── auth.js          (gọi API đăng ký/đăng nhập, lưu session)
│   ├── components/
│   ├── pages/
│   │   ├── login.html
│   │   ├── register.html
│   │   └── marketplace.html
│   └── index.html
├── server/
│   ├── api/auth.controller.js
│   ├── routes/auth.routes.js
│   ├── models/User.js
│   ├── middleware/
│   │   ├── auth.middleware.js   (requireAuth, requireAdmin)
│   │   └── error.middleware.js
│   ├── config/db.js
│   ├── uploads/
│   ├── app.js
│   ├── package.json
│   └── .env.example
├── database/
│   └── README.md
├── docs/
│   └── ROADMAP.md
└── README.md
```

## API hiện có (Package 2)

| Method | Endpoint           | Mô tả                          | Cần token? |
|--------|---------------------|--------------------------------|------------|
| POST   | `/api/auth/register`| Tạo tài khoản mới              | Không      |
| POST   | `/api/auth/login`   | Đăng nhập, nhận về JWT         | Không      |
| GET    | `/api/auth/me`      | Lấy thông tin user đang đăng nhập | **Có**  |

Gửi token qua header: `Authorization: Bearer <token>`

## Công nghệ

- **Front-end:** HTML / CSS / JavaScript thuần (có thể chuyển sang React sau)
- **Back-end:** Node.js + Express + Mongoose
- **Database:** MongoDB (Atlas)
- **Auth:** JWT + bcrypt
- **Realtime:** Socket.io (Package 5)

## Thiết kế

Dark mode mặc định, glassmorphism nhẹ, gradient tím (`#7C5CFC`) → cam
(`#FF6B6B`) làm điểm nhấn xuyên suốt. Font: Sora (display) + Inter
(nội dung) + JetBrains Mono (giá tiền/số liệu).
