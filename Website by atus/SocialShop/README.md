# SocialShop

Nền tảng kết hợp **mạng xã hội + marketplace** (Facebook + Marketplace +
TikTok Shop + Instagram), xây dựng từng bước theo các gói ZIP.

## Trạng thái: Package 1 / 7 — Khung dự án + Giao diện tĩnh

Xem chi tiết lộ trình đầy đủ tại [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Cách xem thử ngay (không cần cài gì)

1. Mở file `client/index.html` bằng trình duyệt điện thoại hoặc máy tính.
2. Bấm vào icon 🛒 ở bottom nav để qua trang `client/pages/marketplace.html`.
3. Thử: bấm ❤️ để like, bấm "Thêm vào giỏ" để xem toast + đếm giỏ hàng,
   bấm 🌙 để đổi dark/light mode.

> Toàn bộ dữ liệu hiện là **dữ liệu mẫu** viết cứng trong HTML. Chưa có
> kết nối server/database thật — phần đó sẽ có ở Package 2.

## Cách chạy server scaffold (tuỳ chọn, chỉ là khung)

```
cd server
npm install
node app.js
```

Mở `http://localhost:5000` sẽ thấy JSON xác nhận server đang chạy.
Server chưa có API thật — sẽ được xây ở Package 2.

## Cấu trúc thư mục

```
SocialShop/
├── client/
│   ├── assets/
│   ├── css/style.css
│   ├── js/app.js
│   ├── components/        (dành cho sau khi chuyển sang React)
│   ├── pages/marketplace.html
│   └── index.html
├── server/
│   ├── api/                (controllers — sẽ thêm ở Package 2)
│   ├── routes/              (endpoints — sẽ thêm ở Package 2)
│   ├── models/                (schema MongoDB — sẽ thêm ở Package 2)
│   ├── middleware/              (auth, upload — sẽ thêm ở Package 2)
│   ├── uploads/
│   ├── app.js
│   └── package.json
├── database/
│   └── README.md
├── docs/
│   └── ROADMAP.md
└── README.md
```

## Công nghệ

- **Front-end:** HTML / CSS / JavaScript thuần (có thể chuyển sang React sau)
- **Back-end:** Node.js + Express
- **Database:** MongoDB
- **Auth:** JWT
- **Realtime:** Socket.io (Package 5)

## Thiết kế

Dark mode mặc định, glassmorphism nhẹ, gradient tím (`#7C5CFC`) → cam
(`#FF6B6B`) làm điểm nhấn xuyên suốt (story ring, nút mua, badge sale).
Font: Sora (display) + Inter (nội dung) + JetBrains Mono (giá tiền/số liệu).
