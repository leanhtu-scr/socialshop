const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../api/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, getMe);

module.exports = router;
