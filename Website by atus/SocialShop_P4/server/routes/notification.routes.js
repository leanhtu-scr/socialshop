const express = require('express');
const router = express.Router();
const { getMyNotifications, markAllRead, markRead } = require('../api/notification.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.get('/', requireAuth, getMyNotifications);
router.put('/read-all', requireAuth, markAllRead);
router.put('/:id/read', requireAuth, markRead);

module.exports = router;
