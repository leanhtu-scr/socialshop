/* =========================================================
   SocialShop — auth.js
   Gọi API đăng ký / đăng nhập, lưu token vào localStorage.
   Cần nạp config.js (API_BASE_URL) và app.js (toast()) trước file này.
   ========================================================= */

function saveSession(user, token) {
  localStorage.setItem('ss_token', token);
  localStorage.setItem('ss_user', JSON.stringify(user));
}

function getSession() {
  const token = localStorage.getItem('ss_token');
  const user = JSON.parse(localStorage.getItem('ss_user') || 'null');
  return token && user ? { token, user } : null;
}

function clearSession() {
  localStorage.removeItem('ss_token');
  localStorage.removeItem('ss_user');
}

function logout() {
  clearSession();
  toast('Đã đăng xuất', 'accent');
  setTimeout(() => (window.location.href = computeHomePath()), 600);
}

// Tự dò xem trang hiện tại nằm trong /pages/ hay ở gốc, để link về đúng index.html
function computeHomePath() {
  return window.location.pathname.includes('/pages/') ? '../index.html' : 'index.html';
}

async function apiRequest(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const session = getSession();
    if (session) headers.Authorization = `Bearer ${session.token}`;
  }
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Có lỗi xảy ra, vui lòng thử lại');
  }
  return data;
}

async function handleRegister(form) {
  const submitBtn = form.querySelector('button[type="submit"]');
  const payload = {
    username: form.username.value.trim(),
    email: form.email.value.trim(),
    password: form.password.value,
    fullName: form.fullName.value.trim(),
  };
  try {
    setLoading(submitBtn, true);
    const data = await apiRequest('/auth/register', { method: 'POST', body: payload });
    saveSession(data.user, data.token);
    toast(`Chào mừng ${data.user.username}! Tạo tài khoản thành công`, 'success');
    setTimeout(() => (window.location.href = computeHomePath()), 700);
  } catch (err) {
    toast(err.message, 'accent');
  } finally {
    setLoading(submitBtn, false);
  }
}

async function handleLogin(form) {
  const submitBtn = form.querySelector('button[type="submit"]');
  const payload = {
    email: form.email.value.trim(),
    password: form.password.value,
  };
  try {
    setLoading(submitBtn, true);
    const data = await apiRequest('/auth/login', { method: 'POST', body: payload });
    saveSession(data.user, data.token);
    toast(`Chào mừng trở lại, ${data.user.username}!`, 'success');
    setTimeout(() => (window.location.href = computeHomePath()), 700);
  } catch (err) {
    toast(err.message, 'accent');
  } finally {
    setLoading(submitBtn, false);
  }
}

function setLoading(btn, loading){
  if(!btn) return;
  btn.disabled = loading;
  btn.dataset.label = btn.dataset.label || btn.textContent;
  btn.textContent = loading ? 'Đang xử lý...' : btn.dataset.label;
}

// Cập nhật icon 👤 ở top bar thành avatar/tên nếu đã đăng nhập
function refreshAuthUI() {
  const link = document.getElementById('authLink');
  if (!link) return;
  const session = getSession();
  const inPages = window.location.pathname.includes('/pages/');
  if (session) {
    link.textContent = '🟢';
    link.title = session.user.username;
    link.href = '#';
    link.onclick = (e) => { e.preventDefault(); logout(); };
  } else {
    link.textContent = '👤';
    link.title = 'Đăng nhập';
    link.href = inPages ? 'login.html' : 'pages/login.html';
    link.onclick = null;
  }
}

window.addEventListener('DOMContentLoaded', refreshAuthUI);
