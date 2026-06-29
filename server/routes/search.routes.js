/**
 * SocialShop — Search Routes (Package 5)
 * GET /api/search?q=...&type=all|user|post|product
 */
const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const User = require('../models/User');
const Post = require('../models/Post');
const Product = require('../models/Product');

router.get('/', auth, async (req, res, next) => {
  try {
    const { q = '', type = 'all' } = req.query;
    if (!q.trim()) return res.json({ users:[], posts:[], products:[] });

    const regex = new RegExp(q.trim(), 'i');
    const results = {};

    if (type === 'all' || type === 'user') {
      results.users = await User.find({
        $or: [{ username: regex }, { bio: regex }]
      }).select('username avatar bio followersCount').limit(10);
    }

    if (type === 'all' || type === 'post') {
      results.posts = await Post.find({ content: regex })
        .populate('author', 'username avatar')
        .sort({ createdAt: -1 })
        .limit(10);
    }

    if (type === 'all' || type === 'product') {
      results.products = await Product.find({
        $or: [{ name: regex }, { description: regex }, { category: regex }]
      }).sort({ createdAt: -1 }).limit(10);
    }

    res.json(results);
  } catch (err) { next(err); }
});

module.exports = router;
