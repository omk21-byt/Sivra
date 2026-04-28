const logger = require('../utils/logger');

module.exports = (err, req, res, next) => {
  logger.error(`[${req.method}] ${req.path} → ${err.message}`);

  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
