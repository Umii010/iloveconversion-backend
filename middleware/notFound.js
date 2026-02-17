/**
 * 404 Not Found handler - catches all unmatched routes
 * Must be registered AFTER all valid routes, BEFORE the error handler
 */
const { HTTP } = require('../utils/errors');

function notFoundHandler(req, res, next) {
  res.status(HTTP.NOT_FOUND).json({
    success: false,
    error: 'The requested endpoint was not found.',
    code: 'NOT_FOUND',
    path: req.originalUrl,
  });
}

module.exports = notFoundHandler;
