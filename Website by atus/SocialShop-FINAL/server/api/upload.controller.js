/**
 * SocialShop — Upload Controller (Package 6)
 * -------------------------------------------------------
 * POST /api/upload/avatar          — cập nhật avatar người dùng
 * POST /api/upload/cover           — cập nhật ảnh bìa trang cá nhân
 * POST /api/upload/image           — upload ảnh bất kỳ (post / product / story)
 *                                    → trả về { url } để client gắn vào form
 */

const User = require('../models/User');

// PUT /api/upload/avatar
// Middleware: requireAuth → upload.single('image') → handleUpload → uploadAvatar
async function uploadAvatar(req, res, next) {
  try {
    if (!req.fileUrl) {
      return res.status(400).json({ message: 'Chưa chọn ảnh' });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: req.fileUrl },
      { new: true }
    ).select('-password');

    res.json({ user, url: req.fileUrl });
  } catch (err) {
    next(err);
  }
}

// POST /api/upload/cover
async function uploadCover(req, res, next) {
  try {
    if (!req.fileUrl) {
      return res.status(400).json({ message: 'Chưa chọn ảnh' });
    }
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { coverPhoto: req.fileUrl },
      { new: true }
    ).select('-password');

    res.json({ user, url: req.fileUrl });
  } catch (err) {
    next(err);
  }
}

// POST /api/upload/image — upload ảnh chung (post media, product thumb, story)
async function uploadImage(req, res, next) {
  try {
    if (!req.fileUrl) {
      return res.status(400).json({ message: 'Chưa chọn ảnh' });
    }
    res.json({ url: req.fileUrl });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadAvatar, uploadCover, uploadImage };
