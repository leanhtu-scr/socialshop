const User = require('../models/User');
const Post = require('../models/Post');
const Product = require('../models/Product');
const Order = require('../models/Order');

// GET /api/admin/stats — thống kê tổng quan
async function getDashboardStats(req, res, next) {
  try {
    const [totalUsers, totalPosts, totalProducts, totalOrders, recentOrders, revenue] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      Product.countDocuments({ status: 'active' }),
      Order.countDocuments(),
      Order.find().populate('buyer', 'username').sort({ createdAt: -1 }).limit(5),
      Order.aggregate([
        { $match: { orderStatus: 'delivered' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    // Người dùng mới 7 ngày qua
    const since7days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsers7d = await User.countDocuments({ createdAt: { $gte: since7days } });

    // Đơn hàng theo trạng thái
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
    ]);

    res.json({
      stats: {
        totalUsers,
        totalPosts,
        totalProducts,
        totalOrders,
        revenue: revenue[0]?.total || 0,
        newUsers7d,
      },
      ordersByStatus,
      recentOrders,
    });
  } catch (err) { next(err); }
}

module.exports = { getDashboardStats };
