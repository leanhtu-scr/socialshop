# database/

SocialShop dùng **MongoDB**. Ở Package hiện tại chưa có schema thật,
chỉ là chỗ giữ cho:

- `seed/` — dữ liệu mẫu để test (user giả, sản phẩm giả)
- Connection string sẽ đặt trong `server/.env` (KHÔNG commit lên Git):
  ```
  MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/socialshop
  JWT_SECRET=your_secret_key
  ```

Schema chi tiết (User, Post, Product, Order, Message...) sẽ được thêm
ở Package 2 cùng với `server/models/`.
