# SocialShop — Package 5 (v0.5.0)

## Những gì mới trong Package 5

### Client (frontend)
| File | Chức năng |
|------|-----------|
| `client/pages/chat.html` | **Trang Chat** — hội thoại + nhắn tin real-time Socket.io, online dots, tìm user mới |
| `client/pages/notifications.html` | **Thông báo** — tabs All/Social/Shop/System, nhóm ngày, mark all read |
| `client/pages/story-viewer.html` | **Story Viewer** — progress bar, text/image story, reactions, swipe điều hướng |
| `client/pages/search.html` | **Tìm kiếm** — trending, gợi ý user, kết quả phân tab |
| `client/css/style.css` | + skeleton, toast variants, nav-item--active, fadeSlideUp |

### Server (backend)
| File | Chức năng |
|------|-----------|
| `server/routes/message.routes.js` | REST API tin nhắn — conversations, history, send, mark read |
| `server/routes/story.routes.js` | CRUD Story với TTL 24h tự xóa |
| `server/routes/search.routes.js` | Tìm kiếm user/post/product |
| `server/models/Story.js` | Mongoose Story model (TTL index) |
| `server/app.js` | + 3 routes mới + typing indicator socket |

## Cách ghép vào dự án

```bash
unzip SocialShop_Package5.zip
cp -r SocialShop_P5/. SocialShop/
```

## Chạy server

```bash
cd SocialShop/server
npm install
cp .env.example .env
npm run dev
```

## Roadmap P6
- Upload ảnh thực (Cloudinary)
- Create Story UI
- Livestream (WebRTC)
- VNPay / MoMo payment
- PWA manifest + Service Worker
