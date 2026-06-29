/**
 * SocialShop — Story Routes (Package 5)
 * GET  /api/stories          — stories from followed users + self
 * POST /api/stories          — create a story
 * GET  /api/stories/:id      — get single story
 * POST /api/stories/:id/view — mark as viewed
 * DELETE /api/stories/:id    — delete own story
 * GET  /api/users/:userId/stories — get stories of a specific user
 */
const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const Story = require('../models/Story');
const User = require('../models/User');

// GET /api/stories — feed of stories from followed + self
router.get('/', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const ids = [...(user.following || []), req.user._id];
    const stories = await Story.find({ author: { $in: ids } })
      .sort({ createdAt: -1 })
      .populate('author', 'username avatar');
    // Group by author
    const grouped = {};
    stories.forEach(s => {
      const aid = String(s.author._id);
      if (!grouped[aid]) grouped[aid] = { author: s.author, stories: [] };
      grouped[aid].stories.push(s);
    });
    res.json({ groups: Object.values(grouped) });
  } catch (err) { next(err); }
});

// POST /api/stories
router.post('/', auth, async (req, res, next) => {
  try {
    const { type, url, text, bg, color, caption, link, linkText } = req.body;
    const story = await Story.create({ author: req.user._id, type, url, text, bg, color, caption, link, linkText });
    await story.populate('author', 'username avatar');
    res.status(201).json({ story });
  } catch (err) { next(err); }
});

// GET /api/stories/:id
router.get('/:id', auth, async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id).populate('author', 'username avatar');
    if (!story) return res.status(404).json({ message: 'Story không tồn tại' });
    res.json({ story });
  } catch (err) { next(err); }
});

// POST /api/stories/:id/view
router.post('/:id/view', auth, async (req, res, next) => {
  try {
    await Story.findByIdAndUpdate(req.params.id, {
      $addToSet: { viewers: req.user._id }
    });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// DELETE /api/stories/:id
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ message: 'Story không tồn tại' });
    if (String(story.author) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Không có quyền xóa story này' });
    }
    await story.deleteOne();
    res.json({ success: true });
  } catch (err) { next(err); }
});

// GET /api/users/:userId/stories (used by story-viewer.html)
router.get('/user/:userId', auth, async (req, res, next) => {
  try {
    const stories = await Story.find({ author: req.params.userId })
      .sort({ createdAt: 1 })
      .populate('author', 'username avatar');
    res.json({ stories });
  } catch (err) { next(err); }
});

module.exports = router;
