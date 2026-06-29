/* =========================================================
   SocialShop — app.js
   Shared interactivity for every page (vanilla JS, no deps).
   ========================================================= */

// ---------- Theme ----------
(function initTheme(){
  const saved = localStorage.getItem('ss_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
})();

function toggleTheme(){
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('ss_theme', next);
  const btn = document.getElementById('themeBtn');
  if(btn) btn.textContent = next === 'dark' ? '🌙' : '☀️';
}

// ---------- Toast ----------
function toast(message, type = 'success'){
  let stack = document.querySelector('.toast-stack');
  if(!stack){
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span class="dot-${type}"></span><span>${message}</span>`;
  stack.appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 220);
  }, 2200);
}

// ---------- Skeleton -> content ----------
function revealContent(skeletonId, contentId, delay = 900){
  const skel = document.getElementById(skeletonId);
  const content = document.getElementById(contentId);
  if(!skel || !content) return;
  setTimeout(() => {
    skel.classList.add('hidden');
    content.classList.remove('hidden');
  }, delay);
}

// ---------- Like button ----------
function toggleLike(btn){
  const liked = btn.classList.toggle('liked');
  const countEl = btn.querySelector('.like-count');
  if(countEl){
    let n = parseInt(countEl.textContent.replace(/[^\d]/g,''), 10) || 0;
    countEl.textContent = formatCount(liked ? n + 1 : Math.max(0, n - 1));
  }
  if(liked) toast('Đã thích bài viết', 'success');
}

function formatCount(n){
  if(n >= 1000) return (n/1000).toFixed(1).replace('.0','') + 'k';
  return n.toString();
}

// ---------- Save / bookmark ----------
function toggleSave(btn){
  const saved = btn.classList.toggle('liked');
  toast(saved ? 'Đã lưu bài viết' : 'Đã bỏ lưu', saved ? 'success' : 'accent');
}

// ---------- Cart (shared across marketplace) ----------
function getCart(){
  return JSON.parse(localStorage.getItem('ss_cart') || '[]');
}
function addToCart(name, price){
  const cart = getCart();
  cart.push({ name, price, ts: Date.now() });
  localStorage.setItem('ss_cart', JSON.stringify(cart));
  updateCartBadge();
  toast(`Đã thêm "${name}" vào giỏ hàng`, 'success');
}
function updateCartBadge(){
  const badge = document.querySelector('.cart-fab .count');
  if(badge) badge.textContent = getCart().length;
}

// ---------- Chip filter (marketplace categories) ----------
function selectChip(el){
  el.parentElement.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
}

// ---------- Bottom nav active state ----------
(function markActiveNav(){
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item').forEach(item => {
    const target = item.getAttribute('data-page');
    if(target === path) item.classList.add('active');
  });
})();

// ---------- Story bar: tap to open viewer-ish toast (placeholder for real viewer) ----------
function openStory(name){
  toast(`Story của ${name}`, 'success');
}

// ---------- Footer day counter ----------
// Mốc khởi tạo website: tính lùi sao cho đúng 427 ngày tại thời điểm bàn giao.
// Mỗi ngày trôi qua, số ngày sẽ tự tăng lên (tính theo ngày thực của máy người dùng).
const SITE_START_DATE = new Date('2025-04-27T00:00:00');

function renderFooterDayCount(){
  const el = document.getElementById('footerDayCount');
  if(!el) return;
  const diffMs = Date.now() - SITE_START_DATE.getTime();
  const days = Math.max(0, Math.floor(diffMs / 86400000));
  el.textContent = `${days} ngày xây dựng`;
}

window.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  renderFooterDayCount();
  const themeBtn = document.getElementById('themeBtn');
  if(themeBtn) themeBtn.textContent = document.documentElement.getAttribute('data-theme') === 'dark' ? '🌙' : '☀️';
});
