const express = require('express');
const router = express.Router();
const { getFeed, createPost, getPost, updatePost, deletePost, toggleLike, addComment, deleteComment, sharePost } = require('../api/post.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.get('/', getFeed);
router.post('/', requireAuth, createPost);
router.get('/:id', getPost);
router.put('/:id', requireAuth, updatePost);
router.delete('/:id', requireAuth, deletePost);
router.post('/:id/like', requireAuth, toggleLike);
router.post('/:id/comment', requireAuth, addComment);
router.delete('/:id/comment/:commentId', requireAuth, deleteComment);
router.post('/:id/share', requireAuth, sharePost);

module.exports = router;
