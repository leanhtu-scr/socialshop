/* =========================================================
   SocialShop — notifications.js  (Package 7)
   Quản lý thông báo real-time qua Socket.io + REST API.
   ========================================================= */

const Notifs = (() => {
  const API = () => window.API_BASE_URL || 'http://localhost:5000/api';
  let socket = null;
  let unreadCount = 0;

  function authHeader() {
    const token = localStorage.getItem('ss_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /* ── Connect Socket for real-time notifs ── */
  function connectSocket() {
    const token = localStorage.getItem('ss_token');
    if (!token) return;
    if (typeof io === 'undefined') return;

    const serverUrl = (window.API_BASE_URL || 'http://localhost:5000/api').replace('/api', '');
    socket = io(serverUrl, { auth: { token }, transports: ['websocket', 'polling'] });

    socket.on('connect', () => console.log('[Notifs] socket connected'));

    socket.on('new_notification', (notif) => {
      unreadCount++;
      updateBadge();
      showBrowserNotif(notif);
      // If on notifications page, prepend
      const list = document.getElementById('notifList');
      if (list && notif) {
        list.insertAdjacentHTML('afterbegin', renderNotifItem({ ...notif, read: false }, 0));
      }
    });

    socket.on('disconnect', () => console.log('[Notifs] disconnected'));
  }

  /* ── Fetch unread count for badge ── */
  async function fetchUnreadCount() {
    try {
      const res = await fetch(`${API()}/notifications?limit=1`, { headers: authHeader() });
      if (!res.ok) return;
      const data = await res.json();
      unreadCount = data.unreadCount || 0;
      updateBadge();
    } catch {}
  }

  /* ── Update badge on bottom nav ── */
  function updateBadge() {
    const badges = document.querySelectorAll('.notif-badge, [data-notif-badge]');
    badges.forEach(b => {
      b.textContent = unreadCount > 99 ? '99+' : (unreadCount || '');
      b.style.display = unreadCount > 0 ? '' : 'none';
    });
  }

  /* ── Browser push notification ── */
  function showBrowserNotif(notif) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    new Notification(`SocialShop — ${notif.actor?.username || 'Thông báo'}`, {
      body: notif.content || '',
      icon: '/client/assets/icons/icon-192.png',
    });
  }

  async function requestPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }

  /* ── Render one notification item ── */
  function renderNotifItem(n, delay = 0) {
    const icons = { like:'❤️', comment:'💬', follow:'👤', order:'📦', system:'⚙️', message:'💬' };
    const colors = { like:'#ff4b4b', comment:'#7C5CFC', follow:'#22c55e', order:'#f59e0b', system:'#64748b', message:'#3b82f6' };
    const initial = (n.actor?.username || 'S')[0].toUpperCase();

    return `
    <div class="notif-item${n.read ? '' : ' unread'}"
      onclick="Notifs.handleClick('${n._id}','${n.type}','${n.postId||''}','${n.orderId||''}')"
      style="animation-delay:${delay}ms">
      <div class="notif-avatar" style="position:relative">
        ${n.actor?.avatar
          ? `<img src="${n.actor.avatar}" style="width:44px;height:44px;border-radius:50%;object-fit:cover" alt="">`
          : `<div style="width:44px;height:44px;border-radius:50%;background:var(--grad);display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff">${initial}</div>`
        }
        <div style="position:absolute;bottom:-2px;right:-2px;width:18px;height:18px;border-radius:50%;background:${colors[n.type]||'#64748b'};border:2px solid var(--bg);display:flex;align-items:center;justify-content:center;font-size:9px">
          ${icons[n.type] || '🔔'}
        </div>
      </div>
      <div class="notif-content" style="flex:1;min-width:0">
        <div style="font-size:13px;line-height:1.4">
          <strong>${n.actor?.username || 'SocialShop'}</strong> ${n.content}
        </div>
        <div style="font-size:11px;color:var(--text-soft);margin-top:2px">${formatTime(n.createdAt)}</div>
        ${n.type === 'follow' ? `
          <div style="display:flex;gap:8px;margin-top:6px">
            <button onclick="event.stopPropagation();Notifs.followBack('${n.actor?._id||''}',this)"
              style="padding:5px 12px;border-radius:6px;border:none;background:var(--primary);color:#fff;font-size:12px;cursor:pointer">Theo dõi lại</button>
          </div>` : ''}
      </div>
      ${!n.read ? `<div style="width:8px;height:8px;border-radius:50%;background:var(--primary);flex-shrink:0;margin-top:4px"></div>` : ''}
    </div>`;
  }

  function formatTime(date) {
    if (!date) return '';
    const d = new Date(date);
    const diff = Date.now() - d;
    if (diff < 60000) return 'vừa xong';
    if (diff < 3600000) return `${Math.floor(diff/60000)} phút trước`;
    if (diff < 86400000) return `${Math.floor(diff/3600000)} giờ trước`;
    if (diff < 604800000) return `${Math.floor(diff/86400000)} ngày trước`;
    return d.toLocaleDateString('vi-VN');
  }

  /* ── Handle notification click ── */
  async function handleClick(id, type, postId, orderId) {
    // Mark read
    try {
      await fetch(`${API()}/notifications/${id}/read`, {
        method: 'PATCH', headers: authHeader()
      });
    } catch {}
    if (unreadCount > 0) { unreadCount--; updateBadge(); }

    // Navigate
    if (type === 'order' && orderId) window.location.href = `order-detail.html?id=${orderId}`;
    else if (type === 'follow') window.location.href = `../index.html`;
    else if (postId) window.location.href = `../index.html#post-${postId}`;
  }

  /* ── Mark all read ── */
  async function markAllRead() {
    try {
      await fetch(`${API()}/notifications/read-all`, {
        method: 'PATCH', headers: authHeader()
      });
      unreadCount = 0;
      updateBadge();
      document.querySelectorAll('.notif-item.unread').forEach(el => el.classList.remove('unread'));
      toast('Đã đọc tất cả thông báo ✓', 'success');
    } catch {}
  }

  /* ── Follow back ── */
  async function followBack(userId, btn) {
    try {
      await fetch(`${API()}/users/${userId}/follow`, {
        method: 'POST', headers: authHeader()
      });
      btn.textContent = 'Đã theo dõi';
      btn.disabled = true;
      toast('✅ Đã theo dõi lại!', 'success');
    } catch {
      toast('Đã theo dõi lại!', 'success');
    }
  }

  /* ── Init (called on any page for badge) ── */
  async function init() {
    const me = JSON.parse(localStorage.getItem('ss_user') || 'null');
    if (!me) return;

    await fetchUnreadCount();
    connectSocket();
    requestPermission();
  }

  return { init, handleClick, markAllRead, followBack, renderNotifItem, updateBadge };
})();

window.addEventListener('DOMContentLoaded', () => {
  Notifs.init();
});
