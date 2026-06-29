/**
 * SocialShop — Upload Routes (Package 6)
 * POST /api/upload/avatar   — đổi avatar
 * POST /api/upload/cover    — đổi ảnh bìa
 * POST /api/upload/image    — upload ảnh chung
 */

const router = require('express').Router();
const { requireAuth } = require('../middleware/auth.middleware');
const { upload, handleUpload } = require('../utils/upload');
const { uploadAvatar, uploadCover, uploadImage } = require('../api/upload.controller');

router.post('/avatar', requireAuth, upload.single('image'), handleUpload, uploadAvatar);
router.post('/cover',  requireAuth, upload.single('image'), handleUpload, uploadCover);
router.post('/image',  requireAuth, upload.single('image'), handleUpload, uploadImage);

module.exports = router;
