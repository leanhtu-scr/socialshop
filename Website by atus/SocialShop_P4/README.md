# SocialShop — Package 4

Gói này bổ sung đầy đủ backend models còn thiếu, API mới, và các trang giao diện.

## Những gì đã thêm

### Backend Models mới
- Post.js — Bài viết với like, comment, share, visibility
- Product.js — Sản phẩm với reviews, avgRating, stock tracking
- Order.js — Đơn hàng đầy đủ (items, shipping, status)
- Message.js — Chat 1-1 (Message + Conversation)
- Notification.js — Thông báo tự động (like/comment/follow/order)

### API Routes mới
- /api/posts — CRUD + like/unlike + comment + share
- /api/users — profile, follow/unfollow, quản lý (admin)
- /api/products — CRUD + đánh giá sản phẩm
- /api/orders — Checkout, đơn của tôi, hủy đơn, admin cập nhật
- /api/notifications — Lấy thông báo, đánh dấu đọc
- /api/admin/stats — Dashboard thống kê

### Socket.io Real-time Chat
- Xác thực JWT qua handshake.auth.token
- Events: join_conversation, send_message, start_conversation
- Tracking online users

### Trang Frontend mới
- product-detail.html — Gallery, đánh giá sao, mua ngay
- cart.html — Giỏ hàng + form checkout + 4 hình thức TT
- order-detail.html — Tracking trạng thái đơn hàng
- admin.html — Dashboard: stats, user/post/product/order management

## Cách chạy

cd server
npm install
cp .env.example .env   # Điền MONGO_URI và JWT_SECRET
npm run dev

## Còn lại (Package 5+)

- Giao diện chat real-time (client Socket.io)
- Livestream
- Push notifications
- Tích hợp cổng thanh toán thật (MoMo, VNPay)
