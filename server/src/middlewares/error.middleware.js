'use strict';

const ApiError = require('../utils/ApiError');
const Log = require('../models/Log.model');
const logger = require('../config/logger');
const config = require('../config/env');

/** Normalizes known non-ApiError exception types (Mongoose, JWT, etc.) into an ApiError. */
function normalize(err) {
  if (err instanceof ApiError) return err;

  if (err.name === 'ValidationError') {
    // Mongoose schema validation
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return ApiError.badRequest('Validation failed.', details);
  }

  if (err.name === 'CastError') {
    return ApiError.badRequest(`Invalid value for '${err.path}'.`);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return ApiError.conflict(`A record with this ${field} already exists.`);
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return ApiError.unauthorized('Invalid or expired authentication token.');
  }

  if (err.type === 'entity.too.large') {
    return new ApiError(413, 'Request payload is too large.', 'payload_too_large');
  }

  // Unknown/unexpected - treat as a real bug, not something the client did wrong.
  return ApiError.internal(config.isProduction ? 'Something went wrong. Please try again.' : err.message);
}

// eslint-disable-next-line no-unused-vars
async function errorMiddleware(err, req, res, next) {
  const apiError = normalize(err);
  const isServerFault = apiError.statusCode >= 500;

  logger.log(isServerFault ? 'error' : 'warn', apiError.message, {
    path: req.originalUrl,
    method: req.method,
    statusCode: apiError.statusCode,
    errorCode: apiError.errorCode,
    userId: req.user?._id?.toString(),
    stack: err.stack,
  });

  // Persist server-fault errors so the admin panel can see them (routine 4xx client
  // errors aren't worth a DB write - they live in the Winston file logs only).
  if (isServerFault) {
    Log.create({
      level: 'error',
      message: apiError.message,
      stack: err.stack,
      path: req.originalUrl,
      method: req.method,
      statusCode: apiError.statusCode,
      user: req.user?._id || null,
    }).catch((logErr) => logger.error('Failed to persist error log', { error: logErr.message }));
  }

  res.status(apiError.statusCode).json({
    success: false,
    message: apiError.message,
    errorCode: apiError.errorCode,
    details: apiError.details,
    ...(config.isProduction ? {} : { stack: err.stack }),
  });
}

module.exports = errorMiddleware;
