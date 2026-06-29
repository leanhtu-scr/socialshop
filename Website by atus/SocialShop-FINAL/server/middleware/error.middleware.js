function notFound(req, res, next) {
  res.status(404).json({ message: `Route không tồn tại: ${req.originalUrl}` });
}

function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    message: err.message || 'Lỗi server',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = { notFound, errorHandler };
