'use strict';

class ApiError extends Error {
  /**
   * @param {number} statusCode
   * @param {string} message
   * @param {string} errorCode - machine-readable code, mirrors the AI service's error envelope
   * @param {any} [details]
   */
  constructor(statusCode, message, errorCode = 'error', details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true; // distinguishes expected errors from real bugs, see error.middleware.js
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, details = null) {
    return new ApiError(400, message, 'bad_request', details);
  }

  static unauthorized(message = 'Unauthorized') {
    return new ApiError(401, message, 'unauthorized');
  }

  static forbidden(message = 'Forbidden') {
    return new ApiError(403, message, 'forbidden');
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message, 'not_found');
  }

  static conflict(message, details = null) {
    return new ApiError(409, message, 'conflict', details);
  }

  static tooManyRequests(message = 'Too many requests') {
    return new ApiError(429, message, 'rate_limited');
  }

  static internal(message = 'Internal server error', details = null) {
    return new ApiError(500, message, 'internal_error', details);
  }

  static badGateway(message = 'Upstream service error', details = null) {
    return new ApiError(502, message, 'bad_gateway', details);
  }
}

module.exports = ApiError;
