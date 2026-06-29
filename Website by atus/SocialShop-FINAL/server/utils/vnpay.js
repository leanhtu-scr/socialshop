/**
 * SocialShop — VNPay Utility (Package 6)
 * -------------------------------------------------------
 * Tạo URL thanh toán VNPay và xác minh IPN/Return callback.
 *
 * Env cần thiết:
 *   VNPAY_TMN_CODE   — mã merchant (VNPay cấp)
 *   VNPAY_HASH_SECRET — hash secret (VNPay cấp)
 *   VNPAY_URL        — URL cổng VNPay (mặc định sandbox)
 *   CLIENT_URL       — URL frontend (để redirect sau thanh toán)
 */

const crypto  = require('crypto');
const qs      = require('querystring');

const VNPAY_URL     = process.env.VNPAY_URL     || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
const TMN_CODE      = process.env.VNPAY_TMN_CODE || 'DEMO_TMN';
const HASH_SECRET   = process.env.VNPAY_HASH_SECRET || 'DEMO_SECRET';
const RETURN_URL    = `${process.env.CLIENT_URL || 'http://localhost:3000'}/pages/payment-result.html`;

/**
 * Tạo URL thanh toán VNPay
 * @param {Object} params
 * @param {string} params.orderId   — mã đơn hàng (MongoDB ObjectId)
 * @param {number} params.amount    — số tiền (VND, không nhân 100)
 * @param {string} params.orderInfo — thông tin đơn hàng (tối đa 255 ký tự)
 * @param {string} params.ipAddr    — IP người dùng
 * @returns {string} URL redirect tới VNPay
 */
function createPaymentUrl({ orderId, amount, orderInfo, ipAddr }) {
  const date = new Date();
  const createDate = formatDate(date);
  const expireDate = formatDate(new Date(date.getTime() + 15 * 60 * 1000)); // +15 phút

  const params = {
    vnp_Version:     '2.1.0',
    vnp_Command:     'pay',
    vnp_TmnCode:     TMN_CODE,
    vnp_Locale:      'vn',
    vnp_CurrCode:    'VND',
    vnp_TxnRef:      String(orderId),
    vnp_OrderInfo:   orderInfo.slice(0, 255),
    vnp_OrderType:   'other',
    vnp_Amount:      amount * 100,          // VNPay nhân 100
    vnp_ReturnUrl:   RETURN_URL,
    vnp_IpAddr:      ipAddr,
    vnp_CreateDate:  createDate,
    vnp_ExpireDate:  expireDate,
  };

  // Sắp xếp tham số theo alphabet
  const sorted = sortObject(params);
  const signData = qs.stringify(sorted, { encode: false });
  const signature = hmacSHA512(HASH_SECRET, signData);

  return `${VNPAY_URL}?${signData}&vnp_SecureHash=${signature}`;
}

/**
 * Xác minh chữ ký từ VNPay IPN / Return URL
 * @param {Object} query — req.query hoặc req.body từ VNPay callback
 * @returns {{ valid: boolean, code: string, message: string }}
 */
function verifyReturn(query) {
  const { vnp_SecureHash, ...rest } = query;
  const sorted   = sortObject(rest);
  const signData = qs.stringify(sorted, { encode: false });
  const expected = hmacSHA512(HASH_SECRET, signData);

  if (vnp_SecureHash !== expected) {
    return { valid: false, code: '97', message: 'Chữ ký không hợp lệ' };
  }

  const responseCode = query.vnp_ResponseCode;
  if (responseCode === '00') {
    return { valid: true, code: '00', message: 'Thanh toán thành công' };
  }

  const messages = {
    '07': 'Giao dịch bị nghi ngờ gian lận',
    '09': 'Thẻ/tài khoản chưa đăng ký dịch vụ',
    '10': 'Xác thực thẻ sai quá 3 lần',
    '11': 'Hết hạn chờ thanh toán',
    '12': 'Thẻ/tài khoản bị khóa',
    '13': 'Sai OTP',
    '24': 'Người dùng hủy giao dịch',
    '51': 'Tài khoản không đủ số dư',
    '65': 'Vượt hạn mức giao dịch trong ngày',
    '75': 'Ngân hàng bảo trì',
    '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định',
  };

  return {
    valid: false,
    code: responseCode,
    message: messages[responseCode] || `Lỗi thanh toán (mã ${responseCode})`,
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function hmacSHA512(secret, data) {
  return crypto.createHmac('sha512', secret).update(data, 'utf-8').digest('hex');
}

function formatDate(date) {
  const pad = n => String(n).padStart(2, '0');
  return (
    date.getFullYear() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

function sortObject(obj) {
  return Object.fromEntries(
    Object.entries(obj).sort(([a], [b]) => a.localeCompare(b))
  );
}

module.exports = { createPaymentUrl, verifyReturn };
