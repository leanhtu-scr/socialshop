/* =========================================================
   SocialShop — search-page.js  (Package 7)
   Tìm kiếm toàn cục: users, posts, products.
   ========================================================= */

const Search = (() => {
  const API = () => window.API_BASE_URL || 'http://localhost:5000/api';
  let currentTab = 'all';
  let searchTimer = null;
  let lastQuery = '';

  function authHeader() {
    const token = localStorage.getItem('ss_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  function formatPrice(n) {
    return Number(n).toLocaleString('vi-VN') + '₫';
  }

  function formatCount(n) {
    if (n >= 1000) return (n/1000).toFixed(1).replace('.0','') + 'k';
    return String(n || 0);
  }

  /* ── Render results ── */
  function renderUser(u) {
    const isFollowing = false; // TODO: check
    return `
    <div style="display:flex;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid var(--border)">
      <div onclick="window.location.href='profile.html?username=${u.username}'"
        style="cursor:pointer;display:flex;gap:12px;align-items:center;flex:1">
        ${u.avatar
          ? `<img src="${u.avatar}" style="width:48px;height:48px;border-radius:50%;object-fit:cover" alt="">`
          : `<div style="width:48px;height:48px;border-radius:50%;background:var(--grad);display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;flex-shrink:0">${(u.username||'?')[0].toUpperCase()}</div>`
        }
        <div>
          <div style="font-weight:600;font-size:14px">${u.fullName || u.username}</div>
          <div style="font-size:12px;color:var(--text-soft)">@${u.username} · ${formatCount(u.followersCount)} người theo dõi</div>
        </div>
      </div>
      <button onclick="Search.toggleFollow('${u._id}',this)"
        style="padding:6px 14px;border-radius:20px;border:1px solid var(--primary);background:none;color:var(--primary);font-size:13px;cursor:pointer;white-space:nowrap;transition:.2s">
        ${isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
      </button>
    </div>`;
  }

  function renderPost(p) {
    const hasImg = p.images?.length > 0;
    return `
    <div onclick="window.location.href='../index.html#post-${p._id}'"
      style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--border);cursor:pointer">
      ${hasImg ? `<img src="${p.images[0]}" style="width:72px;height:72px;border-radius:10px;object-fit:cover;flex-shrink:0" loading="lazy">` : ''}
      <div style="flex:1;min-width:0">
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:4px">
          <span style="font-weight:600;font-size:13px">@${p.author?.username || 'user'}</span>
        </div>
        <div style="font-size:13px;color:var(--text);line-height:1.4;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${p.content || ''}</div>
        <div style="font-size:11px;color:var(--text-soft);margin-top:4px">❤️ ${formatCount(p.likes?.length)} · 💬 ${formatCount(p.comments?.length)}</div>
      </div>
    </div>`;
  }

  function renderProduct(p) {
    return `
    <div onclick="window.location.href='product-detail.html?id=${p._id}'"
      style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--border);cursor:pointer">
      ${p.images?.[0]
        ? `<img src="${p.images[0]}" style="width:72px;height:72px;border-radius:10px;object-fit:cover;flex-shrink:0" loading="lazy">`
        : `<div style="width:72px;height:72px;border-radius:10px;background:var(--surface-2);display:flex;align-items:center;justify-content:center;font-size:32px;flex-shrink:0">📦</div>`
      }
      <div style="flex:1;min-width:0">
        <div style="font-weight:600;font-size:14px;margin-bottom:4px;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${p.name}</div>
        <div style="color:var(--primary);font-weight:700;font-size:15px">${formatPrice(p.price)}</div>
        <div style="font-size:11px;color:var(--text-soft);margin-top:2px">${p.sold ? formatCount(p.sold) + ' đã bán' : 'Mới'} · @${p.seller?.username || 'shop'}</div>
      </div>
    </div>`;
  }

  /* ── Execute search ── */
  async function doSearch(q) {
    if (!q.trim()) { clearResults(); return; }
    lastQuery = q;

    const resultEl = document.getElementById('searchResults');
    const skelEl = document.getElementById('searchSkeleton');
    if (!resultEl) return;

    if (skelEl) skelEl.style.display = '';
    resultEl.innerHTML = '';

    try {
      const params = new URLSearchParams({ q, type: currentTab, limit: 20 });
      const res = await fetch(`${API()}/search?${params}`, { headers: authHeader() });
      const data = await res.json();

      if (skelEl) skelEl.style.display = 'none';

      const users    = data.users    || [];
      const posts    = data.posts    || [];
      const products = data.products || [];
      const total    = users.length + posts.length + products.length;

      if (!total) {
        resultEl.innerHTML = `
          <div style="text-align:center;padding:48px 20px;color:var(--text-soft)">
            <div style="font-size:48px;margin-bottom:12px">🔍</div>
            <div style="font-weight:600;font-size:16px">Không tìm thấy kết quả</div>
            <div style="font-size:13px;margin-top:6px">Thử từ khóa khác nhé!</div>
          </div>`;
        return;
      }

      let html = '';

      if ((currentTab === 'all' || currentTab === 'users') && users.length) {
        html += `<div style="font-weight:700;font-size:13px;color:var(--text-soft);padding:12px 0 4px;text-transform:uppercase;letter-spacing:.5px">Người dùng</div>`;
        html += users.map(renderUser).join('');
      }

      if ((currentTab === 'all' || currentTab === 'posts') && posts.length) {
        html += `<div style="font-weight:700;font-size:13px;color:var(--text-soft);padding:16px 0 4px;text-transform:uppercase;letter-spacing:.5px">Bài đăng</div>`;
        html += posts.map(renderPost).join('');
      }

      if ((currentTab === 'all' || currentTab === 'products') && products.length) {
        html += `<div style="font-weight:700;font-size:13px;color:var(--text-soft);padding:16px 0 4px;text-transform:uppercase;letter-spacing:.5px">Sản phẩm</div>`;
        html += products.map(renderProduct).join('');
      }

      resultEl.innerHTML = html;
    } catch (err) {
      if (skelEl) skelEl.style.display = 'none';
      console.error('Search error:', err);
      resultEl.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-soft)">Lỗi tìm kiếm. Vui lòng thử lại.</div>`;
    }
  }

  function clearResults() {
    const resultEl = document.getElementById('searchResults');
    if (resultEl) resultEl.innerHTML = '';
    showSuggestions();
  }

  /* ── Show search suggestions when idle ── */
  function showSuggestions() {
    const resultEl = document.getElementById('searchResults');
    if (!resultEl) return;
    resultEl.innerHTML = `
      <div style="padding:12px 0">
        <div style="font-weight:700;font-size:13px;color:var(--text-soft);margin-bottom:10px;text-transform:uppercase;letter-spacing:.5px">Gợi ý tìm kiếm</div>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          ${['👗 Thời trang', '📱 Điện thoại', '🍜 Đồ ăn', '💄 Làm đẹp', '📚 Sách', '⚽ Thể thao'].map(s =>
            `<button onclick="Search.quickSearch('${s.replace(/[^a-zA-ZÀ-ỹ ]/gu, '').trim()}')"
              style="padding:6px 14px;border-radius:20px;border:1px solid var(--border);background:var(--surface);color:var(--text);font-size:13px;cursor:pointer">${s}</button>`
          ).join('')}
        </div>
      </div>`;
  }

  function quickSearch(q) {
    const input = document.getElementById('searchInput') || document.querySelector('input[data-search]');
    if (input) { input.value = q; input.focus(); }
    doSearch(q);
  }

  /* ── Toggle follow from search results ── */
  async function toggleFollow(userId, btn) {
    const me = JSON.parse(localStorage.getItem('ss_user') || 'null');
    if (!me) { toast('Vui lòng đăng nhập', 'accent'); return; }

    const isFollowing = btn.textContent.trim() === 'Đang theo dõi';
    btn.textContent = isFollowing ? 'Theo dõi' : 'Đang theo dõi';
    toast(isFollowing ? 'Đã bỏ theo dõi' : '✅ Đã theo dõi!', 'success');

    try {
      await fetch(`${API()}/users/${userId}/follow`, {
        method: 'POST', headers: authHeader()
      });
    } catch {}
  }

  /* ── Switch tab ── */
  function switchTab(el, tab) {
    document.querySelectorAll('.search-tab, .stab').forEach(t => t.classList.remove('active'));
    if (el) el.classList.add('active');
    currentTab = tab;
    if (lastQuery) doSearch(lastQuery);
  }

  /* ── Init ── */
  function init() {
    const input = document.getElementById('searchInput') || document.querySelector('input[data-search]');
    if (input) {
      input.addEventListener('input', e => {
        clearTimeout(searchTimer);
        const q = e.target.value.trim();
        if (!q) { clearResults(); return; }
        searchTimer = setTimeout(() => doSearch(q), 350);
      });

      // Auto-search if query in URL
      const urlQ = new URLSearchParams(location.search).get('q');
      if (urlQ) { input.value = urlQ; doSearch(urlQ); }
      else showSuggestions();

      input.focus();
    }
  }

  return { init, doSearch, switchTab, toggleFollow, quickSearch };
})();

window.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('searchResults') || document.getElementById('searchSkeleton')) {
    Search.init();
  }
});
