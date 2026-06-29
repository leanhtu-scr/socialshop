const Notification = require('../models/Notification');

// GET /api/notifications — thông báo của tôi
async function getMyNotifications(req, res, next) {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(50);
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    res.json({ notifications, unreadCount });
  } catch (err) { next(err); }
}

// PUT /api/notifications/read-all — đánh dấu tất cả đã đọc
async function markAllRead(req, res, next) {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
    res.json({ message: 'Đã đọc tất cả thông báo' });
  } catch (err) { next(err); }
}

// PUT /api/notifications/:id/read
async function markRead(req, res, next) {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { isRead: true }
    );
    res.json({ message: 'Đã đọc' });
  } catch (err) { next(err); }
}

module.exports = { getMyNotifications, markAllRead, markRead };
