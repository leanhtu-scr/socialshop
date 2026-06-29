const express = require('express');
const router = express.Router();
const { listProducts, getProduct, createProduct, updateProduct, deleteProduct, addReview } = require('../api/product.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.get('/', listProducts);
router.post('/', requireAuth, createProduct);
router.get('/:id', getProduct);
router.put('/:id', requireAuth, updateProduct);
router.delete('/:id', requireAuth, deleteProduct);
router.post('/:id/review', requireAuth, addReview);

module.exports = router;
