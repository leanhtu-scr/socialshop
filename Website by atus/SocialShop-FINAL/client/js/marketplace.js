/* =========================================================
   SocialShop — marketplace.js  (Package 7)
   Kết nối marketplace.html với API sản phẩm thật.
   ========================================================= */

const Market = (() => {
  const API = () => window.API_BASE_URL || 'http://localhost:5000/api';
  let currentCategory = '';
  let currentSort = 'newest';
  let currentPage = 1;
  let loading = false;
  let hasMore = true;

  function authHeader() {
    const token = localStorage.getItem('ss_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  function formatPrice(n) {
    return Number(n).toLocaleString('vi-VN') + '₫';
  }

  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr);
    if (diff < 3600000) return `${Math.floor(diff/60000)} phút trước`;
    if (diff < 86400000) return `${Math.floor(diff/3600000)} giờ trước`;
    return `${Math.floor(diff/86400000)} ngày trước`;
  }

  /* ── Render product card ── */
  function renderCard(p) {
    const img = p.images?.[0] || '';
    const stars = '⭐'.repeat(Math.round(p.rating || 5));
    const soldText = p.sold ? `${formatCount(p.sold)} đã bán` : 'Mới đăng';
    return `
    <div class="product-card card" style="cursor:pointer;overflow:hidden;transition:.2s;animation:fadeUp .4s ease both"
      onclick="window.location.href='product-detail.html?id=${p._id}'">
      <div style="position:relative;aspect-ratio:1;background:var(--surface-2);border-radius:12px;overflow:hidden;margin-bottom:8px">
        ${img
          ? `<img src="${img}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover" loading="lazy">`
          : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:48px">${getCategoryEmoji(p.category)}</div>`
        }
        ${p.stock === 0 ? `<div style="position:absolute;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px">Hết hàng</div>` : ''}
        <button onclick="event.stopPropagation();Market.quickAdd('${p._id}','${p.name}',${p.price})"
          style="position:absolute;bottom:8px;right:8px;background:var(--primary);border:none;border-radius:50%;width:32px;height:32px;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;box-shadow:0 2px 8px rgba(124,92,252,.4)">
          +
        </button>
      </div>
      <div style="padding:0 2px">
        <div style="font-size:13px;font-weight:600;line-height:1.3;margin-bottom:4px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${p.name}</div>
        <div style="color:var(--primary);font-weight:700;font-size:15px">${formatPrice(p.price)}</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px">
          <span style="font-size:11px;color:var(--text-soft)">${stars} ${soldText}</span>
          ${p.seller ? `<span style="font-size:11px;color:var(--text-soft)">@${p.seller.username}</span>` : ''}
        </div>
      </div>
    </div>`;
  }

  function getCategoryEmoji(cat) {
    const map = { fashion:'👗', electronics:'📱', food:'🍜', beauty:'💄', home:'🏠', sports:'⚽', books:'📚', toys:'🧸' };
    return map[cat] || '📦';
  }

  function formatCount(n) {
    if (n >= 1000) return (n/1000).toFixed(1).replace('.0','') + 'k';
    return n.toString();
  }

  /* ── Load products ── */
  async function loadProducts(reset = false) {
    if (loading || (!hasMore && !reset)) return;
    if (reset) { currentPage = 1; hasMore = true; }
    loading = true;

    const gridEl = document.getElementById('gridContent');
    const skelEl = document.getElementById('gridSkeleton');
    if (!gridEl) return;

    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 12,
        sort: currentSort,
        ...(currentCategory && { category: currentCategory }),
      });

      const res = await fetch(`${API()}/products?${params}`, { headers: authHeader() });
      const data = await res.json();
      const products = data.products || [];
      hasMore = data.hasMore;

      if (skelEl) skelEl.style.display = 'none';
      gridEl.classList.remove('hidden');

      if (reset) gridEl.innerHTML = '';

      if (products.length === 0 && currentPage === 1) {
        gridEl.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-soft)">
          <div style="font-size:48px;margin-bottom:12px">🛍️</div>
          <div style="font-weight:600">Không có sản phẩm</div>
          <div style="font-size:13px;margin-top:6px">Thử danh mục khác nhé!</div>
        </div>`;
        return;
      }

      gridEl.insertAdjacentHTML('beforeend', products.map(renderCard).join(''));
      currentPage++;
    } catch (err) {
      console.error('Market error:', err);
      if (skelEl) skelEl.style.display = 'none';
      gridEl.classList.remove('hidden');
      if (currentPage === 1) gridEl.innerHTML = renderDemoProducts();
    } finally {
      loading = false;
    }
  }

  /* ── Quick add to cart ── */
  function quickAdd(id, name, price) {
    const cart = JSON.parse(localStorage.getItem('ss_cart') || '[]');
    const existing = cart.find(i => i.id === id);
    if (existing) {
      existing.qty = (existing.qty || 1) + 1;
    } else {
      cart.push({ id, name, price, qty: 1 });
    }
    localStorage.setItem('ss_cart', JSON.stringify(cart));
    updateCartBadge();
    toast(`Đã thêm "${name.substring(0,20)}..." vào giỏ`, 'success');
  }

  /* ── Filter by category ── */
  function filterCategory(el, category) {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    if (el) el.classList.add('active');
    currentCategory = category || '';
    loadProducts(true);
  }

  /* ── Sort ── */
  function sortBy(value) {
    currentSort = value;
    loadProducts(true);
  }

  /* ── Search (debounced) ── */
  let searchTimer;
  function handleSearch(q) {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(async () => {
      if (!q.trim()) { loadProducts(true); return; }
      const gridEl = document.getElementById('gridContent');
      const skelEl = document.getElementById('gridSkeleton');
      if (skelEl) skelEl.style.display = '';
      if (gridEl) gridEl.innerHTML = '';
      try {
        const res = await fetch(`${API()}/products?search=${encodeURIComponent(q)}&limit=20`, { headers: authHeader() });
        const data = await res.json();
        if (skelEl) skelEl.style.display = 'none';
        gridEl.classList.remove('hidden');
        if (!data.products?.length) {
          gridEl.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-soft)"><div style="font-size:40px">🔍</div><div>Không tìm thấy sản phẩm cho "<strong>${q}</strong>"</div></div>`;
          return;
        }
        gridEl.innerHTML = data.products.map(renderCard).join('');
      } catch { loadProducts(true); }
    }, 400);
  }

  /* ── Infinite scroll ── */
  function setupInfiniteScroll() {
    window.addEventListener('scroll', () => {
      const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
      if (scrollTop + clientHeight >= scrollHeight - 300) loadProducts();
    });
  }

  /* ── Demo fallback ── */
  function renderDemoProducts() {
    const demos = [
      { _id:'d1', name:'Áo thun oversize unisex 2024', price:199000, images:[], category:'fashion', sold:234, rating:4.8, seller:{username:'fashion_store'} },
      { _id:'d2', name:'Tai nghe Bluetooth không dây', price:450000, images:[], category:'electronics', sold:89, rating:4.5, seller:{username:'tech_vn'} },
      { _id:'d3', name:'Kem dưỡng ẩm Hàn Quốc', price:280000, images:[], category:'beauty', sold:567, rating:4.9, seller:{username:'beauty_shop'} },
      { _id:'d4', name:'Giày sneaker nam nữ', price:650000, images:[], category:'fashion', sold:123, rating:4.7, seller:{username:'shoe_world'} },
      { _id:'d5', name:'Bình giữ nhiệt 500ml', price:159000, images:[], category:'home', sold:345, rating:4.6, seller:{username:'home_deco'} },
      { _id:'d6', name:'Sách "Tư duy nhanh và chậm"', price:89000, images:[], category:'books', sold:201, rating:4.9, seller:{username:'book_store'} },
    ];
    return demos.map(renderCard).join('');
  }

  /* ── Init ── */
  function init() {
    loadProducts(true);
    setupInfiniteScroll();

    // Wire up search if exists on page
    const searchInput = document.querySelector('.marketplace-search, input[data-market-search]');
    if (searchInput) {
      searchInput.addEventListener('input', e => handleSearch(e.target.value));
    }
  }

  return { init, loadProducts, filterCategory, sortBy, handleSearch, quickAdd };
})();

window.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('gridContent') || document.getElementById('gridSkeleton')) {
    Market.init();
  }
});
