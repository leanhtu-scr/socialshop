const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, maxlength: 2000, default: '' },
    price: { type: Number, required: true, min: 0 },
    images: [{ type: String }],
    category: {
      type: String,
      enum: ['electronics', 'fashion', 'food', 'beauty', 'home', 'sports', 'books', 'other'],
      default: 'other',
    },
    stock: { type: Number, default: 0, min: 0 },
    reviews: [reviewSchema],
    avgRating: { type: Number, default: 0 },
    sold: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'hidden', 'soldout'], default: 'active' },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

// Tự cập nhật avgRating sau khi lưu
productSchema.methods.calcAvgRating = function () {
  if (!this.reviews.length) { this.avgRating = 0; return; }
  this.avgRating = this.reviews.reduce((s, r) => s + r.rating, 0) / this.reviews.length;
};

module.exports = mongoose.model('Product', productSchema);
