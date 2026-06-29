/**
 * SocialShop — Payment Controller (Package 6)
 * -------------------------------------------------------
 * POST /api/payment/vnpay/create   — tạo URL thanh toán VNPay
 * GET  /api/payment/vnpay/return   — VNPay redirect về sau thanh toán (public)
 * POST /api/payment/vnpay/ipn      — VNPay IPN server-to-server (public)
 *
 * POST /api/payment/momo/create    — tạo yêu cầu MoMo
 * POST /api/payment/momo/ipn       — MoMo IPN (public)
 *
 * GET  /api/payment/history        — lịch sử thanh toán của user (requireAuth)
 */

const Order   = require('../models/Order');
const Payment = require('../models/Payment');
const { createPaymentUrl, verifyReturn } = require('../utils/vnpay');
const { createPaymentRequest, verifyIPN } = require('../utils/momo');

// ── VNPay ──────────────────────────────────────────────────────────────────

async function vnpayCreate(req, res, next) {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
    if (String(order.buyer) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Không có quyền thanh toán đơn hàng này' });
    }
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Đơn hàng đã được thanh toán' });
    }

    // Cập nhật phương thức thanh toán trên đơn
    order.paymentMethod = 'vnpay';
    await order.save();

    // Tạo / reset Payment record
    await Payment.findOneAndDelete({ order: orderId, status: 'pending' });
    await Payment.create({
      order:    orderId,
      user:     req.user._id,
      provider: 'vnpay',
      amount:   order.totalAmount,
      status:   'pending',
    });

    const ipAddr =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.connection?.remoteAddress ||
      '127.0.0.1';

    const payUrl = createPaymentUrl({
      orderId:   String(orderId),
      amount:    order.totalAmount,
      orderInfo: `SocialShop - Don hang #${String(orderId).slice(-6)}`,
      ipAddr,
    });

    res.json({ payUrl });
  } catch (err) {
    next(err);
  }
}

// VNPay redirect về client sau khi thanh toán xong
// VNPay sẽ GET /api/payment/vnpay/return?vnp_*=...
async function vnpayReturn(req, res, next) {
  try {
    const result = verifyReturn(req.query);
    const orderId = req.query.vnp_TxnRef;

    const payment = await Payment.findOne({ order: orderId, provider: 'vnpay' });
    if (payment && payment.status === 'pending') {
      payment.responseCode  = req.query.vnp_ResponseCode;
      payment.gatewayTxnId  = req.query.vnp_TransactionNo;
      payment.rawCallback   = req.query;
      payment.status        = result.valid ? 'success' : 'failed';
      await payment.save();

      if (result.valid) {
        await Order.findByIdAndUpdate(orderId, {
          paymentStatus: 'paid',
          status: 'confirmed',
        });
      }
    }

    // Redirect về trang kết quả client
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';
    const params = new URLSearchParams({
      provider: 'vnpay',
      code:     result.code,
      success:  result.valid ? '1' : '0',
      orderId,
    });
    res.redirect(`${clientUrl}/pages/payment-result.html?${params}`);
  } catch (err) {
    next(err);
  }
}

// VNPay IPN — server nhận xác nhận giao dịch (không redirect)
async function vnpayIPN(req, res) {
  try {
    const result  = verifyReturn(req.query);
    const orderId = req.query.vnp_TxnRef;

    if (result.valid) {
      await Payment.findOneAndUpdate(
        { order: orderId, provider: 'vnpay', status: 'pending' },
        { status: 'success', gatewayTxnId: req.query.vnp_TransactionNo, rawCallback: req.query }
      );
      await Order.findByIdAndUpdate(orderId, { paymentStatus: 'paid', status: 'confirmed' });
      return res.json({ RspCode: '00', Message: 'Confirm Success' });
    }

    res.json({ RspCode: '97', Message: 'Invalid signature' });
  } catch {
    res.json({ RspCode: '99', Message: 'Server error' });
  }
}

// ── MoMo ───────────────────────────────────────────────────────────────────

async function momoCreate(req, res, next) {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
    if (String(order.buyer) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Không có quyền thanh toán đơn hàng này' });
    }
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Đơn hàng đã được thanh toán' });
    }

    order.paymentMethod = 'momo';
    await order.save();

    await Payment.findOneAndDelete({ order: orderId, provider: 'momo', status: 'pending' });
    await Payment.create({
      order:    orderId,
      user:     req.user._id,
      provider: 'momo',
      amount:   order.totalAmount,
      status:   'pending',
    });

    const result = await createPaymentRequest({
      orderId:   String(orderId),
      amount:    order.totalAmount,
      orderInfo: `SocialShop - Don hang #${String(orderId).slice(-6)}`,
    });

    res.json(result); // { payUrl, qrCodeUrl, deeplink }
  } catch (err) {
    next(err);
  }
}

async function momoIPN(req, res) {
  try {
    const valid   = verifyIPN(req.body);
    const orderId = req.body.orderId;

    if (valid) {
      await Payment.findOneAndUpdate(
        { order: orderId, provider: 'momo', status: 'pending' },
        { status: 'success', gatewayTxnId: req.body.transId, rawCallback: req.body }
      );
      await Order.findByIdAndUpdate(orderId, { paymentStatus: 'paid', status: 'confirmed' });
    }

    res.json({ resultCode: 0 });
  } catch {
    res.json({ resultCode: 99 });
  }
}

// ── Lịch sử thanh toán ─────────────────────────────────────────────────────

async function paymentHistory(req, res, next) {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('order', 'totalAmount status items')
      .limit(50);
    res.json({ payments });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  vnpayCreate, vnpayReturn, vnpayIPN,
  momoCreate, momoIPN,
  paymentHistory,
};
