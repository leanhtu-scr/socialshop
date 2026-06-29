const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, getOrder, cancelOrder, updateOrderStatus, listAllOrders } = require('../api/order.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');

router.get('/my', requireAuth, getMyOrders);
router.post('/', requireAuth, createOrder);
router.get('/:id', requireAuth, getOrder);
router.put('/:id/cancel', requireAuth, cancelOrder);
router.put('/:id/status', requireAuth, requireAdmin, updateOrderStatus);
router.get('/', requireAuth, requireAdmin, listAllOrders);

module.exports = router;
