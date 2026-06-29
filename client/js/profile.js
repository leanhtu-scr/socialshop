/* =========================================================
   SocialShop — profile.js  (Package 7)
   Kết nối profile.html với API user + posts thật.
   ========================================================= */

const Profile = (() => {
  const API = () => window.API_BASE_URL || 'http://localhost:5000/api';

  function authHeader() {
    const token = localStorage.getItem('ss_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  function formatCount(n) {
    if (n >= 1000) return (n/1000).toFixed(1).replace('.0','') + 'k';
    return String(n || 0);
  }

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr);
    if (diff < 3600000) return `${Math.floor(diff/60000)} phút`;
    if (diff < 86400000) return `${Math.floor(diff/3600000)} giờ`;
    return `${Math.floor(diff/86400000)} ngày`;
  }

  /* ── Get target user ── */
  function getTargetUsername() {
    const params = new URLSearchParams(location.search);
    return params.get('username') || params.get('id') || null;
  }

  /* ── Load profile data ── */
  async function loadProfile() {
    const me = JSON.parse(localStorage.getItem('ss_user') || 'null');
    const targetParam = getTargetUsername();

    // If no param, show own profile
    const endpoint = targetParam
      ? (targetParam.startsWith('6') && targetParam.length === 24
          ? `${API()}/users/${targetParam}`
          : `${API()}/users/${targetParam}`)
      : `${API()}/auth/me`;

    try {
      const res = await fetch(endpoint, { headers: authHeader() });
      const data = await res.json();
      const user = data.user || data;

      renderProfileUI(user, me);
      loadUserPosts(user.username || user.id);
    } catch (err) {
      console.error('Profile load error:', err);
      // Fallback to localStorage
      if (me) renderProfileUI(me, me);
    }
  }

  /* ── Render profile UI ── */
  function renderProfileUI(user, me) {
    const isOwn = !getTargetUsername() || (me && (me.id === user.id || me.id === user._id));

    // Name & handle
    const nameEl = document.querySelector('.profile-name');
    const handleEl = document.querySelector('.profile-handle');
    const bioEl = document.querySelector('.profile-bio');
    if (nameEl) nameEl.textContent = user.fullName || user.username || 'User';
    if (handleEl) handleEl.textContent = `@${user.username || 'user'}`;
    if (bioEl && user.bio) bioEl.textContent = user.bio;

    // Counts
    const postCountEl = document.querySelector('[data-count="posts"]');
    const followerEl = document.querySelector('[data-count="followers"]');
    const followingEl = document.querySelector('[data-count="following"]');
    if (postCountEl) postCountEl.textContent = formatCount(user.postsCount || 0);
    if (followerEl)  followerEl.textContent  = formatCount(user.followersCount || user.followers?.length || 0);
    if (followingEl) followingEl.textContent = formatCount(user.followingCount || user.following?.length || 0);

    // Avatar
    const avatarEl = document.getElementById('profileAvatarEl');
    if (avatarEl && user.avatar) {
      avatarEl.innerHTML = `<img src="${user.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" alt="avatar">`;
    } else if (avatarEl) {
      avatarEl.textContent = (user.username || 'U')[0].toUpperCase();
    }

    // Follow button
    const followBtn = document.getElementById('followBtn');
    if (followBtn) {
      if (isOwn) {
        followBtn.style.display = 'none';
        // Show edit profile button
        const editBtn = document.getElementById('editProfileBtn');
        if (editBtn) editBtn.style.display = '';
      } else {
        const isFollowing = me && user.followers?.includes(me.id);
        followBtn.textContent = isFollowing ? 'Đang theo dõi' : 'Theo dõi';
        followBtn.dataset.userId = user._id || user.id;
        followBtn.dataset.following = isFollowing ? 'true' : 'false';
      }
    }

    // Store for other functions
    window._profileUser = user;
  }

  /* ── Load user posts ── */
  async function loadUserPosts(usernameOrId) {
    const postsGrid = document.getElementById('userPostsGrid');
    if (!postsGrid) return;

    postsGrid.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-soft)">Đang tải...</div>`;

    try {
      const res = await fetch(`${API()}/users/${usernameOrId}/posts`, { headers: authHeader() });
      const data = await res.json();
      const posts = data.posts || [];

      if (!posts.length) {
        postsGrid.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-soft);grid-column:1/-1">
          <div style="font-size:40px;margin-bottom:8px">📝</div>
          <div>Chưa có bài đăng nào</div>
        </div>`;
        return;
      }

      postsGrid.innerHTML = posts.map(p => `
        <div onclick="window.location.href='../index.html#post-${p._id}'"
          style="aspect-ratio:1;border-radius:10px;overflow:hidden;cursor:pointer;position:relative;background:var(--surface-2)">
          ${p.images?.[0]
            ? `<img src="${p.images[0]}" style="width:100%;height:100%;object-fit:cover" loading="lazy">`
            : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;padding:12px;font-size:12px;color:var(--text-soft);line-height:1.4;overflow:hidden">${p.content?.substring(0,80) || '📝'}</div>`
          }
          <div style="position:absolute;bottom:0;left:0;right:0;padding:6px 8px;background:linear-gradient(transparent,rgba(0,0,0,.6));color:#fff;font-size:11px;display:flex;gap:8px">
            <span>❤️ ${formatCount(p.likes?.length || 0)}</span>
            <span>💬 ${formatCount(p.comments?.length || 0)}</span>
          </div>
        </div>`).join('');
    } catch {
      postsGrid.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-soft);grid-column:1/-1">Không thể tải bài đăng</div>`;
    }
  }

  /* ── Toggle follow ── */
  async function toggleFollow(btn) {
    const me = JSON.parse(localStorage.getItem('ss_user') || 'null');
    if (!me) { toast('Vui lòng đăng nhập', 'accent'); return; }

    const userId = btn.dataset.userId;
    const isFollowing = btn.dataset.following === 'true';

    // Optimistic
    btn.dataset.following = isFollowing ? 'false' : 'true';
    btn.textContent = isFollowing ? 'Theo dõi' : 'Đang theo dõi';

    // Update follower count
    const followerEl = document.querySelector('[data-count="followers"]');
    if (followerEl) {
      let n = parseInt(followerEl.textContent, 10) || 0;
      followerEl.textContent = formatCount(isFollowing ? Math.max(0, n-1) : n+1);
    }

    toast(isFollowing ? 'Đã bỏ theo dõi' : '✅ Đã theo dõi!', 'success');

    try {
      await fetch(`${API()}/users/${userId}/follow`, {
        method: 'POST', headers: authHeader()
      });
    } catch {}
  }

  /* ── Edit profile modal ── */
  function openEditProfile() {
    const user = JSON.parse(localStorage.getItem('ss_user') || '{}');
    const modal = document.getElementById('editProfileModal');
    if (!modal) {
      // Create simple modal inline
      const m = document.createElement('div');
      m.id = 'editProfileModal';
      m.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:1000;display:flex;align-items:flex-end;animation:fadeIn .2s';
      m.innerHTML = `
        <div style="background:var(--bg);border-radius:20px 20px 0 0;padding:24px;width:100%;max-width:480px;margin:0 auto">
          <h3 style="margin:0 0 16px;font-size:16px">Chỉnh sửa hồ sơ</h3>
          <input id="editFullName" placeholder="Tên hiển thị" value="${user.fullName||''}"
            style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:10px 12px;color:var(--text);font-size:14px;box-sizing:border-box;margin-bottom:10px">
          <textarea id="editBio" placeholder="Tiểu sử..." rows="3"
            style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:10px 12px;color:var(--text);font-size:14px;box-sizing:border-box;resize:none;margin-bottom:16px">${user.bio||''}</textarea>
          <div style="display:flex;gap:10px">
            <button onclick="document.getElementById('editProfileModal').remove()"
              style="flex:1;padding:12px;border-radius:10px;border:1px solid var(--border);background:var(--surface);color:var(--text);cursor:pointer;font-size:14px">Hủy</button>
            <button onclick="Profile.saveProfile()"
              style="flex:1;padding:12px;border-radius:10px;border:none;background:var(--grad);color:#fff;cursor:pointer;font-size:14px;font-weight:600">Lưu</button>
          </div>
        </div>`;
      document.body.appendChild(m);
    } else {
      modal.style.display = 'flex';
    }
  }

  async function saveProfile() {
    const fullName = document.getElementById('editFullName')?.value.trim();
    const bio = document.getElementById('editBio')?.value.trim();

    try {
      const res = await fetch(`${API()}/users/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ fullName, bio })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // Update localStorage
      const me = JSON.parse(localStorage.getItem('ss_user') || '{}');
      const updated = { ...me, fullName, bio };
      localStorage.setItem('ss_user', JSON.stringify(updated));

      // Update UI
      const nameEl = document.querySelector('.profile-name');
      const bioEl = document.querySelector('.profile-bio');
      if (nameEl && fullName) nameEl.textContent = fullName;
      if (bioEl) bioEl.textContent = bio || '';

      document.getElementById('editProfileModal')?.remove();
      toast('✅ Đã cập nhật hồ sơ!', 'success');
    } catch (err) {
      toast(err.message || 'Cập nhật thất bại', 'accent');
    }
  }

  /* ── Init ── */
  function init() {
    loadProfile();

    // Wire follow button
    const followBtn = document.getElementById('followBtn');
    if (followBtn) {
      followBtn.addEventListener('click', () => toggleFollow(followBtn));
    }

    // Wire edit button
    const editBtn = document.getElementById('editProfileBtn');
    if (editBtn) {
      editBtn.addEventListener('click', openEditProfile);
    }
  }

  return { init, loadProfile, toggleFollow, openEditProfile, saveProfile };
})();

window.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.profile-name') || document.getElementById('profileAvatarEl')) {
    Profile.init();
  }
});
