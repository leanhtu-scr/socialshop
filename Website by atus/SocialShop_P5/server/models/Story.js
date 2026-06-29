/**
 * SocialShop — Story Model (Package 5)
 * Stories expire after 24 hours (MongoDB TTL index)
 */
const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['image', 'video', 'text'], default: 'text' },
  // for image/video stories
  url: String,
  // for text stories
  text: String,
  bg: { type: String, default: 'linear-gradient(135deg,#7C5CFC,#FF6B6B)' },
  color: { type: String, default: '#FFFFFF' },
  // overlay caption
  caption: String,
  link: String,
  linkText: String,
  // viewers
  viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // TTL — auto delete after 24h
  expiresAt: { type: Date, default: () => new Date(Date.now() + 24*60*60*1000), index: { expireAfterSeconds: 0 } },
}, { timestamps: true });

module.exports = mongoose.model('Story', storySchema);
