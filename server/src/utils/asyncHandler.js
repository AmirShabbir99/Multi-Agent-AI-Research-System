'use strict';

/**
 * Wraps an async controller so thrown/rejected errors reach `error.middleware.js`
 * instead of crashing the process or requiring try/catch in every controller.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
