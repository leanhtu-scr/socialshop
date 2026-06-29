const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');

// GET /api/users/:username — xem profile
async function getProfile(req, res, next) {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    res.json({ user: user.toSafeObject() });
  } catch (err) { next(err); }
}

// PUT /api/users/me — cập nhật thông tin cá nhân
async function updateMe(req, res, next) {
  try {
    const { fullName, bio, avatar } = req.body;
    const user = await User.findById(req.user._id);
    if (fullName !== undefined) user.fullName = fullName;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;
    await user.save();
    res.json({ user: user.toSafeObject() });
  } catch (err) { next(err); }
}

// POST /api/users/:id/follow — theo dõi / bỏ theo dõi
async function toggleFollow(req, res, next) {
  try {
    const targetId = req.params.id;
    const meId = req.user._id;

    if (String(targetId) === String(meId)) {
      return res.status(400).json({ message: 'Không thể tự theo dõi chính mình' });
    }

    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ message: 'Người dùng không tồn tại' });

    const me = await User.findById(meId);
    const isFollowing = me.following.some(id => id.equals(targetId));

    if (isFollowing) {
      // Bỏ theo dõi
      me.following = me.following.filter(id => !id.equals(targetId));
      target.followers = target.followers.filter(id => !id.equals(meId));
    } else {
      // Theo dõi
      me.following.push(targetId);
      target.followers.push(meId);
      await Notification.create({
        recipient: targetId,
        sender: meId,
        type: 'follow',
        message: `${me.username} đã bắt đầu theo dõi bạn`,
      });
    }

    await Promise.all([me.save(), target.save()]);
    res.json({
      following: !isFollowing,
      followersCount: target.followers.length,
    });
  } catch (err) { next(err); }
}

// GET /api/users/:username/posts — bài viết của user
async function getUserPosts(req, res, next) {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

    const posts = await Post.find({ author: user._id, visibility: 'public' })
      .populate('author', 'username fullName avatar')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ posts });
  } catch (err) { next(err); }
}

// GET /api/users — danh sách user (admin)
async function listUsers(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || '';
    const query = search
      ? { $or: [{ username: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }] }
      : {};
    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      User.countDocuments(query),
    ]);
    res.json({ users: users.map(u => u.toSafeObject()), total, page });
  } catch (err) { next(err); }
}

// DELETE /api/users/:id — xóa user (admin)
async function deleteUser(req, res, next) {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Đã xóa người dùng' });
  } catch (err) { next(err); }
}

module.exports = { getProfile, updateMe, toggleFollow, getUserPosts, listUsers, deleteUser };
