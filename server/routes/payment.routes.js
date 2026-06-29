/**
 * SocialShop — Payment Routes (Package 6)
 * POST /api/payment/vnpay/create
 * GET  /api/payment/vnpay/return   (VNPay redirect — không cần auth)
 * POST /api/payment/vnpay/ipn      (VNPay IPN — không cần auth)
 * POST /api/payment/momo/create
 * POST /api/payment/momo/ipn       (MoMo IPN — không cần auth)
 * GET  /api/payment/history
 */

const router = require('express').Router();
const { requireAuth } = require('../middleware/auth.middleware');
const {
  vnpayCreate, vnpayReturn, vnpayIPN,
  momoCreate, momoIPN,
  paymentHistory,
} = require('../api/payment.controller');

// VNPay
router.post('/vnpay/create',  requireAuth, vnpayCreate);
router.get('/vnpay/return',   vnpayReturn);   // public — VNPay redirect
router.post('/vnpay/ipn',     vnpayIPN);      // public — VNPay server notify

// MoMo
router.post('/momo/create',   requireAuth, momoCreate);
router.post('/momo/ipn',      momoIPN);       // public — MoMo server notify

// Lịch sử
router.get('/history',        requireAuth, paymentHistory);

module.exports = router;
