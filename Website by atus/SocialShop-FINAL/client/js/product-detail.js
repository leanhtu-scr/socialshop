/* =========================================================
   SocialShop — product-detail.js  (Package 7)
   Chi tiết sản phẩm, thêm giỏ hàng, đánh giá.
   ========================================================= */

const ProductDetail = (() => {
  const API = () => window.API_BASE_URL || 'http://localhost:5000/api';
  let product = null;
  let selectedQty = 1;

  function authHeader() {
    const token = localStorage.getItem('ss_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  function formatPrice(n) {
    return Number(n).toLocaleString('vi-VN') + '₫';
  }

  /* ── Load product ── */
  async function load() {
    const id = new URLSearchParams(location.search).get('id');
    if (!id) return;

    const skelEl = document.getElementById('productSkeleton');
    const contentEl = document.getElementById('productContent');

    try {
      const res = await fetch(`${API()}/products/${id}`, { headers: authHeader() });
      const data = await res.json();
      product = data.product;
      if (!product) throw new Error('Not found');

      if (skelEl) skelEl.style.display = 'none';
      if (contentEl) contentEl.classList.remove('hidden');

      renderProduct(product);
    } catch (err) {
      if (skelEl) skelEl.style.display = 'none';
      if (contentEl) {
        contentEl.innerHTML = `<div style="text-align:center;padding:60px 20px;color:var(--text-soft)">
          <div style="font-size:48px">😕</div>
          <div style="margin-top:12px;font-weight:600">Không tìm thấy sản phẩm</div>
          <button onclick="history.back()" style="margin-top:16px;padding:10px 20px;border-radius:10px;border:none;background:var(--primary);color:#fff;cursor:pointer">Quay lại</button>
        </div>`;
        contentEl.classList.remove('hidden');
      }
    }
  }

  function renderProduct(p) {
    // Images gallery
    const galleryEl = document.getElementById('productGallery');
    if (galleryEl && p.images?.length) {
      galleryEl.innerHTML = `
        <div style="position:relative;aspect-ratio:1;border-radius:16px;overflow:hidden;background:var(--surface-2)">
          <img id="mainImg" src="${p.images[0]}" style="width:100%;height:100%;object-fit:cover" alt="${p.name}">
        </div>
        ${p.images.length > 1 ? `
        <div style="display:flex;gap:8px;margin-top:8px;overflow-x:auto;padding-bottom:4px">
          ${p.images.map((img, i) => `
            <img src="${img}" onclick="document.getElementById('mainImg').src='${img}'"
              style="width:64px;height:64px;border-radius:8px;object-fit:cover;cursor:pointer;border:2px solid ${i===0?'var(--primary)':'transparent'};flex-shrink:0" loading="lazy">`
          ).join('')}
        </div>` : ''}`;
    } else if (galleryEl) {
      galleryEl.innerHTML = `<div style="aspect-ratio:1;border-radius:16px;background:var(--surface-2);display:flex;align-items:center;justify-content:center;font-size:80px">📦</div>`;
    }

    // Title & price
    const titleEl = document.getElementById('productTitle');
    const priceEl = document.getElementById('productPrice');
    const stockEl = document.getElementById('productStock');
    const descEl  = document.getElementById('productDesc');
    const sellerEl = document.getElementById('productSeller');

    if (titleEl) titleEl.textContent = p.name;
    if (priceEl) priceEl.textContent = formatPrice(p.price);
    if (stockEl) {
      stockEl.textContent = p.stock > 0 ? `Còn ${p.stock} sản phẩm` : 'Hết hàng';
      stockEl.style.color = p.stock > 0 ? '#22c55e' : '#ef4444';
    }
    if (descEl) descEl.textContent = p.description || 'Chưa có mô tả';
    if (sellerEl) sellerEl.textContent = `@${p.seller?.username || 'shop'}`;

    // Document title
    document.title = `${p.name} — SocialShop`;

    // Disable add-to-cart if out of stock
    const addBtn = document.getElementById('addToCartBtn');
    if (addBtn && p.stock === 0) {
      addBtn.disabled = true;
      addBtn.textContent = 'Hết hàng';
    }

    // Reviews
    renderReviews(p.reviews || []);
  }

  function renderReviews(reviews) {
    const reviewsEl = document.getElementById('reviewsList');
    if (!reviewsEl) return;

    if (!reviews.length) {
      reviewsEl.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-soft)">
        <div style="font-size:32px;margin-bottom:6px">⭐</div>
        <div>Chưa có đánh giá nào</div>
      </div>`;
      return;
    }

    reviewsEl.innerHTML = reviews.map(r => `
      <div style="padding:12px 0;border-bottom:1px solid var(--border)">
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
          <div style="width:32px;height:32px;border-radius:50%;background:var(--grad);display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:13px">
            ${(r.user?.username||'?')[0].toUpperCase()}
          </div>
          <div>
            <div style="font-weight:600;font-size:13px">${r.user?.username || 'User'}</div>
            <div style="color:#f59e0b">${'⭐'.repeat(r.rating)}</div>
          </div>
        </div>
        <div style="font-size:13px;color:var(--text);line-height:1.5">${r.comment || ''}</div>
      </div>`).join('');
  }

  /* ── Cart ── */
  function addToCart() {
    if (!product) return;
    const cart = JSON.parse(localStorage.getItem('ss_cart') || '[]');
    const existing = cart.find(i => i.id === product._id);
    if (existing) {
      existing.qty = (existing.qty || 1) + selectedQty;
    } else {
      cart.push({
        id: product._id,
        name: product.name,
        price: product.price,
        image: product.images?.[0] || '',
        qty: selectedQty
      });
    }
    localStorage.setItem('ss_cart', JSON.stringify(cart));
    updateCartBadge();
    toast(`✅ Đã thêm ${selectedQty} sản phẩm vào giỏ!`, 'success');
  }

  function buyNow() {
    addToCart();
    setTimeout(() => window.location.href = 'cart.html', 300);
  }

  function changeQty(delta) {
    selectedQty = Math.max(1, Math.min(product?.stock || 99, selectedQty + delta));
    const qtyEl = document.getElementById('qtyDisplay');
    if (qtyEl) qtyEl.textContent = selectedQty;
  }

  /* ── Submit review ── */
  async function submitReview() {
    const me = JSON.parse(localStorage.getItem('ss_user') || 'null');
    if (!me) { toast('Vui lòng đăng nhập để đánh giá', 'accent'); return; }

    const rating = parseInt(document.querySelector('[data-rating].active')?.dataset.rating || '5', 10);
    const comment = document.getElementById('reviewText')?.value.trim();

    if (!comment) { toast('Vui lòng nhập nội dung đánh giá', 'accent'); return; }

    try {
      const res = await fetch(`${API()}/products/${product._id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ rating, comment })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast('✅ Đã gửi đánh giá!', 'success');
      document.getElementById('reviewText').value = '';
      // Reload product for updated reviews
      load();
    } catch (err) {
      toast(err.message || 'Gửi đánh giá thất bại', 'accent');
    }
  }

  /* ── Init ── */
  function init() {
    load();

    const addBtn = document.getElementById('addToCartBtn');
    if (addBtn) addBtn.addEventListener('click', addToCart);

    const buyBtn = document.getElementById('buyNowBtn');
    if (buyBtn) buyBtn.addEventListener('click', buyNow);

    const reviewBtn = document.getElementById('submitReviewBtn');
    if (reviewBtn) reviewBtn.addEventListener('click', submitReview);

    // Star rating picker
    document.querySelectorAll('[data-rating]').forEach(star => {
      star.addEventListener('click', () => {
        document.querySelectorAll('[data-rating]').forEach(s => s.classList.remove('active'));
        star.classList.add('active');
      });
    });
  }

  return { init, addToCart, buyNow, changeQty, submitReview };
})();

window.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('productContent') || document.getElementById('productSkeleton')) {
    ProductDetail.init();
  }
});
