const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Bảo vệ route — yêu cầu header: Authorization: Bearer <token>
 * Gắn req.user = thông tin user đã đăng nhập nếu token hợp lệ.
 */
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Chưa đăng nhập (thiếu token)' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: 'Token không hợp lệ' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
}

/** Chỉ cho phép role = admin */
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Yêu cầu quyền quản trị viên' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
