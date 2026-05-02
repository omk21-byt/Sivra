const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
  // Safe fallbacks in case req is partially missing
  const method = req?.method || 'UNKNOWN_METHOD';
  const path = req?.originalUrl || req?.path || 'UNKNOWN_PATH';

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Structured logging (better for debugging + production logs)
  logger.error({
    message: err.message,
    method,
    path,
    stack: err.stack,
    statusCode,
  });

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
