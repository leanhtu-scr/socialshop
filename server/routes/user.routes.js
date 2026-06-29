const express = require('express');
const router = express.Router();
const { getProfile, updateMe, toggleFollow, getUserPosts, listUsers, deleteUser } = require('../api/user.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');

router.get('/', requireAuth, requireAdmin, listUsers);
router.put('/me', requireAuth, updateMe);
router.get('/:username', getProfile);
router.get('/:username/posts', getUserPosts);
router.post('/:id/follow', requireAuth, toggleFollow);
router.delete('/:id', requireAuth, requireAdmin, deleteUser);

module.exports = router;
