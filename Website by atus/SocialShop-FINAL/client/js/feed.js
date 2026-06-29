/* =========================================================
   SocialShop — feed.js  (Package 7)
   Kết nối Feed (index.html) với API thật.
   Phụ thuộc: config.js, app.js, auth.js (nạp trước)
   ========================================================= */

const Feed = (() => {
  const API = () => window.API_BASE_URL || 'http://localhost:5000/api';
  let page = 1;
  let loading = false;
  let hasMore = true;

  /* ── Helpers ── */
  function authHeader() {
    const token = localStorage.getItem('ss_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr);
    if (diff < 60000)   return 'vừa xong';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} ngày trước`;
    return new Date(dateStr).toLocaleDateString('vi-VN');
  }

  function avatarHtml(user, size = 36) {
    if (user?.avatar) {
      return `<img src="${user.avatar}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover" alt="${user.username}">`;
    }
    return `<span style="width:${size}px;height:${size}px;border-radius:50%;background:var(--grad);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${Math.floor(size*0.4)}px;color:#fff;flex-shrink:0">${(user?.username||'?')[0].toUpperCase()}</span>`;
  }

  /* ── Render một post ── */
  function renderPost(p) {
    const me = JSON.parse(localStorage.getItem('ss_user') || 'null');
    const liked = me && p.likes?.includes(me.id);
    const likeCount = p.likes?.length || 0;
    const commentCount = p.comments?.length || 0;

    const images = (p.images || []).map(url =>
      `<img src="${url}" class="post-image" alt="post image" loading="lazy" style="width:100%;border-radius:12px;margin-top:8px;max-height:400px;object-fit:cover">`
    ).join('');

    const commentsHtml = (p.comments || []).slice(0, 2).map(c => `
      <div class="comment-item" style="display:flex;gap:8px;align-items:flex-start;padding:6px 0">
        ${avatarHtml(c.user, 28)}
        <div style="background:var(--surface);border-radius:12px;padding:6px 10px;flex:1">
          <strong style="font-size:12px">${c.user?.username || 'User'}</strong>
          <span style="font-size:13px;margin-left:4px">${c.text}</span>
        </div>
      </div>`).join('');

    return `
    <article class="post card" data-id="${p._id}" style="animation:fadeUp .4s ease both">
      <div class="post-head">
        <a href="pages/profile.html?id=${p.author?._id}" style="display:flex;gap:10px;align-items:center;text-decoration:none;color:inherit">
          ${avatarHtml(p.author)}
          <div>
            <div style="font-weight:600;font-size:14px">${p.author?.fullName || p.author?.username || 'User'}</div>
            <div style="font-size:11px;color:var(--text-soft)">${timeAgo(p.createdAt)}</div>
          </div>
        </a>
        ${me && me.id === p.author?._id ? `<button onclick="deletePost('${p._id}',this)" style="margin-left:auto;background:none;border:none;cursor:pointer;color:var(--text-soft);font-size:18px">⋯</button>` : ''}
      </div>

      ${p.content ? `<p class="post-text" style="margin:10px 0;line-height:1.5">${p.content}</p>` : ''}
      ${images}

      <div class="post-actions" style="display:flex;gap:8px;margin-top:12px;padding-top:10px;border-top:1px solid var(--border)">
        <button class="action-btn ${liked ? 'liked' : ''}" onclick="Feed.toggleLike('${p._id}',this)" style="display:flex;align-items:center;gap:5px;padding:6px 12px;border-radius:20px;border:none;cursor:pointer;background:${liked?'rgba(255,75,75,.15)':'var(--surface)'};color:${liked?'#ff4b4b':'var(--text)'};font-size:13px;transition:.2s">
          ${liked ? '❤️' : '🤍'} <span class="like-count">${formatCount(likeCount)}</span>
        </button>
        <button class="action-btn" onclick="Feed.openComments('${p._id}')" style="display:flex;align-items:center;gap:5px;padding:6px 12px;border-radius:20px;border:none;cursor:pointer;background:var(--surface);color:var(--text);font-size:13px">
          💬 <span>${formatCount(commentCount)}</span>
        </button>
        <button class="action-btn" onclick="Feed.sharePost('${p._id}')" style="display:flex;align-items:center;gap:5px;padding:6px 12px;border-radius:20px;border:none;cursor:pointer;background:var(--surface);color:var(--text);font-size:13px">
          ↗️ <span>${formatCount(p.shares||0)}</span>
        </button>
      </div>

      ${commentsHtml ? `
      <div class="comment-list" style="margin-top:8px" id="comments-${p._id}">
        ${commentsHtml}
        ${commentCount > 2 ? `<button onclick="Feed.loadMoreComments('${p._id}')" style="font-size:12px;color:var(--primary);background:none;border:none;cursor:pointer;padding:4px 0">Xem thêm ${commentCount - 2} bình luận...</button>` : ''}
      </div>` : `<div class="comment-list" id="comments-${p._id}"></div>`}

      <div class="comment-input-row" style="display:flex;gap:8px;margin-top:8px;align-items:center">
        ${avatarHtml(me, 30)}
        <input type="text" placeholder="Viết bình luận..." data-post="${p._id}"
          style="flex:1;background:var(--surface);border:none;border-radius:20px;padding:8px 14px;font-size:13px;color:var(--text);outline:none"
          onkeydown="if(event.key==='Enter')Feed.addComment('${p._id}',this)">
      </div>
    </article>`;
  }

  /* ── Load feed ── */
  async function loadFeed(reset = false) {
    if (loading || (!hasMore && !reset)) return;
    if (reset) { page = 1; hasMore = true; }
    loading = true;

    const feedEl = document.getElementById('feedContent');
    const skelEl = document.getElementById('feedSkeleton');
    if (!feedEl) return;

    try {
      const res = await fetch(`${API()}/posts?page=${page}&limit=8`, {
        headers: { ...authHeader() }
      });
      const data = await res.json();
      const posts = data.posts || [];
      hasMore = data.hasMore;

      if (skelEl) skelEl.style.display = 'none';
      feedEl.classList.remove('hidden');

      if (reset) feedEl.innerHTML = '';

      if (posts.length === 0 && page === 1) {
        feedEl.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-soft)">
          <div style="font-size:48px;margin-bottom:12px">📭</div>
          <div style="font-weight:600">Chưa có bài viết nào</div>
          <div style="font-size:13px;margin-top:6px">Hãy là người đầu tiên đăng bài!</div>
        </div>`;
        return;
      }

      const html = posts.map(renderPost).join('');
      feedEl.insertAdjacentHTML('beforeend', html);
      page++;
    } catch (err) {
      console.error('Feed error:', err);
      if (skelEl) skelEl.style.display = 'none';
      feedEl.classList.remove('hidden');
      // Show demo posts if API fails
      if (page === 1) feedEl.innerHTML = renderDemoPosts();
    } finally {
      loading = false;
    }
  }

  /* ── Infinite scroll ── */
  function setupInfiniteScroll() {
    window.addEventListener('scroll', () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      if (scrollTop + clientHeight >= scrollHeight - 200) {
        loadFeed();
      }
    });
  }

  /* ── Toggle like ── */
  async function toggleLike(postId, btn) {
    const me = JSON.parse(localStorage.getItem('ss_user') || 'null');
    if (!me) { toast('Vui lòng đăng nhập để thích bài viết', 'accent'); return; }

    const liked = btn.classList.toggle('liked');
    const countEl = btn.querySelector('.like-count');
    let n = parseInt(countEl.textContent.replace(/[^0-9]/g, ''), 10) || 0;
    countEl.textContent = formatCount(liked ? n + 1 : Math.max(0, n - 1));
    btn.innerHTML = `${liked ? '❤️' : '🤍'} <span class="like-count">${countEl.textContent}</span>`;
    btn.style.background = liked ? 'rgba(255,75,75,.15)' : 'var(--surface)';
    btn.style.color = liked ? '#ff4b4b' : 'var(--text)';

    try {
      await fetch(`${API()}/posts/${postId}/like`, {
        method: 'POST',
        headers: { ...authHeader() }
      });
    } catch {}
  }

  /* ── Add comment ── */
  async function addComment(postId, input) {
    const text = input.value.trim();
    if (!text) return;
    const me = JSON.parse(localStorage.getItem('ss_user') || 'null');
    if (!me) { toast('Vui lòng đăng nhập', 'accent'); return; }

    input.value = '';
    const commentList = document.getElementById(`comments-${postId}`);

    // Optimistic render
    const tempHtml = `
      <div class="comment-item" style="display:flex;gap:8px;align-items:flex-start;padding:6px 0">
        ${avatarHtml(me, 28)}
        <div style="background:var(--surface);border-radius:12px;padding:6px 10px;flex:1">
          <strong style="font-size:12px">${me.username}</strong>
          <span style="font-size:13px;margin-left:4px">${text}</span>
        </div>
      </div>`;
    commentList.insertAdjacentHTML('beforeend', tempHtml);

    try {
      await fetch(`${API()}/posts/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ text })
      });
    } catch {}
  }

  /* ── Open comments (load all) ── */
  async function openComments(postId) {
    try {
      const res = await fetch(`${API()}/posts/${postId}`, { headers: authHeader() });
      const data = await res.json();
      const commentList = document.getElementById(`comments-${postId}`);
      const me = JSON.parse(localStorage.getItem('ss_user') || 'null');
      commentList.innerHTML = (data.post?.comments || []).map(c => `
        <div style="display:flex;gap:8px;align-items:flex-start;padding:6px 0">
          ${avatarHtml(c.user, 28)}
          <div style="background:var(--surface);border-radius:12px;padding:6px 10px;flex:1">
            <strong style="font-size:12px">${c.user?.username || 'User'}</strong>
            <span style="font-size:13px;margin-left:4px">${c.text}</span>
          </div>
        </div>`).join('');
    } catch {}
  }

  /* ── Share ── */
  async function sharePost(postId) {
    const url = `${window.location.origin}${window.location.pathname}#post-${postId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'SocialShop', url });
      } else {
        await navigator.clipboard.writeText(url);
        toast('Đã sao chép link bài viết!', 'success');
      }
    } catch {
      toast('Đã sao chép link bài viết!', 'success');
    }
    try {
      await fetch(`${API()}/posts/${postId}/share`, {
        method: 'POST', headers: authHeader()
      });
    } catch {}
  }

  /* ── Delete post ── */
  async function deletePost(postId, btn) {
    if (!confirm('Xóa bài viết này?')) return;
    try {
      const res = await fetch(`${API()}/posts/${postId}`, {
        method: 'DELETE', headers: authHeader()
      });
      if (res.ok) {
        btn.closest('article').remove();
        toast('Đã xóa bài viết', 'success');
      }
    } catch { toast('Xóa thất bại', 'accent'); }
  }

  /* ── Create post ── */
  async function createPost(content, images = []) {
    const me = JSON.parse(localStorage.getItem('ss_user') || 'null');
    if (!me) { toast('Vui lòng đăng nhập', 'accent'); return; }
    if (!content.trim() && images.length === 0) { toast('Nhập nội dung hoặc chọn ảnh', 'accent'); return; }

    try {
      const res = await fetch(`${API()}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ content, images, visibility: 'public' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast('Đã đăng bài!', 'success');
      // Prepend new post
      const feedEl = document.getElementById('feedContent');
      if (feedEl) feedEl.insertAdjacentHTML('afterbegin', renderPost(data.post));
      return true;
    } catch (err) {
      toast(err.message || 'Đăng bài thất bại', 'accent');
      return false;
    }
  }

  /* ── Load stories ── */
  async function loadStories() {
    const storyBar = document.querySelector('.story-bar');
    if (!storyBar) return;
    try {
      const res = await fetch(`${API()}/stories`, { headers: authHeader() });
      const data = await res.json();
      const stories = data.stories || [];
      if (!stories.length) return;
      // Prepend after "Tạo story" item
      const createItem = storyBar.querySelector('.story.add');
      stories.forEach(s => {
        const div = document.createElement('div');
        div.className = 'story';
        div.style.cursor = 'pointer';
        div.onclick = () => window.location.href = `pages/story-viewer.html?storyId=${s._id}`;
        div.innerHTML = `
          <div class="story-ring${s._seen ? ' seen' : ''}">
            ${s.author?.avatar ? `<img src="${s.author.avatar}" alt="">` : `<span style="color:#fff;font-weight:700">${(s.author?.username||'?')[0].toUpperCase()}</span>`}
          </div>
          <span class="name">${s.author?.username || 'User'}</span>`;
        if (createItem) createItem.after(div);
        else storyBar.querySelector('.story-bar') ? storyBar.appendChild(div) : null;
      });
    } catch {}
  }

  /* ── Demo fallback (khi API chưa có dữ liệu) ── */
  function renderDemoPosts() {
    const demo = [
      { _id:'d1', author:{ username:'SocialShop', fullName:'SocialShop Team' }, content:'🎉 Chào mừng đến với SocialShop! Nền tảng kết hợp mạng xã hội & thương mại điện tử. Hãy đăng nhập và bắt đầu khám phá!', likes:[], comments:[], shares:42, createdAt: new Date().toISOString() },
    ];
    return demo.map(renderPost).join('');
  }

  /* ── Setup create post UI ── */
  function setupCreatePost() {
    const composeArea = document.getElementById('createPostArea');
    if (!composeArea) return;
    composeArea.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter' && e.ctrlKey) {
        const ok = await createPost(composeArea.value);
        if (ok) composeArea.value = '';
      }
    });
  }

  /* ── Init ── */
  function init() {
    loadFeed(true);
    loadStories();
    setupInfiniteScroll();
    setupCreatePost();
  }

  return { init, loadFeed, toggleLike, addComment, openComments, sharePost, deletePost, createPost };
})();

window.addEventListener('DOMContentLoaded', () => {
  // Chỉ chạy trên trang index
  if (document.getElementById('feedContent') || document.getElementById('feedSkeleton')) {
    Feed.init();
  }
});
