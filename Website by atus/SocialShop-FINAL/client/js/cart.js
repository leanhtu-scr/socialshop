/* =========================================================
   SocialShop — cart.js  (Package 7)
   Giỏ hàng + Checkout + Payment redirect.
   ========================================================= */

const CartPage = (() => {
  const API = () => window.API_BASE_URL || 'http://localhost:5000/api';

  function authHeader() {
    const token = localStorage.getItem('ss_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  function formatPrice(n) {
    return Number(n).toLocaleString('vi-VN') + '₫';
  }

  function getCart() {
    return JSON.parse(localStorage.getItem('ss_cart') || '[]');
  }

  function saveCart(cart) {
    localStorage.setItem('ss_cart', JSON.stringify(cart));
    updateCartBadge();
  }

  /* ── Render cart ── */
  function render() {
    const cart = getCart();
    const contentEl = document.getElementById('cartContent');
    const emptyEl   = document.getElementById('cartEmpty');
    const summaryEl = document.getElementById('cartSummary');

    if (!cart.length) {
      if (contentEl) contentEl.style.display = 'none';
      if (summaryEl) summaryEl.style.display = 'none';
      if (emptyEl)   emptyEl.style.display   = '';
      return;
    }

    if (emptyEl)   emptyEl.style.display   = 'none';
    if (contentEl) contentEl.style.display = '';
    if (summaryEl) summaryEl.style.display = '';

    const total = cart.reduce((s, i) => s + i.price * (i.qty || 1), 0);
    const count = cart.reduce((s, i) => s + (i.qty || 1), 0);

    if (contentEl) {
      contentEl.innerHTML = cart.map((item, idx) => `
        <div style="display:flex;gap:12px;padding:14px 0;border-bottom:1px solid var(--border);align-items:center">
          <div style="width:72px;height:72px;border-radius:10px;overflow:hidden;flex-shrink:0;background:var(--surface-2)">
            ${item.image
              ? `<img src="${item.image}" style="width:100%;height:100%;object-fit:cover" loading="lazy">`
              : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:32px">📦</div>`
            }
          </div>
          <div style="flex:1;min-width:0">
            <div style="font-weight:600;font-size:14px;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${item.name}</div>
            <div style="color:var(--primary);font-weight:700">${formatPrice(item.price)}</div>
            <div style="display:flex;align-items:center;gap:10px;margin-top:6px">
              <button onclick="CartPage.changeQty(${idx},-1)"
                style="width:28px;height:28px;border-radius:50%;border:1px solid var(--border);background:var(--surface);cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center">−</button>
              <span style="font-weight:600;min-width:20px;text-align:center">${item.qty || 1}</span>
              <button onclick="CartPage.changeQty(${idx},1)"
                style="width:28px;height:28px;border-radius:50%;border:1px solid var(--border);background:var(--surface);cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center">+</button>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">
            <span style="font-weight:700;color:var(--primary)">${formatPrice(item.price * (item.qty || 1))}</span>
            <button onclick="CartPage.removeItem(${idx})"
              style="padding:4px 10px;border-radius:6px;border:1px solid var(--border);background:none;color:var(--text-soft);font-size:12px;cursor:pointer">Xóa</button>
          </div>
        </div>`).join('');
    }

    // Summary
    const totalEl = document.getElementById('cartTotal');
    const countEl = document.getElementById('cartCount');
    if (totalEl) totalEl.textContent = formatPrice(total);
    if (countEl) countEl.textContent = `${count} sản phẩm`;
  }

  /* ── Change qty ── */
  function changeQty(idx, delta) {
    const cart = getCart();
    cart[idx].qty = Math.max(1, (cart[idx].qty || 1) + delta);
    saveCart(cart);
    render();
  }

  /* ── Remove item ── */
  function removeItem(idx) {
    const cart = getCart();
    const name = cart[idx].name;
    cart.splice(idx, 1);
    saveCart(cart);
    render();
    toast(`Đã xóa "${name.substring(0,20)}" khỏi giỏ`, 'accent');
  }

  /* ── Checkout ── */
  async function checkout(method = 'cod') {
    const me = JSON.parse(localStorage.getItem('ss_user') || 'null');
    if (!me) {
      toast('Vui lòng đăng nhập để thanh toán', 'accent');
      setTimeout(() => window.location.href = 'login.html', 800);
      return;
    }

    const cart = getCart();
    if (!cart.length) { toast('Giỏ hàng trống', 'accent'); return; }

    const address = document.getElementById('deliveryAddress')?.value.trim();
    if (!address) { toast('Vui lòng nhập địa chỉ giao hàng', 'accent'); return; }

    const total = cart.reduce((s, i) => s + i.price * (i.qty || 1), 0);

    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) { checkoutBtn.disabled = true; checkoutBtn.textContent = 'Đang xử lý...'; }

    try {
      // 1. Create order
      const orderRes = await fetch(`${API()}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({
          items: cart.map(i => ({ product: i.id, quantity: i.qty || 1, price: i.price })),
          totalAmount: total,
          shippingAddress: address,
          paymentMethod: method,
        })
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.message);

      const orderId = orderData.order?._id;

      if (method === 'cod') {
        // Clear cart & redirect
        saveCart([]);
        toast('✅ Đặt hàng thành công! Thanh toán khi nhận hàng.', 'success');
        setTimeout(() => window.location.href = `order-detail.html?id=${orderId}`, 1000);
        return;
      }

      // 2. For VNPay/MoMo: call payment API
      const payRes = await fetch(`${API()}/payment/${method}/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ orderId, amount: total })
      });
      const payData = await payRes.json();
      if (!payRes.ok) throw new Error(payData.message);

      // 3. Redirect to payment gateway
      saveCart([]);
      window.location.href = payData.payUrl || payData.pay_url || payData.qrCodeUrl;
    } catch (err) {
      toast(err.message || 'Thanh toán thất bại, vui lòng thử lại', 'accent');
      if (checkoutBtn) { checkoutBtn.disabled = false; checkoutBtn.textContent = 'Đặt hàng'; }
    }
  }

  /* ── Init ── */
  function init() {
    render();

    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', () => checkout('cod'));
    }

    const vnpayBtn = document.getElementById('vnpayBtn');
    if (vnpayBtn) vnpayBtn.addEventListener('click', () => checkout('vnpay'));

    const momoBtn = document.getElementById('momoBtn');
    if (momoBtn) momoBtn.addEventListener('click', () => checkout('momo'));
  }

  return { init, changeQty, removeItem, checkout };
})();

window.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('cartContent') || document.getElementById('cartEmpty')) {
    CartPage.init();
  }
});
