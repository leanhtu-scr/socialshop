/**
 * SocialShop — MoMo Utility (Package 6)
 * -------------------------------------------------------
 * Tích hợp MoMo QR / ATM (API v2).
 *
 * Env cần thiết:
 *   MOMO_PARTNER_CODE
 *   MOMO_ACCESS_KEY
 *   MOMO_SECRET_KEY
 *   CLIENT_URL
 */

const crypto  = require('crypto');
const https   = require('https');

const PARTNER_CODE = process.env.MOMO_PARTNER_CODE || 'MOMO_DEMO';
const ACCESS_KEY   = process.env.MOMO_ACCESS_KEY   || 'DEMO_ACCESS';
const SECRET_KEY   = process.env.MOMO_SECRET_KEY   || 'DEMO_SECRET';
const MOMO_ENDPOINT = 'https://test-payment.momo.vn'; // sandbox; đổi sang payment.momo.vn khi live
const NOTIFY_URL    = `${process.env.SERVER_URL || 'http://localhost:5000'}/api/payment/momo/ipn`;
const RETURN_URL    = `${process.env.CLIENT_URL  || 'http://localhost:3000'}/pages/payment-result.html`;

/**
 * Tạo yêu cầu thanh toán MoMo (QR + ATM)
 * @returns {{ payUrl: string, qrCodeUrl: string, deeplink: string }}
 */
async function createPaymentRequest({ orderId, amount, orderInfo }) {
  const requestId  = `SS_${Date.now()}_${orderId}`;
  const extraData  = '';                   // base64 tùy chọn
  const requestType = 'captureWallet';     // QR / app

  const rawHash = [
    `accessKey=${ACCESS_KEY}`,
    `amount=${amount}`,
    `extraData=${extraData}`,
    `ipnUrl=${NOTIFY_URL}`,
    `orderId=${orderId}`,
    `orderInfo=${orderInfo}`,
    `partnerCode=${PARTNER_CODE}`,
    `redirectUrl=${RETURN_URL}`,
    `requestId=${requestId}`,
    `requestType=${requestType}`,
  ].join('&');

  const signature = crypto.createHmac('sha256', SECRET_KEY).update(rawHash).digest('hex');

  const body = JSON.stringify({
    partnerCode: PARTNER_CODE,
    accessKey:   ACCESS_KEY,
    requestId,
    amount:      String(amount),
    orderId:     String(orderId),
    orderInfo,
    redirectUrl: RETURN_URL,
    ipnUrl:      NOTIFY_URL,
    extraData,
    requestType,
    signature,
    lang: 'vi',
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: new URL(MOMO_ENDPOINT).hostname,
      path:     '/v2/gateway/api/create',
      method:   'POST',
      headers:  { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    };

    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.resultCode === 0) {
            resolve({
              payUrl:     parsed.payUrl,
              qrCodeUrl:  parsed.qrCodeUrl,
              deeplink:   parsed.deeplink,
            });
          } else {
            reject(new Error(parsed.message || 'MoMo error'));
          }
        } catch {
          reject(new Error('Invalid MoMo response'));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Xác minh IPN từ MoMo
 */
function verifyIPN(body) {
  const {
    partnerCode, orderId, requestId, amount,
    orderInfo, orderType, transId, resultCode,
    message, payType, responseTime, extraData, signature,
  } = body;

  const rawHash = [
    `accessKey=${ACCESS_KEY}`,
    `amount=${amount}`,
    `extraData=${extraData}`,
    `message=${message}`,
    `orderId=${orderId}`,
    `orderInfo=${orderInfo}`,
    `orderType=${orderType}`,
    `partnerCode=${partnerCode}`,
    `payType=${payType}`,
    `requestId=${requestId}`,
    `responseTime=${responseTime}`,
    `resultCode=${resultCode}`,
    `transId=${transId}`,
  ].join('&');

  const expected = crypto.createHmac('sha256', SECRET_KEY).update(rawHash).digest('hex');
  return signature === expected && resultCode === 0;
}

module.exports = { createPaymentRequest, verifyIPN };
