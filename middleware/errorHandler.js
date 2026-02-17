/**
 * Centralized error handling middleware.
 * Catches sync/async errors and returns consistent JSON responses.
 */
const { formatErrorResponse, getFriendlyMessage, HTTP } = require('../utils/errors');

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Wraps async route handlers - catches promise rejections and forwards to error handler
 * Use: router.get('/path', asyncHandler(controller.method))
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Main error handling middleware - must be registered AFTER all routes
 */
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || err.status || 500;
  const { body } = formatErrorResponse(err, isDev);

  if (statusCode >= 500) {
    console.error('Server error:', err.message || err);
    if (isDev && err.stack) console.error(err.stack);
  } else if (statusCode >= 400) {
    console.warn(`Client error ${statusCode}:`, err.message || err);
  }

  const userMessage = body.message || getFriendlyMessage(err);
  const response = {
    success: false,
    error: userMessage,
    code: body.code,
  };

  if (isDev && err.stack) {
    response.details = err.message;
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

/**
 * Handle multer errors with user-friendly messages
 */
function multerErrorHandler(err, req, res, next) {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(HTTP.BAD_REQUEST).json({
      success: false,
      error: err.message || 'File too large. Please check size limits.',
      code: 'FILE_TOO_LARGE',
    });
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(HTTP.BAD_REQUEST).json({
      success: false,
      error: err.message || 'Too many files. Please check file count limits.',
      code: 'MAX_FILES_EXCEEDED',
    });
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(HTTP.BAD_REQUEST).json({
      success: false,
      error: err.message || 'Unexpected file or field name. Please check the form.',
      code: 'INVALID_FIELD_NAME',
    });
  }
  next(err);
}

module.exports = {
  asyncHandler,
  errorHandler,
  multerErrorHandler,
};
