const Post = require('../models/Post');
const Notification = require('../models/Notification');

// GET /api/posts — feed (bài viết public của mọi người, mới nhất)
async function getFeed(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find({ visibility: 'public' })
      .populate('author', 'username fullName avatar')
      .populate('comments.user', 'username avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ posts, page, hasMore: posts.length === limit });
  } catch (err) { next(err); }
}

// POST /api/posts — tạo bài viết mới
async function createPost(req, res, next) {
  try {
    const { content, images, tags, visibility } = req.body;
    if (!content && (!images || !images.length)) {
      return res.status(400).json({ message: 'Bài viết cần có nội dung hoặc ảnh' });
    }
    const post = await Post.create({
      author: req.user._id,
      content,
      images: images || [],
      tags: tags || [],
      visibility: visibility || 'public',
    });
    await post.populate('author', 'username fullName avatar');
    res.status(201).json({ post });
  } catch (err) { next(err); }
}

// GET /api/posts/:id — chi tiết bài viết
async function getPost(req, res, next) {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username fullName avatar')
      .populate('comments.user', 'username avatar');
    if (!post) return res.status(404).json({ message: 'Không tìm thấy bài viết' });
    res.json({ post });
  } catch (err) { next(err); }
}

// PUT /api/posts/:id — chỉnh sửa bài viết (chỉ tác giả)
async function updatePost(req, res, next) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Không tìm thấy bài viết' });
    if (!post.author.equals(req.user._id)) {
      return res.status(403).json({ message: 'Không có quyền chỉnh sửa' });
    }
    const { content, tags, visibility } = req.body;
    if (content !== undefined) post.content = content;
    if (tags !== undefined) post.tags = tags;
    if (visibility !== undefined) post.visibility = visibility;
    await post.save();
    res.json({ post });
  } catch (err) { next(err); }
}

// DELETE /api/posts/:id — xóa bài viết (tác giả hoặc admin)
async function deletePost(req, res, next) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Không tìm thấy bài viết' });
    const isOwner = post.author.equals(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Không có quyền xóa' });
    }
    await post.deleteOne();
    res.json({ message: 'Đã xóa bài viết' });
  } catch (err) { next(err); }
}

// POST /api/posts/:id/like — like / unlike
async function toggleLike(req, res, next) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Không tìm thấy bài viết' });

    const userId = req.user._id;
    const idx = post.likes.findIndex(id => id.equals(userId));
    let liked;
    if (idx === -1) {
      post.likes.push(userId);
      liked = true;
      // Thông báo cho tác giả (nếu không phải tự like)
      if (!post.author.equals(userId)) {
        await Notification.create({
          recipient: post.author,
          sender: userId,
          type: 'like',
          refModel: 'Post',
          refId: post._id,
          message: `${req.user.username} đã thích bài viết của bạn`,
        });
      }
    } else {
      post.likes.splice(idx, 1);
      liked = false;
    }
    await post.save();
    res.json({ liked, likesCount: post.likes.length });
  } catch (err) { next(err); }
}

// POST /api/posts/:id/comment — thêm comment
async function addComment(req, res, next) {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Nội dung comment không được trống' });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Không tìm thấy bài viết' });

    post.comments.push({ user: req.user._id, text });
    await post.save();
    await post.populate('comments.user', 'username avatar');

    const newComment = post.comments[post.comments.length - 1];

    // Thông báo cho tác giả
    if (!post.author.equals(req.user._id)) {
      await Notification.create({
        recipient: post.author,
        sender: req.user._id,
        type: 'comment',
        refModel: 'Post',
        refId: post._id,
        message: `${req.user.username} đã bình luận: "${text.slice(0, 50)}"`,
      });
    }

    res.status(201).json({ comment: newComment, commentsCount: post.comments.length });
  } catch (err) { next(err); }
}

// DELETE /api/posts/:id/comment/:commentId — xóa comment
async function deleteComment(req, res, next) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Không tìm thấy bài viết' });

    const comment = post.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ message: 'Không tìm thấy comment' });

    const isOwner = comment.user.equals(req.user._id);
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Không có quyền xóa comment này' });
    }

    comment.deleteOne();
    await post.save();
    res.json({ message: 'Đã xóa comment', commentsCount: post.comments.length });
  } catch (err) { next(err); }
}

// POST /api/posts/:id/share — tăng bộ đếm share
async function sharePost(req, res, next) {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { shares: 1 } },
      { new: true }
    );
    if (!post) return res.status(404).json({ message: 'Không tìm thấy bài viết' });
    res.json({ shares: post.shares });
  } catch (err) { next(err); }
}

module.exports = { getFeed, createPost, getPost, updatePost, deletePost, toggleLike, addComment, deleteComment, sharePost };
