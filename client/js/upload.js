/**
 * SocialShop — Upload Helper (Package 6)
 * Client-side: upload ảnh lên /api/upload/* và trả về URL.
 *
 * Cách dùng:
 *   import { uploadImage, uploadAvatar } from './upload.js';
 *   const url = await uploadImage(fileInputElement.files[0]);
 */

const { API_BASE_URL } = window;

/**
 * Upload ảnh bất kỳ (post, story, product)
 * @param {File} file
 * @returns {Promise<string>} URL ảnh
 */
async function uploadImage(file) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Chưa đăng nhập');

  const form = new FormData();
  form.append('image', file);

  const res = await fetch(`${API_BASE_URL}/upload/image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Upload thất bại');
  return data.url;
}

/**
 * Upload avatar và cập nhật thông tin user trong localStorage
 * @param {File} file
 * @returns {Promise<string>} URL avatar mới
 */
async function uploadAvatar(file) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Chưa đăng nhập');

  const form = new FormData();
  form.append('image', file);

  const res = await fetch(`${API_BASE_URL}/upload/avatar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Upload thất bại');

  // Cập nhật cache user
  const cached = JSON.parse(localStorage.getItem('user') || '{}');
  cached.avatar = data.url;
  localStorage.setItem('user', JSON.stringify(cached));

  return data.url;
}

/**
 * Upload ảnh bìa trang cá nhân
 */
async function uploadCover(file) {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Chưa đăng nhập');

  const form = new FormData();
  form.append('image', file);

  const res = await fetch(`${API_BASE_URL}/upload/cover`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Upload thất bại');
  return data.url;
}

/**
 * Hiển thị preview ảnh trước khi upload
 * @param {File} file
 * @param {HTMLImageElement} imgEl — phần tử <img> để preview
 */
function previewFile(file, imgEl) {
  const reader = new FileReader();
  reader.onload = e => { imgEl.src = e.target.result; };
  reader.readAsDataURL(file);
}

/**
 * Tạo input ảnh ẩn + trigger khi click vào element bất kỳ
 * @param {HTMLElement} triggerEl — element click để chọn file
 * @param {Function} onFile — callback(file: File)
 */
function bindImagePicker(triggerEl, onFile) {
  const input = document.createElement('input');
  input.type   = 'file';
  input.accept = 'image/*';
  input.style  = 'display:none';
  document.body.appendChild(input);

  triggerEl.style.cursor = 'pointer';
  triggerEl.addEventListener('click', () => input.click());
  input.addEventListener('change', () => {
    if (input.files[0]) onFile(input.files[0]);
    input.value = ''; // reset để chọn lại cùng file
  });
}

// Expose ra window để dùng từ inline script trong HTML
window.SSUpload = { uploadImage, uploadAvatar, uploadCover, previewFile, bindImagePicker };
