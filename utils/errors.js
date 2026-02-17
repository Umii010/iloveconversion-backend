/**
 * Centralized error handling utilities.
 * Provides consistent error response structure and user-friendly messages.
 */

/** HTTP status codes */
const HTTP = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL: 500,
  BAD_GATEWAY: 502,
  UNAVAILABLE: 503,
};

/** User-facing error messages - avoid exposing internal details in production */
const MESSAGES = {
  [HTTP.BAD_REQUEST]: 'Invalid request. Please check your input.',
  [HTTP.UNAUTHORIZED]: 'Please sign in to continue.',
  [HTTP.FORBIDDEN]: 'You do not have permission to perform this action.',
  [HTTP.NOT_FOUND]: 'The requested resource was not found.',
  [HTTP.CONFLICT]: 'A conflict occurred. The resource may already exist.',
  [HTTP.UNPROCESSABLE]: 'Unable to process the request. Please verify your data.',
  [HTTP.TOO_MANY_REQUESTS]: 'Too many requests. Please try again later.',
  [HTTP.INTERNAL]: 'Something went wrong. Please try again later.',
  [HTTP.BAD_GATEWAY]: 'Service temporarily unavailable. Please try again.',
  [HTTP.UNAVAILABLE]: 'Service is temporarily unavailable. Please try again later.',
};

/**
 * Custom application error with status code and user message
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || `ERR_${statusCode}`;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Format error for JSON response - consistent structure across API
 * @param {Error|AppError} err - The error object
 * @param {boolean} isDev - Whether we're in development (expose more details)
 * @returns {object} Standardized error response
 */
function formatErrorResponse(err, isDev = false) {
  const statusCode = err.statusCode || err.status || 500;
  const genericMessage = MESSAGES[statusCode] || MESSAGES[HTTP.INTERNAL];

  const response = {
    success: false,
    error: genericMessage,
    code: err.code || `ERR_${statusCode}`,
  };

  if (err.message && (isDev || statusCode < 500)) {
    response.message = err.message;
  } else if (isDev && err.stack) {
    response.details = err.message;
    response.stack = err.stack;
  }

  return { statusCode, body: response };
}

/**
 * Get user-friendly message for common error types
 */
function getFriendlyMessage(err) {
  if (err.message && err.statusCode && err.statusCode < 500) {
    return err.message;
  }
  if (err.code === 'ENOENT') return 'File or resource not found.';
  if (err.code === 'EACCES') return 'Permission denied.';
  if (err.code === 'ECONNREFUSED') return 'Service temporarily unavailable.';
  if (err.code === 'ETIMEDOUT') return 'Request timed out. Please try again.';
  if (err.code === 'LIMIT_FILE_SIZE') return 'File too large. Please check size limits.';
  if (err.code === 'LIMIT_FILE_COUNT') return 'Too many files. Please check file count limits.';
  if (err.code === 'LIMIT_UNEXPECTED_FILE') return 'Unexpected file or field name.';
  if (err.code === 'ER_DUP_ENTRY') return 'This record already exists.';
  if (err.code === 'ER_NO_SUCH_TABLE') return 'Database configuration error. Please contact support.';
  if (err.code === 'ER_ACCESS_DENIED_ERROR') return 'Database access error. Please contact support.';
  return MESSAGES[500];
}

module.exports = {
  HTTP,
  MESSAGES,
  AppError,
  formatErrorResponse,
  getFriendlyMessage,
};
