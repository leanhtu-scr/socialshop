const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, maxlength: 500 },
  },
  { timestamps: true }
);

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, maxlength: 2000, default: '' },
    images: [{ type: String }], // URL ảnh
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [commentSchema],
    shares: { type: Number, default: 0 },
    tags: [{ type: String }],
    visibility: { type: String, enum: ['public', 'followers', 'private'], default: 'public' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', postSchema);
