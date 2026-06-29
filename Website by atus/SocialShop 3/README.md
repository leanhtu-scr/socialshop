# SocialShop — Package 3

## Nội dung gói này

Gói 3 bổ sung trên nền Package 2:

### ✅ Mới hoàn toàn
- **Dải ứng dụng liên kết** (`social-bar.css` + component trong `index.html`)
  - Threads · Instagram · Facebook · TikTok · GitHub · FB Marketplace · TikTok Shop · YouTube
  - Glassmorphism icon, gradient border, hover animation, stagger entrance
  - Scroll ngang, dark/light mode đầy đủ
- **Trang hồ sơ** (`pages/profile.html`)
  - Cover ảnh, avatar, follow button
  - Social link chips (Threads, IG, FB, TikTok, GitHub)
  - Stats: bài viết, followers, following, sản phẩm
  - Tabs: Bài đăng / Cửa hàng / Đã lưu
  - Grid ảnh 3 cột
- **Card TikTok Shop** trong feed trang chủ

### ✅ Cập nhật
- `index.html`: thêm social bar, card TikTok, nav Cá nhân → profile.html
- `marketplace.html`: thêm link social-bar.css

## Cách cài đặt

Giải nén và ghi đè lên thư mục SocialShop cũ:
```
unzip SocialShop_Package3.zip -d ./
```

Cấu trúc file MỚI cần chú ý:
```
client/
  css/
    social-bar.css   ← FILE MỚI
  pages/
    profile.html     ← FILE MỚI
  index.html         ← CẬP NHẬT
  pages/marketplace.html ← CẬP NHẬT
```

## Gói tiếp theo (Package 4)

- Trang Chat (WebSocket)
- Trang Đăng bài / Upload ảnh
- Modal xem Story đầy đủ
- Admin Dashboard
