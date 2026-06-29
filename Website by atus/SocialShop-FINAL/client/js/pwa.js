/**
 * SocialShop — PWA Helper (Package 6)
 * - Đăng ký Service Worker
 * - Hiển thị banner "Cài ứng dụng" khi trình duyệt hỗ trợ
 */

(function () {
  // ── Đăng ký Service Worker ──────────────────────────────────────────────
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.warn('SW registration failed:', err);
      });
    });
  }

  // ── Banner cài app (A2HS) ───────────────────────────────────────────────
  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;

    // Chỉ hiện nếu chưa cài (check localStorage)
    if (localStorage.getItem('pwa_dismissed')) return;

    showInstallBanner();
  });

  function showInstallBanner() {
    // Xóa banner cũ nếu có
    document.getElementById('pwa-banner')?.remove();

    const banner = document.createElement('div');
    banner.id = 'pwa-banner';
    banner.innerHTML = `
      <div class="pwa-banner-inner">
        <div class="pwa-banner-icon">🛍️</div>
        <div class="pwa-banner-text">
          <strong>Cài SocialShop</strong>
          <span>Trải nghiệm tốt hơn như app thật</span>
        </div>
        <button class="pwa-btn-install" id="pwaInstallBtn">Cài</button>
        <button class="pwa-btn-dismiss" id="pwaDismissBtn">✕</button>
      </div>
    `;
    document.body.appendChild(banner);

    // Animate in
    requestAnimationFrame(() => banner.classList.add('visible'));

    document.getElementById('pwaInstallBtn').addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        localStorage.setItem('pwa_dismissed', '1');
      }
      deferredPrompt = null;
      banner.remove();
    });

    document.getElementById('pwaDismissBtn').addEventListener('click', () => {
      localStorage.setItem('pwa_dismissed', '1');
      banner.classList.remove('visible');
      setTimeout(() => banner.remove(), 300);
    });
  }

  // Ẩn banner sau khi đã cài
  window.addEventListener('appinstalled', () => {
    localStorage.setItem('pwa_dismissed', '1');
    document.getElementById('pwa-banner')?.remove();
  });
})();
