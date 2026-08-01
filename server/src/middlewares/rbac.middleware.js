'use strict';

const ApiError = require('../utils/ApiError');

/**
 * Usage: router.get('/admin/stuff', authenticate, authorize('admin'), handler)
 * Must run after `authenticate` so req.user is populated.
 */
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return next(ApiError.unauthorized('Authentication required.'));
  }
  if (!allowedRoles.includes(req.user.role)) {
    return next(ApiError.forbidden(`This action requires one of the following roles: ${allowedRoles.join(', ')}.`));
  }
  next();
};

module.exports = authorize;
