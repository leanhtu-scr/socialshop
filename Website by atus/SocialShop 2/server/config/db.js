const mongoose = require('mongoose');

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn(
      '⚠️  Chưa có MONGO_URI trong file .env — API sẽ chạy nhưng các route' +
      ' cần database sẽ lỗi. Xem server/.env.example để biết cách cấu hình.'
    );
    return;
  }
  try {
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
