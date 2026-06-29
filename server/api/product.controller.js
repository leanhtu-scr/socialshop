const Product = require('../models/Product');

// GET /api/products — danh sách sản phẩm (có filter/search)
async function listProducts(req, res, next) {
  try {
    const { category, search, sort, page = 1, limit = 12 } = req.query;
    const query = { status: 'active' };
    if (category) query.category = category;
    if (search) query.name = new RegExp(search, 'i');

    const sortMap = { newest: { createdAt: -1 }, price_asc: { price: 1 }, price_desc: { price: -1 }, popular: { sold: -1 } };
    const sortBy = sortMap[sort] || sortMap.newest;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('seller', 'username avatar')
        .sort(sortBy)
        .skip((+page - 1) * +limit)
        .limit(+limit),
      Product.countDocuments(query),
    ]);

    res.json({ products, total, page: +page, hasMore: +page * +limit < total });
  } catch (err) { next(err); }
}

// GET /api/products/:id — chi tiết sản phẩm
async function getProduct(req, res, next) {
  try {
    const product = await Product.findById(req.params.id)
      .populate('seller', 'username fullName avatar')
      .populate('reviews.user', 'username avatar');
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    res.json({ product });
  } catch (err) { next(err); }
}

// POST /api/products — đăng sản phẩm mới
async function createProduct(req, res, next) {
  try {
    const { name, description, price, images, category, stock, tags } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ message: 'Tên và giá sản phẩm là bắt buộc' });
    }
    const product = await Product.create({
      seller: req.user._id, name, description, price, images: images || [], category, stock: stock || 0, tags: tags || [],
    });
    res.status(201).json({ product });
  } catch (err) { next(err); }
}

// PUT /api/products/:id — cập nhật sản phẩm (seller hoặc admin)
async function updateProduct(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    if (!product.seller.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Không có quyền chỉnh sửa' });
    }
    const fields = ['name', 'description', 'price', 'images', 'category', 'stock', 'tags', 'status'];
    fields.forEach(f => { if (req.body[f] !== undefined) product[f] = req.body[f]; });
    await product.save();
    res.json({ product });
  } catch (err) { next(err); }
}

// DELETE /api/products/:id
async function deleteProduct(req, res, next) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    if (!product.seller.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Không có quyền xóa' });
    }
    await product.deleteOne();
    res.json({ message: 'Đã xóa sản phẩm' });
  } catch (err) { next(err); }
}

// POST /api/products/:id/review — đánh giá sản phẩm
async function addReview(req, res, next) {
  try {
    const { rating, comment } = req.body;
    if (!rating) return res.status(400).json({ message: 'Cần nhập số sao đánh giá' });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

    // Kiểm tra đã đánh giá chưa
    const existing = product.reviews.find(r => r.user.equals(req.user._id));
    if (existing) {
      existing.rating = rating;
      existing.comment = comment;
    } else {
      product.reviews.push({ user: req.user._id, rating, comment });
    }

    product.calcAvgRating();
    await product.save();
    await product.populate('reviews.user', 'username avatar');

    res.json({ avgRating: product.avgRating, reviewsCount: product.reviews.length });
  } catch (err) { next(err); }
}

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct, addReview };
