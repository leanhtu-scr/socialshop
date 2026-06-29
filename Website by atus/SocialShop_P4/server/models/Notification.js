const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      enum: ['like', 'comment', 'follow', 'order_update', 'mention', 'share'],
      required: true,
    },
    // Tham chiếu linh hoạt: có thể là Post, Product, Order
    refModel: { type: String, enum: ['Post', 'Product', 'Order'] },
    refId: { type: mongoose.Schema.Types.ObjectId },
    message: { type: String, required: true, maxlength: 200 },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
