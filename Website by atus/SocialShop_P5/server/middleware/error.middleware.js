/* eslint-disable no-unused-vars */

function notFound(req, res, next) {
  res.status(404).json({ message: `Không tìm thấy đường dẫn: ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  console.error(err);

  // Lỗi trùng key (unique) của Mongo, ví dụ email/username đã tồn tại
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'Giá trị';
    return res.status(409).json({ message: `${field} đã được sử dụng` });
  }

  // Lỗi validate của Mongoose
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
    return res.status(400).json({ message });
  }

  const status = err.statusCode || 500;
  res.status(status).json({ message: err.message || 'Lỗi server' });
}

module.exports = { notFound, errorHandler };
