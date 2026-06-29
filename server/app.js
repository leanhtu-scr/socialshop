/**
 * SocialShop API — v1.0.0 FINAL
 * Features: Auth, Posts, Users, Products, Orders,
 * Notifications, Chat (Socket.io), Stories, Search,
 * Upload (Cloudinary), Payment (VNPay+MoMo), Admin, Livestream
 */

require('dotenv').config();
const express  = require('express');
const http     = require('http');
const { Server } = require('socket.io');
const cors     = require('cors');
const path     = require('path');

const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/error.middleware');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || '*', methods: ['GET','POST'] },
  pingTimeout: 60000,
});

// ── Middleware ──
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '../client')));

connectDB();

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({ name:'SocialShop API', version:'1.0.0', status:'ok',
    uptime: Math.floor(process.uptime())+'s', timestamp: new Date().toISOString() });
});

// ── Routes ──
app.use('/api/auth',          require('./routes/auth.routes'));
app.use('/api/posts',         require('./routes/post.routes'));
app.use('/api/users',         require('./routes/user.routes'));
app.use('/api/products',      require('./routes/product.routes'));
app.use('/api/orders',        require('./routes/order.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/admin',         require('./routes/admin.routes'));
app.use('/api/messages',      require('./routes/message.routes'));
app.use('/api/stories',       require('./routes/story.routes'));
app.use('/api/search',        require('./routes/search.routes'));
app.use('/api/upload',        require('./routes/upload.routes'));
app.use('/api/payment',       require('./routes/payment.routes'));

// ── SPA catch-all ──
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// ═══════════════════════════════════════
// SOCKET.IO — Chat + Livestream
// ═══════════════════════════════════════
const jwt  = require('jsonwebtoken');
const User = require('./models/User');
const { Message, Conversation } = require('./models/Message');

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Chưa đăng nhập'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return next(new Error('Token không hợp lệ'));
    socket.user = user;
    next();
  } catch { next(new Error('Token không hợp lệ')); }
});

const onlineUsers  = new Map(); // userId → socketId
const activeStreams = new Map(); // streamId → stream object

io.on('connection', (socket) => {
  const userId   = String(socket.user._id);
  const username = socket.user.username;

  onlineUsers.set(userId, socket.id);
  io.emit('online_users', Array.from(onlineUsers.keys()));

  // ── CHAT ──
  socket.on('join_conversation', (convId) => socket.join(`conv:${convId}`));

  socket.on('send_message', async ({ conversationId, text, image }) => {
    try {
      const conv = await Conversation.findById(conversationId);
      if (!conv) return;
      const msg = await Message.create({
        conversation: conversationId, sender: socket.user._id,
        text, image, readBy: [socket.user._id],
      });
      conv.lastMessage = msg._id; conv.lastMessageAt = new Date();
      await conv.save();
      await msg.populate('sender', 'username avatar fullName');
      io.to(`conv:${conversationId}`).emit('new_message', msg);
      // notify others
      const others = conv.participants.filter(p => String(p) !== userId);
      for (const pid of others) {
        const sid = onlineUsers.get(String(pid));
        if (sid) io.to(sid).emit('notification', {
          type:'message', actor:{ _id:userId, username },
          content: text?.slice(0,60) || '📷 Ảnh', conversationId,
        });
      }
    } catch { socket.emit('error_msg', { message:'Gửi tin nhắn thất bại' }); }
  });

  socket.on('start_conversation', async ({ targetUserId }, cb) => {
    try {
      let conv = await Conversation.findOne({
        participants: { $all:[socket.user._id, targetUserId], $size:2 }
      });
      if (!conv) conv = await Conversation.create({ participants:[socket.user._id, targetUserId] });
      socket.join(`conv:${conv._id}`);
      const sid = onlineUsers.get(String(targetUserId));
      if (sid) io.to(sid).emit('conversation_started', { conversationId:conv._id });
      cb({ conversationId:conv._id });
    } catch { cb({ error:'Không thể tạo cuộc trò chuyện' }); }
  });

  socket.on('typing', ({ conversationId }) =>
    socket.to(`conv:${conversationId}`).emit('typing', { userId, username }));
  socket.on('stop_typing', ({ conversationId }) =>
    socket.to(`conv:${conversationId}`).emit('stop_typing', { userId }));

  // ── LIVESTREAM ──
  socket.on('start_stream', ({ title, thumbnail }, cb) => {
    const streamId = `stream:${userId}:${Date.now()}`;
    activeStreams.set(streamId, {
      id: streamId,
      host: { id:userId, username, avatar:socket.user.avatar },
      title, thumbnail: thumbnail||null,
      viewers: new Set(),
      startedAt: new Date(),
    });
    socket.join(streamId);
    socket.currentStreamId = streamId;
    io.emit('stream_started', {
      streamId, host:{ id:userId, username, avatar:socket.user.avatar },
      title, viewerCount:0,
    });
    cb({ streamId, success:true });
    console.log(`[Live] @${username} started: ${title}`);
  });

  socket.on('join_stream', ({ streamId }, cb) => {
    const stream = activeStreams.get(streamId);
    if (!stream) return cb({ error:'Stream không tồn tại' });
    socket.join(streamId);
    stream.viewers.add(userId);
    const viewerCount = stream.viewers.size;
    io.to(streamId).emit('viewer_count', { streamId, count:viewerCount });
    socket.to(streamId).emit('viewer_joined', { userId, username });
    cb({ streamId, host:stream.host, title:stream.title, viewerCount, startedAt:stream.startedAt });
  });

  socket.on('leave_stream', ({ streamId }) => {
    const stream = activeStreams.get(streamId);
    if (stream) { stream.viewers.delete(userId); socket.leave(streamId);
      io.to(streamId).emit('viewer_count', { streamId, count:stream.viewers.size }); }
  });

  socket.on('end_stream', ({ streamId }) => {
    const stream = activeStreams.get(streamId);
    if (!stream || String(stream.host.id) !== userId) return;
    io.to(streamId).emit('stream_ended', { streamId });
    activeStreams.delete(streamId);
    socket.currentStreamId = null;
    console.log(`[Live] @${username} ended stream`);
  });

  socket.on('stream_message', ({ streamId, text }) => {
    if (!text?.trim()) return;
    io.to(streamId).emit('stream_message', {
      user:{ id:userId, username, avatar:socket.user.avatar },
      text: text.slice(0,300), ts: new Date(),
    });
  });

  socket.on('stream_reaction', ({ streamId, emoji }) =>
    io.to(streamId).emit('stream_reaction', { userId, username, emoji }));

  socket.on('get_active_streams', (cb) => {
    const streams = Array.from(activeStreams.values()).map(s => ({
      id:s.id, host:s.host, title:s.title,
      viewerCount:s.viewers.size, startedAt:s.startedAt,
    }));
    cb({ streams });
  });

  // ── DISCONNECT ──
  socket.on('disconnect', () => {
    onlineUsers.delete(userId);
    io.emit('online_users', Array.from(onlineUsers.keys()));
    if (socket.currentStreamId) {
      io.to(socket.currentStreamId).emit('stream_ended',
        { streamId:socket.currentStreamId, reason:'host_disconnected' });
      activeStreams.delete(socket.currentStreamId);
      console.log(`[Live] @${username} disconnected, stream ended`);
    }
  });
});

// ── Error handlers ──
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 SocialShop v1.0.0 — http://localhost:${PORT}`);
  console.log(`🔌 Socket.io  : ws://localhost:${PORT}`);
  console.log(`📡 Livestream : socket events (start_stream, join_stream)\n`);
});

module.exports = { app, io };
