/* =========================================================
   SocialShop — chat.js  (Package 7)
   Real-time chat với Socket.io. Dùng cho chat.html.
   ========================================================= */

const Chat = (() => {
  const API = () => window.API_BASE_URL || 'http://localhost:5000/api';
  let socket = null;
  let currentConvId = null;
  let me = null;
  let onlineUsers = [];

  function authHeader() {
    const token = localStorage.getItem('ss_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  function formatTime(date) {
    return new Date(date).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }

  /* ── Connect Socket ── */
  function connect() {
    me = JSON.parse(localStorage.getItem('ss_user') || 'null');
    const token = localStorage.getItem('ss_token');
    if (!me || !token) {
      window.location.href = 'login.html';
      return;
    }

    const serverUrl = (window.API_BASE_URL || 'http://localhost:5000/api').replace('/api', '');
    socket = io(serverUrl, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('[Chat] Connected');
      loadConversations();
    });

    socket.on('connect_error', (err) => {
      console.error('[Chat] connect error:', err.message);
      toast('Không thể kết nối chat. Thử lại...', 'accent');
    });

    socket.on('online_users', (users) => {
      onlineUsers = users;
      updateOnlineStatus();
    });

    socket.on('new_message', (msg) => {
      if (msg.conversation === currentConvId) {
        appendMessage(msg, true);
        scrollToBottom();
        markConvRead(currentConvId);
      } else {
        // Update unread badge on conv list
        updateConvUnread(msg.conversation);
        if (typeof toast === 'function') toast(`💬 Tin nhắn mới`, 'success');
      }
    });

    socket.on('conversation_started', ({ conversationId }) => {
      currentConvId = conversationId;
      socket.emit('join_conversation', conversationId);
      loadMessages(conversationId);
    });

    socket.on('disconnect', () => console.log('[Chat] Disconnected'));
  }

  /* ── Load conversations ── */
  async function loadConversations() {
    const convList = document.getElementById('convList');
    if (!convList) return;
    convList.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-soft)">Đang tải...</div>`;

    try {
      const res = await fetch(`${API()}/messages/conversations`, { headers: authHeader() });
      const data = await res.json();
      const convs = data.conversations || [];

      if (!convs.length) {
        convList.innerHTML = `<div style="padding:24px;text-align:center;color:var(--text-soft)">
          <div style="font-size:36px;margin-bottom:8px">💬</div>
          <div style="font-weight:600;font-size:14px">Chưa có cuộc trò chuyện</div>
          <div style="font-size:12px;margin-top:4px">Tìm bạn bè và bắt đầu chat!</div>
        </div>`;
        return;
      }

      convList.innerHTML = convs.map(c => {
        const other = c.participants?.find(p => String(p._id) !== String(me?.id));
        const initial = (other?.username || '?')[0].toUpperCase();
        const isOnline = onlineUsers.includes(String(other?._id));
        const lastText = c.lastMessage?.text || '...';
        return `
        <div class="conv-item" data-conv="${c._id}" onclick="Chat.openConversation('${c._id}')"
          style="display:flex;gap:12px;padding:12px 16px;cursor:pointer;border-bottom:1px solid var(--border);align-items:center;transition:.15s">
          <div style="position:relative;flex-shrink:0">
            ${other?.avatar
              ? `<img src="${other.avatar}" style="width:48px;height:48px;border-radius:50%;object-fit:cover">`
              : `<div style="width:48px;height:48px;border-radius:50%;background:var(--grad);display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff">${initial}</div>`
            }
            ${isOnline ? `<div style="position:absolute;bottom:0;right:0;width:12px;height:12px;border-radius:50%;background:#22c55e;border:2px solid var(--bg)"></div>` : ''}
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-weight:600;font-size:14px">${other?.fullName || other?.username || 'User'}</div>
            <div style="font-size:12px;color:var(--text-soft);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${lastText.substring(0,40)}</div>
          </div>
          ${c.unreadCount > 0 ? `<div style="background:var(--primary);color:#fff;border-radius:50%;min-width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700">${c.unreadCount}</div>` : ''}
        </div>`;
      }).join('');
    } catch (err) {
      console.error(err);
      convList.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-soft)">Không thể tải cuộc trò chuyện</div>`;
    }
  }

  /* ── Open / create conversation ── */
  async function openConversation(convId) {
    currentConvId = convId;
    socket?.emit('join_conversation', convId);

    // Mark active
    document.querySelectorAll('.conv-item').forEach(el => el.style.background = '');
    const activeEl = document.querySelector(`[data-conv="${convId}"]`);
    if (activeEl) activeEl.style.background = 'var(--surface)';

    loadMessages(convId);

    // Show chat panel on mobile
    const chatPanel = document.getElementById('chatPanel');
    const convPanel = document.getElementById('convPanel');
    if (chatPanel) chatPanel.style.display = 'flex';
    if (convPanel && window.innerWidth < 640) convPanel.style.display = 'none';
  }

  async function startConversationWith(userId) {
    socket?.emit('start_conversation', { userId });
  }

  /* ── Load messages ── */
  async function loadMessages(convId) {
    const msgArea = document.getElementById('messageArea');
    if (!msgArea) return;
    msgArea.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-soft)">Đang tải...</div>`;

    const sendBtn = document.getElementById('msgSendBtn');
    const msgInput = document.getElementById('msgInput');
    if (sendBtn) sendBtn.disabled = false;
    if (msgInput) msgInput.disabled = false;

    try {
      const res = await fetch(`${API()}/messages/${convId}`, { headers: authHeader() });
      const data = await res.json();
      const messages = data.messages || [];

      if (!messages.length) {
        msgArea.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-soft)">
          <div style="font-size:40px;margin-bottom:8px">👋</div>
          <div>Hãy bắt đầu cuộc trò chuyện!</div>
        </div>`;
        return;
      }

      msgArea.innerHTML = '';
      messages.forEach(m => appendMessage(m, false));
      scrollToBottom();
      markConvRead(convId);
    } catch {
      msgArea.innerHTML = `<div style="padding:20px;text-align:center;color:var(--text-soft)">Không thể tải tin nhắn</div>`;
    }
  }

  /* ── Append message to UI ── */
  function appendMessage(msg, animate = true) {
    const msgArea = document.getElementById('messageArea');
    if (!msgArea) return;

    // Remove empty placeholder
    const placeholder = msgArea.querySelector('[style*="40px"]');
    if (placeholder) placeholder.remove();

    const isMe = String(msg.sender?._id || msg.sender) === String(me?.id);
    const initial = (msg.sender?.username || '?')[0].toUpperCase();

    const div = document.createElement('div');
    div.style.cssText = `display:flex;gap:8px;margin:8px 0;${isMe ? 'flex-direction:row-reverse' : ''}${animate ? ';animation:fadeUp .2s ease' : ''}`;
    div.innerHTML = `
      ${!isMe ? `<div style="width:32px;height:32px;border-radius:50%;background:var(--grad);display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:13px;flex-shrink:0;align-self:flex-end">${initial}</div>` : ''}
      <div style="max-width:70%">
        ${msg.image ? `<img src="${msg.image}" style="max-width:200px;border-radius:12px;margin-bottom:4px;display:block" loading="lazy">` : ''}
        ${msg.text ? `<div style="background:${isMe ? 'var(--primary)' : 'var(--surface)'};color:${isMe ? '#fff' : 'var(--text)'};border-radius:${isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px'};padding:10px 14px;font-size:14px;line-height:1.4;word-break:break-word">${msg.text}</div>` : ''}
        <div style="font-size:10px;color:var(--text-soft);margin-top:2px;${isMe ? 'text-align:right' : ''}">${formatTime(msg.createdAt || new Date())}</div>
      </div>`;
    msgArea.appendChild(div);
  }

  /* ── Send message ── */
  function sendMessage() {
    const input = document.getElementById('msgInput');
    const text = input?.value.trim();
    if (!text || !currentConvId || !socket) return;
    input.value = '';

    // Optimistic render
    appendMessage({ sender: { _id: me?.id, username: me?.username }, text, createdAt: new Date() }, true);
    scrollToBottom();

    socket.emit('send_message', { conversationId: currentConvId, text });
  }

  /* ── Scroll to bottom ── */
  function scrollToBottom() {
    const msgArea = document.getElementById('messageArea');
    if (msgArea) msgArea.scrollTop = msgArea.scrollHeight;
  }

  /* ── Update online status dots ── */
  function updateOnlineStatus() {
    document.querySelectorAll('[data-user-status]').forEach(el => {
      const userId = el.dataset.userStatus;
      el.style.background = onlineUsers.includes(userId) ? '#22c55e' : 'var(--text-soft)';
    });
  }

  /* ── Update unread badge ── */
  function updateConvUnread(convId) {
    const convEl = document.querySelector(`[data-conv="${convId}"]`);
    if (!convEl) return;
    let badge = convEl.querySelector('.unread-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.className = 'unread-badge';
      badge.style.cssText = 'background:var(--primary);color:#fff;border-radius:50%;min-width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700';
      convEl.appendChild(badge);
    }
    const n = (parseInt(badge.textContent, 10) || 0) + 1;
    badge.textContent = n;
  }

  function markConvRead(convId) {
    const convEl = document.querySelector(`[data-conv="${convId}"] .unread-badge`);
    if (convEl) convEl.remove();
  }

  /* ── Back button (mobile) ── */
  function goBack() {
    const chatPanel = document.getElementById('chatPanel');
    const convPanel = document.getElementById('convPanel');
    if (chatPanel) chatPanel.style.display = 'none';
    if (convPanel) convPanel.style.display = '';
    currentConvId = null;
  }

  /* ── Search users to start chat ── */
  async function searchUsersToChat(q) {
    if (!q.trim()) return;
    try {
      const res = await fetch(`${API()}/search?q=${encodeURIComponent(q)}&type=users`, { headers: authHeader() });
      const data = await res.json();
      const users = data.users || [];
      const resultEl = document.getElementById('userSearchResults');
      if (!resultEl) return;
      resultEl.innerHTML = users.slice(0, 5).map(u => `
        <div onclick="Chat.startConversationWith('${u._id}')"
          style="display:flex;gap:10px;padding:10px;cursor:pointer;border-radius:10px;transition:.15s"
          onmouseover="this.style.background='var(--surface)'" onmouseout="this.style.background=''">
          <div style="width:36px;height:36px;border-radius:50%;background:var(--grad);display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff">
            ${(u.username||'?')[0].toUpperCase()}
          </div>
          <div>
            <div style="font-weight:600;font-size:13px">${u.fullName || u.username}</div>
            <div style="font-size:11px;color:var(--text-soft)">@${u.username}</div>
          </div>
        </div>`).join('');
    } catch {}
  }

  /* ── Init ── */
  function init() {
    connect();

    // Wire send button
    const sendBtn = document.getElementById('msgSendBtn');
    const msgInput = document.getElementById('msgInput');
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (msgInput) {
      msgInput.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
      });
      msgInput.addEventListener('input', () => {
        const sendBtn = document.getElementById('msgSendBtn');
        if (sendBtn) sendBtn.disabled = !msgInput.value.trim();
      });
    }
  }

  return { init, openConversation, startConversationWith, sendMessage, goBack, searchUsersToChat };
})();

window.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('messageArea') || document.getElementById('convList')) {
    Chat.init();
  }
});
