/**
 * SocialShop — Message Routes (Package 5)
 * GET /api/messages/conversations   — list user's conversations
 * GET /api/messages/:convId         — get messages in a conversation
 * POST /api/messages/:convId        — send via REST (fallback; prefer Socket.io)
 * PATCH /api/messages/:convId/read  — mark messages as read
 */
const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const { Message, Conversation } = require('../models/Message');
const User = require('../models/User');

// GET /api/messages/conversations
router.get('/conversations', auth, async (req, res, next) => {
  try {
    const convs = await Conversation.find({ participants: req.user._id })
      .sort({ lastMessageAt: -1 })
      .populate('participants', 'username avatar')
      .populate('lastMessage', 'text image createdAt');

    const result = convs.map(c => {
      const other = c.participants.find(p => String(p._id) !== String(req.user._id));
      return {
        _id: c._id,
        otherUser: other,
        lastMsg: c.lastMessage?.text || null,
        lastMsgAt: c.lastMessageAt,
        updatedAt: c.updatedAt,
      };
    });
    res.json({ conversations: result });
  } catch (err) { next(err); }
});

// GET /api/messages/:convId
router.get('/:convId', auth, async (req, res, next) => {
  try {
    const conv = await Conversation.findById(req.params.convId);
    if (!conv) return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });
    if (!conv.participants.map(String).includes(String(req.user._id))) {
      return res.status(403).json({ message: 'Không có quyền truy cập' });
    }
    const messages = await Message.find({ conversation: req.params.convId })
      .sort({ createdAt: 1 })
      .populate('sender', 'username avatar');
    res.json({ messages });
  } catch (err) { next(err); }
});

// POST /api/messages/:convId (REST fallback)
router.post('/:convId', auth, async (req, res, next) => {
  try {
    const { text, image } = req.body;
    const conv = await Conversation.findById(req.params.convId);
    if (!conv) return res.status(404).json({ message: 'Không tìm thấy cuộc trò chuyện' });
    if (!conv.participants.map(String).includes(String(req.user._id))) {
      return res.status(403).json({ message: 'Không có quyền gửi tin nhắn' });
    }
    const msg = await Message.create({
      conversation: req.params.convId,
      sender: req.user._id,
      text, image,
      readBy: [req.user._id],
    });
    conv.lastMessage = msg._id;
    conv.lastMessageAt = new Date();
    await conv.save();
    await msg.populate('sender', 'username avatar');
    res.status(201).json({ message: msg });
  } catch (err) { next(err); }
});

// PATCH /api/messages/:convId/read
router.patch('/:convId/read', auth, async (req, res, next) => {
  try {
    await Message.updateMany(
      { conversation: req.params.convId, readBy: { $ne: req.user._id } },
      { $push: { readBy: req.user._id } }
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
