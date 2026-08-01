'use strict';

const rateLimit = require('express-rate-limit');
const config = require('../config/env');

const handler = (req, res) => {
  res.status(429).json({
    success: false,
    message: 'Too many requests. Please slow down and try again shortly.',
    errorCode: 'rate_limited',
  });
};

const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

// Auth endpoints get a much tighter limit to slow down credential stuffing / brute force.
const authLimiter = rateLimit({
  windowMs: config.rateLimit.authWindowMs,
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  skipSuccessfulRequests: true,
});

module.exports = { apiLimiter, authLimiter };
