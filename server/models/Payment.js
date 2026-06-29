/**
 * SocialShop — Payment Model (Package 6)
 * Lưu lịch sử giao dịch thanh toán online (VNPay / MoMo).
 * COD không tạo Payment record — đơn COD được theo dõi qua Order.status.
 */

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // 'vnpay' | 'momo'
    provider: {
      type: String,
      enum: ['vnpay', 'momo'],
      required: true,
    },

    // Số tiền VND (không nhân 100)
    amount: { type: Number, required: true },

    // 'pending' → 'success' | 'failed' | 'refunded'
    status: {
      type: String,
      enum: ['pending', 'success', 'failed', 'refunded'],
      default: 'pending',
    },

    // Mã giao dịch từ cổng thanh toán
    gatewayTxnId: { type: String },

    // Response code từ cổng
    responseCode: { type: String },

    // Raw callback data (lưu để debug / đối soát)
    rawCallback: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
