const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../api/admin.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');

router.get('/stats', requireAuth, requireAdmin, getDashboardStats);

module.exports = router;
