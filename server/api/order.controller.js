const Order = require('../models/Order');
const Product = require('../models/Product');
const Notification = require('../models/Notification');

// POST /api/orders — tạo đơn hàng (checkout)
async function createOrder(req, res, next) {
  try {
    const { items, shippingAddress, paymentMethod, note } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ message: 'Giỏ hàng không có sản phẩm' });
    }
    if (!shippingAddress?.fullName || !shippingAddress?.phone || !shippingAddress?.address) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin giao hàng' });
    }

    // Xác minh sản phẩm và tính tổng tiền
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ message: `Sản phẩm ${item.productId} không tồn tại` });
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `"${product.name}" không đủ hàng trong kho` });
      }
      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity || 1,
        image: product.images?.[0] || '',
      });
      totalAmount += product.price * (item.quantity || 1);
    }

    // Trừ kho
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -(item.quantity || 1), sold: item.quantity || 1 },
      });
    }

    const order = await Order.create({
      buyer: req.user._id,
      items: orderItems,
      totalAmount,
      shippingAddress,
      paymentMethod: paymentMethod || 'cod',
      note,
    });

    res.status(201).json({ order });
  } catch (err) { next(err); }
}

// GET /api/orders/my — đơn hàng của tôi
async function getMyOrders(req, res, next) {
  try {
    const orders = await Order.find({ buyer: req.user._id }).sort({ createdAt: -1 });
    res.json({ orders });
  } catch (err) { next(err); }
}

// GET /api/orders/:id — chi tiết đơn hàng
async function getOrder(req, res, next) {
  try {
    const order = await Order.findById(req.params.id).populate('buyer', 'username email');
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    // Buyer hoặc admin mới xem được
    if (!order.buyer._id.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Không có quyền xem đơn hàng này' });
    }
    res.json({ order });
  } catch (err) { next(err); }
}

// PUT /api/orders/:id/cancel — hủy đơn hàng (buyer, chỉ khi pending)
async function cancelOrder(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    if (!order.buyer.equals(req.user._id)) {
      return res.status(403).json({ message: 'Không có quyền hủy đơn này' });
    }
    if (order.orderStatus !== 'pending') {
      return res.status(400).json({ message: 'Chỉ có thể hủy đơn đang chờ xác nhận' });
    }
    order.orderStatus = 'cancelled';
    // Hoàn kho
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity, sold: -item.quantity },
      });
    }
    await order.save();
    res.json({ order });
  } catch (err) { next(err); }
}

// PUT /api/orders/:id/status — admin cập nhật trạng thái
async function updateOrderStatus(req, res, next) {
  try {
    const { orderStatus, paymentStatus } = req.body;
    const order = await Order.findById(req.params.id).populate('buyer', 'username');
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });

    if (orderStatus) order.orderStatus = orderStatus;
    if (paymentStatus) order.paymentStatus = paymentStatus;
    await order.save();

    // Thông báo cho buyer
    const statusLabel = { confirmed: 'đã được xác nhận', shipping: 'đang được giao', delivered: 'đã giao thành công', cancelled: 'đã bị hủy' };
    if (statusLabel[orderStatus]) {
      await Notification.create({
        recipient: order.buyer._id,
        type: 'order_update',
        refModel: 'Order',
        refId: order._id,
        message: `Đơn hàng #${order._id.toString().slice(-6)} ${statusLabel[orderStatus]}`,
      });
    }

    res.json({ order });
  } catch (err) { next(err); }
}

// GET /api/orders — tất cả đơn hàng (admin)
async function listAllOrders(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { status } = req.query;
    const query = status ? { orderStatus: status } : {};
    const [orders, total] = await Promise.all([
      Order.find(query).populate('buyer', 'username email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      Order.countDocuments(query),
    ]);
    res.json({ orders, total, page });
  } catch (err) { next(err); }
}

module.exports = { createOrder, getMyOrders, getOrder, cancelOrder, updateOrderStatus, listAllOrders };
