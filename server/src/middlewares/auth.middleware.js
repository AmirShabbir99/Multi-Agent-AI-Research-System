'use strict';

const userRepository = require('../repositories/user.repository');
const { verifyToken } = require('../utils/tokens');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw ApiError.unauthorized('Authentication token missing. Include: Authorization: Bearer <token>');
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Session expired. Please log in again.' : 'Invalid token.';
    throw ApiError.unauthorized(message);
  }

  const user = await userRepository.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('User account no longer exists.');
  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated.');

  req.user = user; // full Mongoose doc - controllers may need more than the JWT payload carries
  next();
});

module.exports = authenticate;
