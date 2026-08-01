'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Single-token JWT auth: one signed token carries everything the API needs
 * (user id, role, email) and is verified statelessly on every request - no
 * refresh token, no server-side token storage.
 */
function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role, email: user.email }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret);
}

module.exports = { signToken, verifyToken };
